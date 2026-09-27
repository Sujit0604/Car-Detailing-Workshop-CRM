const crypto = require("crypto");
const https = require("https");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const ApiError = require("../utils/ApiError.js");
const logger = require("../utils/logger.js");
const env = require("../config/env.js");
const Payment = require("../models/Payment.js");
const Invoice = require("../models/Invoice.js");
const Booking = require("../models/Booking.js");

const ONLINE_CONFIG_MESSAGE =
  "Razorpay online payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.";
const WEBHOOK_CONFIG_MESSAGE =
  "Razorpay webhooks are not configured. Set RAZORPAY_WEBHOOK_SECRET.";
const SDK_CONFIG_MESSAGE =
  "Razorpay SDK is unavailable. Install razorpay and configure Razorpay keys.";

const PAYMENT_STATUSES = [
  "CREATED",
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];
const SUCCESSFUL_PAYMENT_STATUSES = ["SUCCESS", "PARTIALLY_REFUNDED", "REFUNDED"];
const STAFF_ROLES = ["WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"];
const PAYMENT_POPULATE = [
  ["invoiceId", "invoiceNumber status pricing"],
  ["bookingId", "bookingNumber paymentStatus pricing"],
  ["customerId", "name email phone"],
  ["workshopId", "name code"],
];

const getIdString = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value);
  if (typeof value.toHexString === "function") return value.toHexString();
  if (value._id !== null && value._id !== undefined) return getIdString(value._id);
  if (value.id !== null && value.id !== undefined) return getIdString(value.id);
  if (typeof value.toString === "function") {
    const text = value.toString();
    if (text && text !== "[object Object]") return text;
  }
  return "";
};

const idsEqual = (first, second) => {
  const firstId = getIdString(first);
  const secondId = getIdString(second);
  return Boolean(firstId && secondId && firstId === secondId);
};

const getSafeInteger = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
};

const rupeesToMinor = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && !Number.isFinite(value)) return null;
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(minor) ? minor : null;
};

const minorToRupees = (amountMinor) => {
  const minor = getSafeInteger(amountMinor) || 0;
  return Math.round(minor) / 100;
};

const getPaymentAmountMinor = (payment) => {
  const direct = getSafeInteger(payment?.amountMinor);
  if (direct !== null) return direct;
  return rupeesToMinor(payment?.amount) || 0;
};

const getRefundEntries = (payment) => {
  const entries = Array.isArray(payment?.refunds) ? [...payment.refunds] : [];
  if (payment?.refund && !entries.some((entry) => idsEqual(entry?._id, payment.refund?._id))) {
    entries.push(payment.refund);
  }
  return entries;
};

const getRefundAmountMinor = (refund) => {
  const direct = getSafeInteger(refund?.amountMinor);
  if (direct !== null) return Math.max(0, direct);
  return Math.max(0, rupeesToMinor(refund?.amount) || 0);
};

const getRefundStatus = (refund) => String(refund?.status || "").toUpperCase();

const isSuccessfulRefund = (refund) => {
  const status = getRefundStatus(refund);
  if (["FAILED", "PENDING", "PROCESSING"].includes(status)) return false;
  if (["SUCCESS", "PROCESSED", "REFUNDED", "COMPLETED"].includes(status)) return true;
  return Boolean(refund?.refundedAt || refund?.gatewayRefundId);
};

const isReservedRefund = (refund) => {
  const status = getRefundStatus(refund);
  return status !== "FAILED";
};

const getSuccessfulRefundMinor = (payment) => {
  return getRefundEntries(payment)
    .filter(isSuccessfulRefund)
    .reduce((total, refund) => total + getRefundAmountMinor(refund), 0);
};

const getReservedRefundMinor = (payment) => {
  return getRefundEntries(payment)
    .filter(isReservedRefund)
    .reduce((total, refund) => total + getRefundAmountMinor(refund), 0);
};

const getNetPaymentMinor = (payment) => {
  if (!SUCCESSFUL_PAYMENT_STATUSES.includes(payment?.status)) return 0;
  return Math.max(0, getPaymentAmountMinor(payment) - getSuccessfulRefundMinor(payment));
};

const getInvoiceTotalMinor = (invoice) => {
  const value = invoice?.pricing?.grandTotal ?? invoice?.total;
  const amountMinor = rupeesToMinor(value);
  if (amountMinor === null || amountMinor < 0) {
    throw new ApiError(500, "Invoice has no valid payable amount");
  }
  return amountMinor;
};

const getBookingTotalMinor = (booking, invoice) => {
  const invoiceTotal = invoice ? getInvoiceTotalMinor(invoice) : null;
  if (invoiceTotal !== null) return invoiceTotal;
  const value = booking?.pricing?.total ?? booking?.total;
  const amountMinor = rupeesToMinor(value);
  return amountMinor !== null && amountMinor >= 0 ? amountMinor : 0;
};

const ensureRazorpayKeys = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(503, ONLINE_CONFIG_MESSAGE);
  }
};

const getRazorpayClient = () => {
  ensureRazorpayKeys();

  try {
    const Razorpay = require("razorpay");
    return new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  } catch (error) {
    throw new ApiError(503, SDK_CONFIG_MESSAGE);
  }
};

const ensureOnlineConfigured = () => getRazorpayClient();

