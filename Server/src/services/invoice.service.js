const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError.js");
const Booking = require("../models/Booking.js");
const Estimate = require("../models/Estimate.js");
const Invoice = require("../models/Invoice.js");
const Job = require("../models/Job.js");
const Payment = require("../models/Payment.js");
const User = require("../models/User.js");
const Vehicle = require("../models/Vehicle.js");

const STAFF_ROLES = ["WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"];
const CUSTOMER_VISIBLE_STATUSES = ["ISSUED", "PARTIALLY_PAID", "PAID"];
const DEFAULT_DUE_DAYS = 7;

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const sameId = (first, second) => Boolean(first && second && first.toString() === second.toString());

const generateInvoiceNumber = () => {
  return `INV-${new Date().getFullYear()}-${uuidv4().split("-")[0].toUpperCase()}`;
};

const requireMoney = (value, fieldName) => {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new ApiError(400, `Invalid ${fieldName} on the approved estimate`);
  }

  return roundMoney(amount);
};

const assertStaffInvoiceAccess = (user, workshopId) => {
  if (user.role === "ADMIN") return;

  if (!STAFF_ROLES.includes(user.role)) {
    throw new ApiError(403, "You don't have permission to access this invoice");
  }

  if (!user.workshopId) {
    throw new ApiError(403, "Your account is not assigned to a workshop");
  }

  if (!sameId(user.workshopId, workshopId)) {
    throw new ApiError(403, "This invoice does not belong to your workshop");
  }
};

const assertRelatedIdsMatch = (job, booking, vehicle) => {
  if (
    !sameId(job.bookingId, booking._id) ||
    !sameId(job.customerId, booking.customerId) ||
    !sameId(job.vehicleId, booking.vehicleId) ||
    !sameId(job.vehicleId, vehicle._id) ||
    !sameId(job.workshopId, booking.workshopId)
  ) {
    throw new ApiError(409, "Job, booking, and vehicle records are inconsistent");
  }
};

// Admins paste whatever is on their screen: a job ObjectId or a job number
// (JOB-2026-AB12CD34). Accept both.
const resolveJob = async (identifier) => {
  const value = String(identifier || "").trim();

  if (!value) return null;

  if (mongoose.Types.ObjectId.isValid(value)) {
    return Job.findById(value);
  }

  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Job.findOne({ jobNumber: new RegExp(`^${escaped}$`, "i") });
};

const findApprovedEstimate = async (jobId, estimateId) => {
  if (estimateId && !mongoose.Types.ObjectId.isValid(estimateId)) {
    const escaped = estimateId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return Estimate.findOne({
      jobId,
      status: "APPROVED",
      estimateNumber: new RegExp(`^${escaped}$`, "i"),
    });
  }

  const filter = {
    jobId,
    status: "APPROVED",
  };

  if (estimateId) {
    filter._id = estimateId;
  }

  const query = Estimate.findOne(filter);

  if (!estimateId) query.sort({ version: -1 });

  return query;
};

const buildInvoiceItems = (estimateItems) => {
  const items = estimateItems.map((item) => {
    const quantity = requireMoney(item.quantity, "quantity");
    const unitPrice = requireMoney(item.unitPrice, "unit price");

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ApiError(400, "Invalid quantity on the approved estimate");
    }

    return {
      type: item.type || "OTHER",
      referenceId: item.referenceId || null,
      description: item.name,
      quantity,
      unitPrice,
      taxRate: 0,
      taxAmount: 0,
      total: roundMoney(quantity * unitPrice),
    };
  });

  if (items.length === 0) {
    throw new ApiError(400, "The approved estimate has no invoice items");
  }

  return items;
};

const buildInvoicePricing = (items, estimatePricing = {}) => {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.total, 0));
  const discount = Math.min(
    subtotal,
    requireMoney(estimatePricing.discount, "discount"),
  );
  const tax = requireMoney(estimatePricing.tax, "tax");
  const roundOff = 0;
  const grandTotal = roundMoney(subtotal - discount + tax + roundOff);

  return {
    subtotal,
    discount,
    tax,
    roundOff,
    grandTotal,
  };
};

const populateInvoice = (query) => {
  return query
    .populate("estimateId", "estimateNumber version status")
    .populate("jobId", "jobNumber status")
    .populate("bookingId", "bookingNumber status paymentStatus")
    .populate("customerId", "name email phone")
    .populate("workshopId", "name code address")
    .populate("createdBy", "name email role")
    .populate("issuedBy", "name email role")
    .populate("voidedBy", "name email role");
};

