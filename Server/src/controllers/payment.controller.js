const crypto = require("crypto");
const ApiError = require("../utils/ApiError.js");
const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const logger = require("../utils/logger.js");
const env = require("../config/env.js");
const {
  createRazorpayOrderService,
  verifyPaymentService,
  listMyPaymentsService,
  listPaymentsService,
  getPaymentByIdService,
  recordOfflinePaymentService,
  refundPaymentService,
  processRazorpayWebhookService,
} = require("../services/payment.service.js");

const getHeader = (req, name) => {
  if (typeof req.get === "function") return req.get(name);
  const headers = req.headers || {};
  return headers[name.toLowerCase()];
};

const verifyRazorpayWebhookSignature = (rawBody, signature) => {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new ApiError(
      503,
      "Razorpay webhooks are not configured. Set RAZORPAY_WEBHOOK_SECRET.",
    );
  }
  if (!Buffer.isBuffer(rawBody)) {
    throw new ApiError(400, "Razorpay webhook body must be a raw Buffer");
  }
  if (
    typeof signature !== "string" ||
    !/^[a-f0-9]{64}$/i.test(signature.trim())
  ) {
    throw new ApiError(401, "Invalid Razorpay webhook signature");
  }

  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest();
  const received = Buffer.from(signature.trim(), "hex");

  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw new ApiError(401, "Invalid Razorpay webhook signature");
  }

  return true;
};

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const result = await createRazorpayOrderService(req.user, req.body);
  return sendResponse(res, 201, "Razorpay order created successfully", result);
});

const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await verifyPaymentService(req.params.id, req.body, req.user);
  return sendResponse(res, 200, "Payment verified successfully", payment);
});

const listMyPayments = asyncHandler(async (req, res) => {
  const result = await listMyPaymentsService(req.user, req.query);
  return sendResponse(res, 200, "Payments fetched successfully", result);
});

const listPayments = asyncHandler(async (req, res) => {
  const result = await listPaymentsService(req.user, req.query);
  return sendResponse(res, 200, "Payments fetched successfully", result);
});

const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await getPaymentByIdService(req.params.id, req.user);
  return sendResponse(res, 200, "Payment fetched successfully", payment);
});

const recordOfflinePayment = asyncHandler(async (req, res) => {
  const payment = await recordOfflinePaymentService(req.body, req.user);
  return sendResponse(res, 201, "Offline payment recorded successfully", payment);
});

const refundPayment = asyncHandler(async (req, res) => {
  const payment = await refundPaymentService(req.params.id, req.body, req.user);
  return sendResponse(res, 200, "Refund initiated successfully", payment);
});

const razorpayWebhook = asyncHandler(async (req, res) => {
  const rawBody = req.body;
  const signature = getHeader(req, "X-Razorpay-Signature");
  verifyRazorpayWebhookSignature(rawBody, signature);

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch (error) {
    throw new ApiError(400, "Razorpay webhook body is not valid JSON");
  }

  const eventId = getHeader(req, "X-Razorpay-Event-Id");
  const response = sendResponse(res, 200, "Razorpay webhook accepted", {
    received: true,
  });

  Promise.resolve()
    .then(() => processRazorpayWebhookService(event, eventId, rawBody))
    .catch((error) => {
      logger.error(`Razorpay webhook processing failed: ${error.message}`);
    });

  return response;
});

module.exports = {
  createRazorpayOrder,
  createOrder: createRazorpayOrder,
  verifyPayment,
  verifyRazorpayPayment: verifyPayment,
  listMyPayments,
  listPayments,
  getPaymentById,
  recordOfflinePayment,
  createOfflinePayment: recordOfflinePayment,
  refundPayment,
  razorpayWebhook,
  rawRazorpayWebhook: razorpayWebhook,
  handleRazorpayWebhook: razorpayWebhook,
  verifyRazorpayWebhookSignature,
};