const RAZORPAY_API_ORIGIN = "https://api.razorpay.com";
const REFUND_IDEMPOTENCY_HEADER = "X-Refund-Idempotency";
const REFUND_IDEMPOTENCY_MIN_LENGTH = 10;

const normalizeIdempotencyKey = (value) => {
  const key = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .slice(0, 128);
  if (key.length < REFUND_IDEMPOTENCY_MIN_LENGTH) return null;
  return key;
};

const requestRazorpayRefund = ({ paymentId, body, idempotencyKey }) => {
  ensureRazorpayKeys();

  const idempotencyKeyValue = normalizeIdempotencyKey(idempotencyKey);
  if (!idempotencyKeyValue) {
    throw new ApiError(500, "Refund idempotency key is invalid");
  }

  const payload = Buffer.from(JSON.stringify(body), "utf8");
  const url = new URL(`${RAZORPAY_API_ORIGIN}/v1/payments/${encodeURIComponent(paymentId)}/refund`);
  const credentials = Buffer.from(
    `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`,
    "utf8",
  ).toString("base64");

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        method: "POST",
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
          "Content-Length": payload.length,
          [REFUND_IDEMPOTENCY_HEADER]: idempotencyKeyValue,
        },
        timeout: 20000,
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch (error) {
            parsed = null;
          }

          const statusCode = response.statusCode || 502;
          if (statusCode >= 200 && statusCode < 300) {
            resolve(parsed || {});
            return;
          }

          const description =
            parsed?.error?.description ||
            parsed?.message ||
            (raw ? raw.slice(0, 200) : "Razorpay refund request failed");
          const error = new Error(description);
          error.statusCode = statusCode;
          error.description = description;
          reject(error);
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("Razorpay refund request timed out"));
    });
    request.on("error", reject);
    request.end(payload);
  });
};

const ensureWebhookConfigured = () => {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new ApiError(503, WEBHOOK_CONFIG_MESSAGE);
  }
};

const assertUser = (user) => {
  if (!user) throw new ApiError(401, "Unauthorized. Please login first.");
};

const assertAdmin = (user) => {
  assertUser(user);
  if (user.role !== "ADMIN") {
    throw new ApiError(403, "Only an administrator can perform this action");
  }
};

const assertStaff = (user) => {
  assertUser(user);
  if (user.role !== "ADMIN" && !STAFF_ROLES.includes(user.role)) {
    throw new ApiError(403, "Only workshop staff can perform this action");
  }
};

const assertInvoiceAccess = (invoice, user) => {
  assertUser(user);

  if (user.role === "ADMIN") return;

  if (user.role === "CUSTOMER") {
    if (!idsEqual(invoice?.customerId, user._id)) {
      throw new ApiError(403, "You do not have permission to access this invoice");
    }
    return;
  }

  if (!STAFF_ROLES.includes(user.role) || !idsEqual(invoice?.workshopId, user.workshopId)) {
    throw new ApiError(403, "This invoice does not belong to your workshop");
  }
};

const assertPaymentAccess = (payment, user) => {
  assertUser(user);

  if (user.role === "ADMIN") return;

  if (user.role === "CUSTOMER") {
    if (!idsEqual(payment?.customerId, user._id)) {
      throw new ApiError(403, "You do not have permission to access this payment");
    }
    return;
  }

  if (!STAFF_ROLES.includes(user.role) || !idsEqual(payment?.workshopId, user.workshopId)) {
    throw new ApiError(403, "This payment does not belong to your workshop");
  }
};

const assertInvoicePayable = (invoice, user) => {
  if (["DRAFT", "VOID"].includes(invoice?.status)) {
    throw new ApiError(400, "Invoice is not payable");
  }

  if (
    user.role === "CUSTOMER" &&
    !["ISSUED", "PARTIALLY_PAID"].includes(invoice?.status)
  ) {
    throw new ApiError(400, "Customer payments require an issued or partially paid invoice");
  }
};

const getPaymentsForInvoice = async (invoiceId) => {
  const payments = await Payment.find({
    invoiceId,
    status: { $in: SUCCESSFUL_PAYMENT_STATUSES },
  });
  return Array.isArray(payments) ? payments : [];
};

const getOutstandingMinorForInvoice = async (invoice) => {
  const totalMinor = getInvoiceTotalMinor(invoice);
  if (totalMinor <= 0) return 0;
  const payments = await getPaymentsForInvoice(invoice._id);
  const paidMinor = payments.reduce((total, payment) => total + getNetPaymentMinor(payment), 0);
  return Math.max(0, totalMinor - paidMinor);
};

const generatePaymentNumber = () =>
  `PAY-${new Date().getFullYear()}-${uuidv4().split("-")[0].toUpperCase()}`;

const populatePaymentQuery = (query) => {
  if (!query || typeof query.populate !== "function") return query;
  return PAYMENT_POPULATE.reduce(
    (result, [path, fields]) => result.populate(path, fields),
    query,
  );
};

const getPaymentById = async (paymentId) => {
  const query = Payment.findById(paymentId);
  return populatePaymentQuery(query);
};

const persistPayment = async (payment) => {
  if (typeof payment?.save === "function") {
    await payment.save();
    return payment;
  }

  if (payment?._id) {
    const updated = await Payment.findByIdAndUpdate(
      payment._id,
      { $set: payment },
      { new: true },
    );
    return updated || payment;
  }

  return payment;
};