const getDefaultPaymentSummary = (invoice) => ({
  status: "UNPAID",
  paidAmount: 0,
  refundedAmount: 0,
  outstandingAmount: roundMoney(invoice.pricing?.grandTotal || 0),
  currency: invoice.currency,
});

const getPaymentSummaryRows = async (invoiceIds) => {
  if (invoiceIds.length === 0) return [];

  try {
    return await Payment.aggregate([
      {
        $match: {
          invoiceId: { $in: invoiceIds },
          status: { $in: ["SUCCESS", "REFUNDED", "PARTIALLY_REFUNDED"] },
        },
      },
      {
        $group: {
          _id: "$invoiceId",
          paidAmount: { $sum: "$amount" },
          refundedAmount: {
            $sum: { $ifNull: ["$refund.amount", 0] },
          },
        },
      },
    ]);
  } catch {
    return [];
  }
};

const addPaymentSummaries = async (invoices) => {
  const rows = await getPaymentSummaryRows(invoices.map((invoice) => invoice._id));
  const summaries = new Map(
    rows.map((row) => [row._id.toString(), row]),
  );

  return invoices.map((invoice) => {
    const data = typeof invoice.toObject === "function" ? invoice.toObject() : invoice;
    const row = summaries.get(invoice._id.toString());
    const defaultSummary = getDefaultPaymentSummary(data);
    const paidAmount = roundMoney(row?.paidAmount || 0);
    const refundedAmount = roundMoney(row?.refundedAmount || 0);
    const netPaid = Math.max(0, roundMoney(paidAmount - refundedAmount));
    const outstandingAmount = Math.max(
      0,
      roundMoney(defaultSummary.outstandingAmount - netPaid),
    );
    const paymentStatus = paidAmount === 0
      ? "UNPAID"
      : outstandingAmount === 0
        ? "PAID"
        : "PARTIALLY_PAID";

    return {
      ...data,
      paymentSummary: {
        status: paymentStatus,
        paidAmount,
        refundedAmount,
        outstandingAmount,
        currency: data.currency,
      },
    };
  });
};

const generateInvoiceService = async (payload, user) => {
  const job = await resolveJob(payload.jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  assertStaffInvoiceAccess(user, job.workshopId);

  const existingInvoice = await Invoice.findOne({ jobId: job._id }).select("_id").lean();

  if (existingInvoice) {
    throw new ApiError(409, "An invoice already exists for this job");
  }

  const estimate = await findApprovedEstimate(job._id, payload.estimateId);

  if (!estimate) {
    throw new ApiError(400, "An approved estimate is required before generating an invoice");
  }

  const [booking, customer, vehicle] = await Promise.all([
    Booking.findById(job.bookingId),
    User.findById(job.customerId),
    Vehicle.findById(job.vehicleId),
  ]);

  if (!booking || !customer || !vehicle) {
    throw new ApiError(404, "Booking, customer, or vehicle snapshot source not found");
  }

  assertRelatedIdsMatch(job, booking, vehicle);

  const items = buildInvoiceItems(estimate.items);
  const pricing = buildInvoicePricing(items, estimate.pricing);

  try {
    const invoice = await Invoice.create({
      invoiceNumber: generateInvoiceNumber(),
      jobId: job._id,
      estimateId: estimate._id,
      bookingId: booking._id,
      customerId: customer._id,
      workshopId: job.workshopId,
      customerSnapshot: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      vehicleSnapshot: {
        registrationNumber: vehicle.registrationNumber,
        make: vehicle.make,
        model: vehicle.model,
        variant: vehicle.variant,
        manufacturingYear: vehicle.manufacturingYear,
      },
      bookingSnapshot: {
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        appointmentDate: booking.appointment?.date,
      },
      jobSnapshot: {
        jobNumber: job.jobNumber,
        status: job.status,
        completedAt: job.completedAt,
      },
      estimateSnapshot: {
        estimateNumber: estimate.estimateNumber,
        version: estimate.version,
        status: estimate.status,
      },
      items,
      currency: "INR",
      pricing,
      status: "DRAFT",
      createdBy: user._id,
    });

    return await getInvoiceByIdService(invoice._id, user);
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "An invoice already exists for this job");
    }

    throw error;
  }
};

