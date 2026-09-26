const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  createRazorpayOrder,
  verifyPayment,
  listMyPayments,
  listPayments,
  getPaymentById,
  recordOfflinePayment,
  refundPayment,
  razorpayWebhook,
} = require("../controllers/payment.controller.js");
const {
  createRazorpayOrderSchema,
  verifyPaymentSchema,
  paymentIdParamSchema,
  recordOfflinePaymentSchema,
  refundPaymentSchema,
  listPaymentsQuerySchema,
} = require("../validators/payment.validator.js");

const paymentRouter = express.Router();
const paymentWebhookRouter = express.Router();
const rawWebhookBody = express.raw({ type: () => true, limit: "1mb" });

// Razorpay signs the exact raw payload, so this route must be mounted before the
// global JSON body parser. See app.js.
paymentWebhookRouter.post("/webhooks/razorpay", rawWebhookBody, razorpayWebhook);

paymentRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Payment Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

paymentRouter.post(
  "/order",
  authorize("CUSTOMER", "ADMIN"),
  validate(createRazorpayOrderSchema),
  logRoute("CreateRazorpayOrder"),
  createRazorpayOrder,
);

paymentRouter.post(
  "/:id/verify",
  authorize("CUSTOMER", "ADMIN"),
  validate(verifyPaymentSchema),
  logRoute("Verify"),
  verifyPayment,
);

paymentRouter.get(
  "/mine",
  authorize("CUSTOMER"),
  validate(listPaymentsQuerySchema),
  logRoute("ListMine"),
  listMyPayments,
);

paymentRouter.get(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(listPaymentsQuerySchema),
  logRoute("List"),
  listPayments,
);

paymentRouter.get(
  "/:id",
  authorize("CUSTOMER", "ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(paymentIdParamSchema),
  logRoute("GetById"),
  getPaymentById,
);

paymentRouter.post(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(recordOfflinePaymentSchema),
  logRoute("RecordOffline"),
  recordOfflinePayment,
);

paymentRouter.post(
  "/:id/refund",
  authorize("ADMIN"),
  validate(refundPaymentSchema),
  logRoute("Refund"),
  refundPayment,
);

module.exports = paymentRouter;
module.exports.paymentRouter = paymentRouter;
module.exports.paymentWebhookRouter = paymentWebhookRouter;
module.exports.rawRazorpayWebhook = razorpayWebhook;
module.exports.razorpayWebhook = razorpayWebhook;