const parseGatewayDate = (value) => {
  if (value === null || value === undefined) return new Date();
  let timestamp = value;
  if (typeof timestamp === "string" && /^\d+$/.test(timestamp)) timestamp = Number(timestamp);
  if (typeof timestamp === "number" && timestamp < 100000000000) timestamp *= 1000;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const getGatewayFailureReason = (gatewayPayment) =>
  gatewayPayment?.error_description ||
  gatewayPayment?.error_reason ||
  gatewayPayment?.failure_reason ||
  "Payment failed";

const getPaymentCurrency = (payment) => String(payment?.currency || "INR").toUpperCase();

const validateGatewayPayment = (payment, gatewayPayment, options = {}) => {
  const allowMissingPaymentId = options.allowMissingPaymentId === true;
  const gatewayPaymentId = gatewayPayment?.id ? String(gatewayPayment.id) : "";
  const gatewayOrderId = gatewayPayment?.order_id ? String(gatewayPayment.order_id) : "";
  const amountMinor = getSafeInteger(gatewayPayment?.amount);
  const currency = String(gatewayPayment?.currency || "").toUpperCase();

  if (!allowMissingPaymentId && !gatewayPaymentId) {
    throw new ApiError(400, "Razorpay payment id is missing");
  }
  if (!gatewayOrderId) throw new ApiError(400, "Razorpay order id is missing");
  if (amountMinor === null || amountMinor < 0) {
    throw new ApiError(400, "Razorpay payment amount is invalid");
  }
  if (!currency) throw new ApiError(400, "Razorpay payment currency is missing");

  if (payment.gatewayOrderId && gatewayOrderId !== String(payment.gatewayOrderId)) {
    throw new ApiError(400, "Razorpay order id does not match the stored order");
  }
  if (
    gatewayPaymentId &&
    payment.gatewayPaymentId &&
    gatewayPaymentId !== String(payment.gatewayPaymentId)
  ) {
    throw new ApiError(400, "Razorpay payment id does not match the stored payment");
  }
  if (amountMinor !== getPaymentAmountMinor(payment)) {
    throw new ApiError(400, "Razorpay payment amount does not match the invoice payment");
  }
  const capturedMinor =
    gatewayPayment.amount_captured === undefined || gatewayPayment.amount_captured === null
      ? null
      : getSafeInteger(gatewayPayment.amount_captured);
  if (capturedMinor !== null && capturedMinor !== amountMinor) {
    throw new ApiError(400, "Razorpay captured amount does not match the invoice payment");
  }
  if (currency !== getPaymentCurrency(payment)) {
    throw new ApiError(400, "Razorpay payment currency does not match the invoice payment");
  }

  return { gatewayPaymentId, gatewayOrderId, amountMinor, currency };
};

const getPaymentForGatewayId = async (gatewayPaymentId) => {
  if (!gatewayPaymentId) return null;
  return Payment.findOne({ gatewayPaymentId: String(gatewayPaymentId) });
};

const reconcileRazorpayPayment = async (payment, gatewayPayment, options = {}) => {
  const gatewayDetails = validateGatewayPayment(payment, gatewayPayment, options);
  let target = payment;

  if (gatewayDetails.gatewayPaymentId) {
    const existing = await getPaymentForGatewayId(gatewayDetails.gatewayPaymentId);
    if (existing && !idsEqual(existing._id, payment._id)) {
      if (!idsEqual(existing.invoiceId, payment.invoiceId)) {
        throw new ApiError(409, "Razorpay payment is already linked to another invoice");
      }
      target = existing;
    }
  }

  if (
    gatewayDetails.gatewayPaymentId &&
    target.gatewayPaymentId &&
    !idsEqual(target.gatewayPaymentId, gatewayDetails.gatewayPaymentId)
  ) {
    throw new ApiError(409, "Payment is linked to another Razorpay payment");
  }

  const status = String(gatewayPayment.status || "").toLowerCase();
  const isCaptured = status === "captured" || gatewayPayment.captured === true;
  const isFailed = status === "failed";
  const isRefundState = ["REFUNDED", "PARTIALLY_REFUNDED"].includes(target.status);

  target.gateway = "RAZORPAY";
  if (gatewayDetails.gatewayOrderId) {
    target.gatewayOrderId = gatewayDetails.gatewayOrderId;
  }
  if (gatewayDetails.gatewayPaymentId) {
    target.gatewayPaymentId = gatewayDetails.gatewayPaymentId;
  }
  target.currency = gatewayDetails.currency;

  if (gatewayPayment.method) target.method = String(gatewayPayment.method);
  if (options.signature) target.gatewaySignature = String(options.signature);

  target.metadata = {
    ...(target.metadata || {}),
    lastGatewayStatus: status || (isCaptured ? "captured" : "unknown"),
  };

  if (isCaptured) {
    if (!isRefundState) target.status = "SUCCESS";
    target.paidAt = target.paidAt || parseGatewayDate(gatewayPayment.created_at);
    target.failureReason = undefined;
  } else if (isFailed) {
    if (!["SUCCESS", "REFUNDED", "PARTIALLY_REFUNDED"].includes(target.status)) {
      target.status = "FAILED";
    }
    target.failureReason = getGatewayFailureReason(gatewayPayment);
  } else if (!["SUCCESS", "REFUNDED", "PARTIALLY_REFUNDED"].includes(target.status)) {
    target.status = "PENDING";
  }

  const savedPayment = await persistPayment(target);

  if (isCaptured) {
    await syncRelatedPaymentStatuses(savedPayment);
  }

  return savedPayment;
};

const reconcileOrderPaidWithoutPayment = async (payment, order) => {
  const orderId = order?.id ? String(order.id) : "";
  if (!orderId || (payment.gatewayOrderId && orderId !== String(payment.gatewayOrderId))) {
    throw new ApiError(400, "Razorpay order id does not match the stored order");
  }

  const orderStatus = String(order?.status || "paid").toLowerCase();
  if (orderStatus !== "paid") return payment;

  const amountMinor = getSafeInteger(order.amount_paid ?? order.amount);
  const currency = String(order.currency || getPaymentCurrency(payment)).toUpperCase();
  if (amountMinor === null || amountMinor !== getPaymentAmountMinor(payment)) {
    throw new ApiError(400, "Razorpay order amount does not match the invoice payment");
  }
  if (currency !== getPaymentCurrency(payment)) {
    throw new ApiError(400, "Razorpay order currency does not match the invoice payment");
  }

  if (payment.gatewayPaymentId) {
    return reconcileRazorpayPayment(payment, {
      id: payment.gatewayPaymentId,
      order_id: orderId,
      amount: amountMinor,
      currency,
      status: "captured",
      captured: true,
      created_at: order.created_at,
    });
  }

  if (["REFUNDED", "PARTIALLY_REFUNDED"].includes(payment.status)) return payment;

  payment.gateway = "RAZORPAY";
  payment.gatewayOrderId = orderId;
  payment.status = "SUCCESS";
  payment.paidAt = payment.paidAt || parseGatewayDate(order.created_at);
  payment.metadata = {
    ...(payment.metadata || {}),
    lastGatewayStatus: "paid",
  };
  const savedPayment = await persistPayment(payment);
  await syncRelatedPaymentStatuses(savedPayment);
  return savedPayment;
};

const getRefundStatusFromEntity = (refundEntity) =>
  String(refundEntity?.status || "processed").toLowerCase();

const isProcessedRefundStatus = (status) =>
  ["processed", "success", "successful", "refunded", "completed"].includes(
    String(status || "").toLowerCase(),
  );

const isFailedRefundStatus = (status) =>
  ["failed", "failure", "cancelled", "canceled"].includes(
    String(status || "").toLowerCase(),
  );

const getRefundReason = (refundEntity) =>
  refundEntity?.notes?.reason || refundEntity?.reason || "Refund requested";

const ensureRefundArray = (payment) => {
  if (!Array.isArray(payment.refunds)) payment.refunds = [];
  return payment.refunds;
};

const findRefundByGatewayId = (payment, gatewayRefundId) =>
  getRefundEntries(payment).find((refund) => idsEqual(refund.gatewayRefundId, gatewayRefundId));

const findPendingRefund = (payment, amountMinor, reason) =>
  getRefundEntries(payment).find(
    (refund) =>
      getRefundStatus(refund) === "PENDING" &&
      getRefundAmountMinor(refund) === amountMinor &&
      (!reason || getRefundReason(refund) === reason || !refund.reason),
  );

const getOtherReservedRefundMinor = (payment, currentRefund) => {
  return getRefundEntries(payment)
    .filter((refund) => refund !== currentRefund && isReservedRefund(refund))
    .reduce((total, refund) => total + getRefundAmountMinor(refund), 0);
};

const updatePaymentRefundStatus = (payment) => {
  const totalRefundMinor = getSuccessfulRefundMinor(payment);
  const amountMinor = getPaymentAmountMinor(payment);
  payment.status = totalRefundMinor >= amountMinor ? "REFUNDED" : "PARTIALLY_REFUNDED";
};

const reconcileRazorpayRefund = async (payment, refundEntity) => {
  const gatewayRefundId = refundEntity?.id ? String(refundEntity.id) : "";
  const gatewayPaymentId = refundEntity?.payment_id ? String(refundEntity.payment_id) : "";
  const amountMinor = getSafeInteger(refundEntity?.amount);
  const status = getRefundStatusFromEntity(refundEntity);

  if (!gatewayRefundId) throw new ApiError(400, "Razorpay refund id is missing");
  if (amountMinor === null || amountMinor <= 0) {
    throw new ApiError(400, "Razorpay refund amount is invalid");
  }
  if (gatewayPaymentId && payment.gatewayPaymentId && gatewayPaymentId !== String(payment.gatewayPaymentId)) {
    throw new ApiError(400, "Razorpay refund payment id does not match");
  }

  let refund = findRefundByGatewayId(payment, gatewayRefundId);
  if (!refund) refund = findPendingRefund(payment, amountMinor, getRefundReason(refundEntity));
  if (refund && getRefundAmountMinor(refund) !== amountMinor) {
    throw new ApiError(409, "Razorpay refund amount does not match the recorded refund");
  }

  if (!refund) {
    if (amountMinor > getPaymentAmountMinor(payment) - getReservedRefundMinor(payment)) {
      throw new ApiError(400, "Refund amount exceeds the unrefunded amount");
    }
    refund = {
      amount: minorToRupees(amountMinor),
      amountMinor,
      gatewayRefundId,
      reason: getRefundReason(refundEntity),
      idempotencyKey: refundEntity?.idempotencyKey,
      status: "PENDING",
    };
    ensureRefundArray(payment).push(refund);
  } else if (!refund.gatewayRefundId) {
    refund.gatewayRefundId = gatewayRefundId;
  }

  if (isFailedRefundStatus(status)) {
    refund.status = "FAILED";
    refund.failureReason = refundEntity?.error_description || "Razorpay refund failed";
    payment.gatewayRefundId = gatewayRefundId;
    await persistPayment(payment);
    return payment;
  }

  if (!isProcessedRefundStatus(status)) {
    refund.status = "PENDING";
    refund.reason = refund.reason || getRefundReason(refundEntity);
    payment.gatewayRefundId = gatewayRefundId;
    await persistPayment(payment);
    return payment;
  }

  const otherReservedMinor = getOtherReservedRefundMinor(payment, refund);
  if (amountMinor > getPaymentAmountMinor(payment) - otherReservedMinor) {
    throw new ApiError(400, "Refund amount exceeds the unrefunded amount");
  }

  refund.status = "SUCCESS";
  refund.gatewayRefundId = gatewayRefundId;
  refund.refundedAt = refund.refundedAt || parseGatewayDate(refundEntity.created_at);
  refund.reason = refund.reason || getRefundReason(refundEntity);
  payment.gatewayRefundId = gatewayRefundId;
  updatePaymentRefundStatus(payment);
  const savedPayment = await persistPayment(payment);
  await syncRelatedPaymentStatuses(savedPayment);
  return savedPayment;
};

const syncRelatedPaymentStatuses = async (payment) => {
  const invoice = await Invoice.findById(payment.invoiceId);
  if (!invoice) return;

  const invoicePayments = await getPaymentsForInvoice(invoice._id);
  const netPaidMinor = invoicePayments.reduce(
    (total, currentPayment) => total + getNetPaymentMinor(currentPayment),
    0,
  );
  const invoiceTotalMinor = getInvoiceTotalMinor(invoice);
  const hasSuccessfulPayment = invoicePayments.length > 0;

  let invoiceStatus = invoice.status;
  if (invoice.status !== "VOID") {
    if (invoiceTotalMinor > 0 && netPaidMinor >= invoiceTotalMinor) {
      invoiceStatus = "PAID";
    } else if (netPaidMinor > 0) {
      invoiceStatus = "PARTIALLY_PAID";
    } else if (hasSuccessfulPayment) {
      invoiceStatus = "ISSUED";
    }
    if (invoiceStatus !== invoice.status) {
      await Invoice.updateOne({ _id: invoice._id }, { $set: { status: invoiceStatus } });
    }
  }

  const bookingId = payment.bookingId || invoice.bookingId;
  if (!bookingId) return;

  const booking = await Booking.findById(bookingId);
  if (!booking) return;

  const bookingTotalMinor = getBookingTotalMinor(booking, invoice);
  let bookingPaymentStatus = "PENDING";
  if (bookingTotalMinor > 0 && netPaidMinor >= bookingTotalMinor) {
    bookingPaymentStatus = "PAID";
  } else if (netPaidMinor > 0) {
    bookingPaymentStatus = "PARTIAL";
  } else if (hasSuccessfulPayment) {
    bookingPaymentStatus = "REFUNDED";
  }

  if (booking.paymentStatus !== bookingPaymentStatus) {
    await Booking.updateOne(
      { _id: booking._id },
      { $set: { paymentStatus: bookingPaymentStatus } },
    );
  }
};

const createRazorpayOrderService = async (user, data) => {
  assertUser(user);
  if (!data?.invoiceId) throw new ApiError(422, "Invoice id is required");

  const razorpay = ensureOnlineConfigured();
  const invoice = await Invoice.findById(data.invoiceId);
  if (!invoice) throw new ApiError(404, "Invoice not found");

  assertInvoiceAccess(invoice, user);
  assertInvoicePayable(invoice, user);

  const amountMinor = await getOutstandingMinorForInvoice(invoice);
  if (amountMinor <= 0) throw new ApiError(400, "Invoice has no outstanding amount");

  const paymentNumber = generatePaymentNumber();
  let gatewayOrder;

  try {
    gatewayOrder = await razorpay.orders.create({
      amount: amountMinor,
      currency: "INR",
      receipt: paymentNumber,
      notes: {
        invoiceId: String(invoice._id),
        paymentNumber,
      },
    });
  } catch (error) {
    logger.error(`Razorpay order creation failed: ${error.message}`);
    throw new ApiError(502, "Unable to create Razorpay order");
  }

  if (!gatewayOrder?.id) throw new ApiError(502, "Razorpay did not return an order id");
  if (getSafeInteger(gatewayOrder.amount) !== amountMinor) {
    throw new ApiError(502, "Razorpay order amount does not match the invoice amount");
  }
  if (String(gatewayOrder.currency || "").toUpperCase() !== "INR") {
    throw new ApiError(502, "Razorpay order currency is invalid");
  }

  const payment = await Payment.create({
    paymentNumber,
    invoiceId: invoice._id,
    bookingId: invoice.bookingId,
    customerId: invoice.customerId,
    workshopId: invoice.workshopId,
    amount: minorToRupees(amountMinor),
    amountMinor,
    currency: "INR",
    gateway: "RAZORPAY",
    gatewayOrderId: gatewayOrder.id,
    status: "PENDING",
    metadata: {
      source: "razorpay",
      receipt: paymentNumber,
    },
  });

  logger.info(`Razorpay order created for payment ${payment.paymentNumber}`);

  return {
    payment,
    order: {
      id: gatewayOrder.id,
      amount: gatewayOrder.amount,
      amountMinor,
      currency: "INR",
      receipt: paymentNumber,
    },
    orderId: gatewayOrder.id,
    amount: minorToRupees(amountMinor),
    amountMinor,
    currency: "INR",
    keyId: env.RAZORPAY_KEY_ID,
  };
};

const verifyCheckoutSignature = (
  storedGatewayOrderId,
  gatewayPaymentId,
  signature,
  secret = env.RAZORPAY_KEY_SECRET,
) => {
  if (!secret) throw new ApiError(503, ONLINE_CONFIG_MESSAGE);
  if (
    typeof gatewayPaymentId !== "string" ||
    typeof storedGatewayOrderId !== "string" ||
    typeof signature !== "string" ||
    !/^[a-f0-9]{64}$/i.test(signature.trim())
  ) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${storedGatewayOrderId}|${gatewayPaymentId}`)
    .digest();
  const received = Buffer.from(signature.trim(), "hex");
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
};

const verifyPaymentService = async (paymentId, data, user) => {
  assertUser(user);
  const razorpay = ensureOnlineConfigured();
  const payment = await getPaymentById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");
  assertPaymentAccess(payment, user);

  if (payment.gateway !== "RAZORPAY" || !payment.gatewayOrderId) {
    throw new ApiError(400, "This payment was not created for Razorpay checkout");
  }

  const suppliedOrderId = data?.razorpayOrderId || data?.gatewayOrderId || data?.orderId;
  const suppliedPaymentId = data?.razorpayPaymentId || data?.gatewayPaymentId || data?.paymentId;
  const signature = data?.razorpaySignature || data?.gatewaySignature || data?.signature;

  if (!suppliedOrderId || String(suppliedOrderId) !== String(payment.gatewayOrderId)) {
    throw new ApiError(400, "Razorpay order id does not match the stored order");
  }
  if (!suppliedPaymentId) throw new ApiError(400, "Razorpay payment id is required");
  if (payment.gatewayPaymentId && String(payment.gatewayPaymentId) !== String(suppliedPaymentId)) {
    throw new ApiError(400, "Razorpay payment id does not match the stored payment");
  }
  if (
    !verifyCheckoutSignature(
      String(payment.gatewayOrderId),
      String(suppliedPaymentId),
      signature,
      env.RAZORPAY_KEY_SECRET,
    )
  ) {
    throw new ApiError(400, "Invalid Razorpay checkout signature");
  }

  let gatewayPayment;
  try {
    gatewayPayment = await razorpay.payments.fetch(String(suppliedPaymentId));
  } catch (error) {
    logger.error(`Razorpay payment verification failed: ${error.message}`);
    throw new ApiError(502, "Unable to verify payment with Razorpay");
  }

  return reconcileRazorpayPayment(payment, gatewayPayment, { signature });
};

const listPaymentsWithFilter = async (filter, query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const sortBy = ["createdAt", "paidAt", "amount", "status"].includes(query.sortBy)
    ? query.sortBy
    : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const listFilter = { ...filter };

  if (query.status) listFilter.status = query.status;
  if (query.method) listFilter.method = String(query.method).toUpperCase();
  if (query.invoiceId) listFilter.invoiceId = query.invoiceId;
  if (query.fromDate || query.toDate) {
    listFilter.createdAt = {};
    if (query.fromDate) listFilter.createdAt.$gte = new Date(query.fromDate);
    if (query.toDate) listFilter.createdAt.$lte = new Date(query.toDate);
  }

  const paymentQuery = populatePaymentQuery(Payment.find(listFilter));
  const [payments, total] = await Promise.all([
    paymentQuery.sort({ [sortBy]: sortOrder }).skip((page - 1) * limit).limit(limit),
    Payment.countDocuments(listFilter),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const listMyPaymentsService = async (user, query = {}) => {
  assertUser(user);
  if (user.role !== "CUSTOMER") throw new ApiError(403, "Only customers can use this endpoint");
  return listPaymentsWithFilter({ customerId: user._id }, query);
};

const listPaymentsService = async (user, query = {}) => {
  assertUser(user);

  if (user.role === "CUSTOMER") return listMyPaymentsService(user, query);

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  if (user.role === "ADMIN") {
    const filter = query.workshopId ? { workshopId: query.workshopId } : {};
    return listPaymentsWithFilter(filter, query);
  }

  if (!STAFF_ROLES.includes(user.role)) {
    throw new ApiError(403, "Only workshop staff can list payments");
  }
  if (!user.workshopId) {
    return {
      payments: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };
  }

  return listPaymentsWithFilter({ workshopId: user.workshopId }, query);
};

const getPaymentByIdService = async (paymentId, user) => {
  const payment = await getPaymentById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");
  assertPaymentAccess(payment, user);
  return payment;
};

const getOfflineAmountMinor = (data) => {
  const direct = getSafeInteger(data?.amountMinor);
  const rupees = data?.amountMinor === undefined ? rupeesToMinor(data?.amount) : null;

  if (direct !== null && data?.amount !== undefined) {
    const amountFromRupees = rupeesToMinor(data.amount);
    if (amountFromRupees !== null && amountFromRupees !== direct) {
      throw new ApiError(422, "amount and amountMinor must describe the same value");
    }
  }

  const amountMinor = direct ?? rupees;
  if (amountMinor === null || amountMinor <= 0) {
    throw new ApiError(422, "A positive payment amount is required");
  }
  return amountMinor;
};

const recordOfflinePaymentService = async (data, user) => {
  assertStaff(user);
  if (!data?.invoiceId) throw new ApiError(422, "Invoice id is required");
  if (!data?.method || !["CASH", "UPI", "CARD"].includes(String(data.method).toUpperCase())) {
    throw new ApiError(422, "Offline payment method must be CASH, UPI, or CARD");
  }

  const invoice = await Invoice.findById(data.invoiceId);
  if (!invoice) throw new ApiError(404, "Invoice not found");
  assertInvoiceAccess(invoice, user);
  assertInvoicePayable(invoice, user);

  const amountMinor = getOfflineAmountMinor(data);
  const outstandingMinor = await getOutstandingMinorForInvoice(invoice);
  if (amountMinor > outstandingMinor) {
    throw new ApiError(400, "Payment amount exceeds the invoice outstanding amount");
  }

  const method = String(data.method).toUpperCase();
  const payment = await Payment.create({
    paymentNumber: generatePaymentNumber(),
    invoiceId: invoice._id,
    bookingId: invoice.bookingId,
    customerId: invoice.customerId,
    workshopId: invoice.workshopId,
    amount: minorToRupees(amountMinor),
    amountMinor,
    currency: "INR",
    gateway: method,
    method,
    status: "SUCCESS",
    paidAt: new Date(),
    metadata: {
      source: "offline",
      recordedBy: user._id,
      notes: data.notes,
    },
  });

  await syncRelatedPaymentStatuses(payment);
  logger.info(`Offline ${method} payment recorded: ${payment.paymentNumber}`);
  return payment;
};

const refundPaymentService = async (paymentId, data, user) => {
  assertAdmin(user);
  ensureRazorpayKeys();
  const payment = await getPaymentById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");

  if (payment.gateway !== "RAZORPAY" || !payment.gatewayPaymentId) {
    throw new ApiError(400, "Only captured Razorpay payments can be refunded");
  }
  if (!["SUCCESS", "PARTIALLY_REFUNDED"].includes(payment.status)) {
    throw new ApiError(400, "Payment is not refundable");
  }

  const amountMinor = getSafeInteger(data?.amountMinor);
  if (amountMinor === null || amountMinor <= 0) {
    throw new ApiError(422, "amountMinor must be a positive paise value");
  }

  const reason = data?.reason ? String(data.reason).trim() : "Admin refund";
  const existingPending = findPendingRefund(payment, amountMinor, reason);
  const otherReservedMinor = getOtherReservedRefundMinor(payment, existingPending);
  const unrefundedMinor = getPaymentAmountMinor(payment) - otherReservedMinor;
  if (amountMinor > unrefundedMinor) {
    throw new ApiError(400, "Refund amount exceeds the unrefunded amount");
  }

  const idempotencyKey = existingPending?.idempotencyKey || crypto.randomUUID();
  if (!existingPending) {
    const pendingRefund = {
      amount: minorToRupees(amountMinor),
      amountMinor,
      reason,
      idempotencyKey,
      status: "PENDING",
    };
    ensureRefundArray(payment).push(pendingRefund);
    await persistPayment(payment);
  }

  let gatewayRefund;
  try {
    gatewayRefund = await requestRazorpayRefund({
      paymentId: payment.gatewayPaymentId,
      idempotencyKey,
      body: {
        amount: amountMinor,
        speed: "normal",
        receipt: idempotencyKey,
        notes: {
          reason,
        },
      },
    });
  } catch (error) {
    logger.error(`Razorpay refund failed: ${error.description || error.message}`);
    if (error.statusCode === 409) {
      throw new ApiError(
        409,
        "A different refund was already submitted with this idempotency key. Retry with a new key.",
      );
    }
    throw new ApiError(502, "Unable to create Razorpay refund");
  }

  const refundEntity = {
    ...(gatewayRefund || {}),
    id: gatewayRefund?.id || idempotencyKey,
    payment_id: gatewayRefund?.payment_id || payment.gatewayPaymentId,
    amount: gatewayRefund?.amount ?? amountMinor,
    status: gatewayRefund?.status || "processed",
    notes: gatewayRefund?.notes || { reason },
    idempotencyKey,
  };

  return reconcileRazorpayRefund(payment, refundEntity);
};

const getWebhookEntity = (payload, name) => {
  const value = payload?.[name];
  if (!value || typeof value !== "object") return null;
  return value.entity && typeof value.entity === "object" ? value.entity : value;
};

const getWebhookEventId = (eventId, event, rawBody) => {
  if (eventId) return String(eventId);
  const source = Buffer.isBuffer(rawBody) ? rawBody : JSON.stringify(event || {});
  return crypto.createHash("sha256").update(source).digest("hex");
};

const getWebhookDedupeKey = (eventName, paymentEntity, orderEntity, refundEntity) => {
  const subject =
    refundEntity?.id || paymentEntity?.id || orderEntity?.id || "unknown";
  const state = refundEntity?.status || paymentEntity?.status || orderEntity?.status || "";
  return `${eventName}:${subject}:${state}`;
};

const findPaymentForWebhook = async (event) => {
  const payload = event?.payload || {};
  const paymentEntity = getWebhookEntity(payload, "payment");
  const orderEntity = getWebhookEntity(payload, "order");
  const refundEntity = getWebhookEntity(payload, "refund");
  const paymentId = paymentEntity?.id || refundEntity?.payment_id;
  const orderId = orderEntity?.id || paymentEntity?.order_id;

  if (paymentId) {
    const payment = await Payment.findOne({ gatewayPaymentId: String(paymentId) });
    if (payment) return payment;
  }
  if (orderId) {
    const payment = await Payment.findOne({ gatewayOrderId: String(orderId) });
    if (payment) return payment;
  }
  if (refundEntity?.id) {
    return Payment.findOne({ "refunds.gatewayRefundId": String(refundEntity.id) });
  }
  return null;
};

const claimWebhookEvent = async (payment, eventId, dedupeKey, eventName) => {
  try {
    const result = await Payment.updateOne(
      {
        _id: payment._id,
        eventIds: { $ne: eventId },
        "webhookEvents.dedupeKey": { $ne: dedupeKey },
      },
      {
        $addToSet: {
          eventIds: eventId,
          processedEventIds: eventId,
          dedupeKeys: dedupeKey,
        },
        $push: {
          webhookEvents: {
            eventId,
            dedupeKey,
            event: eventName,
            status: "PROCESSING",
            receivedAt: new Date(),
          },
        },
      },
    );
    return result.modifiedCount === 1 || result.nModified === 1;
  } catch (error) {
    if (error?.code === 11000) return false;
    throw error;
  }
};

const completeWebhookEvent = async (paymentId, eventId) => {
  await Payment.updateOne(
    { _id: paymentId, "webhookEvents.eventId": eventId },
    {
      $set: {
        "webhookEvents.$.status": "PROCESSED",
        "webhookEvents.$.processedAt": new Date(),
      },
    },
  );
};

const releaseWebhookEvent = async (paymentId, eventId, dedupeKey) => {
  await Payment.updateOne(
    { _id: paymentId },
    {
      $pull: {
        eventIds: eventId,
        processedEventIds: eventId,
        dedupeKeys: dedupeKey,
        webhookEvents: { eventId },
      },
    },
  );
};

const processRazorpayWebhookService = async (event, eventId, rawBody) => {
  ensureWebhookConfigured();

  const resolvedEventId = getWebhookEventId(eventId, event, rawBody);
  const eventName = String(event?.event || "").toLowerCase();
  const payload = event?.payload || {};
  const paymentEntity = getWebhookEntity(payload, "payment");
  const orderEntity = getWebhookEntity(payload, "order");
  const refundEntity = getWebhookEntity(payload, "refund");
  const payment = await findPaymentForWebhook(event);

  if (!payment) return { processed: false, reason: "payment_not_found" };

  const dedupeKey = getWebhookDedupeKey(
    eventName,
    paymentEntity,
    orderEntity,
    refundEntity,
  );
  const claimed = await claimWebhookEvent(payment, resolvedEventId, dedupeKey, eventName);
  if (!claimed) return { processed: false, duplicate: true, payment };

  try {
    let result = payment;

    if (eventName === "payment.captured" || eventName === "order.paid") {
      if (paymentEntity?.id) {
        result = await reconcileRazorpayPayment(payment, paymentEntity);
      } else if (orderEntity?.id) {
        result = await reconcileOrderPaidWithoutPayment(payment, orderEntity);
      }
    } else if (eventName === "payment.failed") {
      if (paymentEntity?.id) {
        result = await reconcileRazorpayPayment(payment, paymentEntity);
      } else if (orderEntity?.id) {
        result = await reconcileRazorpayPayment(
          payment,
          {
            order_id: orderEntity.id,
            amount: orderEntity.amount,
            currency: orderEntity.currency,
            status: "failed",
          },
          { allowMissingPaymentId: true },
        );
      }
    } else if (eventName.startsWith("refund.")) {
      if (refundEntity?.id) {
        result = await reconcileRazorpayRefund(payment, refundEntity);
      }
    }

    await completeWebhookEvent(payment._id, resolvedEventId);
    return { processed: true, payment: result, eventId: resolvedEventId };
  } catch (error) {
    await releaseWebhookEvent(payment._id, resolvedEventId, dedupeKey);
    throw error;
  }
};

module.exports = {
  PAYMENT_STATUSES,
  ONLINE_CONFIG_MESSAGE,
  WEBHOOK_CONFIG_MESSAGE,
  ensureOnlineConfigured,
  ensureWebhookConfigured,
  getOutstandingMinorForInvoice,
  createRazorpayOrderService,
  createOrderService: createRazorpayOrderService,
  verifyPaymentService,
  verifyRazorpayPaymentService: verifyPaymentService,
  listMyPaymentsService,
  listPaymentsService,
  getPaymentByIdService,
  recordOfflinePaymentService,
  createOfflinePaymentService: recordOfflinePaymentService,
  refundPaymentService,
  reconcileRazorpayPayment,
  reconcileRazorpayRefund,
  verifyCheckoutSignature,
  processRazorpayWebhookService,
  processWebhookService: processRazorpayWebhookService,
};