const buildInvoiceFilter = (user, query = {}) => {
  const filter = {};

  if (user.role === "CUSTOMER") {
    filter.customerId = user._id;
    filter.status = { $in: CUSTOMER_VISIBLE_STATUSES };
  } else if (user.role === "ADMIN") {
    if (query.workshopId) filter.workshopId = query.workshopId;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.status) filter.status = query.status;
  } else {
    if (!user.workshopId) {
      throw new ApiError(403, "Your account is not assigned to a workshop");
    }

    if (query.workshopId && !sameId(query.workshopId, user.workshopId)) {
      throw new ApiError(403, "You can only access invoices for your workshop");
    }

    filter.workshopId = user.workshopId;
    if (query.status) filter.status = query.status;
  }

  if (query.bookingId) filter.bookingId = query.bookingId;
  if (query.jobId) filter.jobId = query.jobId;
  if (query.currency) filter.currency = query.currency;

  if (query.fromDate || query.toDate) {
    filter.createdAt = {};
    if (query.fromDate) filter.createdAt.$gte = query.fromDate;
    if (query.toDate) filter.createdAt.$lte = query.toDate;
  }

  return filter;
};

const listInvoicesService = async (user, query = {}) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;
  const filter = buildInvoiceFilter(user, query);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  const [invoiceDocuments, total] = await Promise.all([
    populateInvoice(Invoice.find(filter))
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Invoice.countDocuments(filter),
  ]);
  const invoices = await addPaymentSummaries(invoiceDocuments);

  return {
    invoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const listMyInvoicesService = async (user, query = {}) => {
  return listInvoicesService(user, query);
};

const getInvoiceByIdService = async (invoiceId, user) => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw new ApiError(404, "Invoice not found");
  }

  const invoice = await populateInvoice(Invoice.findById(invoiceId)).lean();

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  if (user.role === "CUSTOMER") {
    const customerId = invoice.customerId?._id || invoice.customerId;

    if (
      !sameId(customerId, user._id) ||
      !CUSTOMER_VISIBLE_STATUSES.includes(invoice.status)
    ) {
      throw new ApiError(404, "Invoice not found");
    }
  } else {
    const workshopId = invoice.workshopId?._id || invoice.workshopId;
    assertStaffInvoiceAccess(user, workshopId);
  }

  const [result] = await addPaymentSummaries([invoice]);
  return result;
};

const issueInvoiceService = async (invoiceId, payload, user) => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw new ApiError(404, "Invoice not found");
  }

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  assertStaffInvoiceAccess(user, invoice.workshopId);

  if (invoice.status !== "DRAFT") {
    throw new ApiError(400, "Only draft invoices can be issued");
  }

  const issuedAt = new Date();
  const dueAt = payload.dueAt
    ? new Date(payload.dueAt)
    : new Date(issuedAt.getTime() + DEFAULT_DUE_DAYS * 24 * 60 * 60 * 1000);

  if (Number.isNaN(dueAt.getTime()) || dueAt < issuedAt) {
    throw new ApiError(400, "Invoice due date must be a valid future date");
  }

  invoice.status = "ISSUED";
  invoice.issuedAt = issuedAt;
  invoice.dueAt = dueAt;
  invoice.issuedBy = user._id;
  await invoice.save();

  return getInvoiceByIdService(invoice._id, user);
};

const voidInvoiceService = async (invoiceId, payload, user) => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw new ApiError(404, "Invoice not found");
  }

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  assertStaffInvoiceAccess(user, invoice.workshopId);

  if (invoice.status === "VOID") {
    throw new ApiError(400, "Invoice is already void");
  }

  if (["PARTIALLY_PAID", "PAID"].includes(invoice.status)) {
    throw new ApiError(400, "An invoice with payments cannot be voided");
  }

  const hasPayment = await Payment.exists({
    invoiceId: invoice._id,
    status: { $in: ["SUCCESS", "REFUNDED", "PARTIALLY_REFUNDED"] },
  });

  if (hasPayment) {
    throw new ApiError(400, "An invoice with payment history cannot be voided");
  }

  invoice.status = "VOID";
  invoice.voidedBy = user._id;
  invoice.voidedAt = new Date();
  invoice.voidReason = payload.reason?.trim() || "Voided by workshop";
  await invoice.save();

  return getInvoiceByIdService(invoice._id, user);
};

module.exports = {
  CUSTOMER_VISIBLE_STATUSES,
  generateInvoiceService,
  createInvoiceService: generateInvoiceService,
  listInvoicesService,
  listMyInvoicesService,
  getInvoiceByIdService,
  issueInvoiceService,
  voidInvoiceService,
};
