const mongoose = require("mongoose");

const PAYMENT_STATUSES = [
  "CREATED",
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];

const refundSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountMinor: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: (value) => Number.isSafeInteger(value) && value >= 0,
        message: "Refund amountMinor must be a non-negative integer",
      },
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    refundedAt: Date,
    gatewayRefundId: {
      type: String,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    failureReason: {
      type: String,
      trim: true,
    },
  },
  {
    _id: true,
  },
);

const legacyRefundSchema = new mongoose.Schema(
  {
    amount: { type: Number, min: 0, default: 0 },
    amountMinor: { type: Number, min: 0 },
    reason: { type: String, trim: true },
    refundedAt: Date,
    gatewayRefundId: { type: String, trim: true },
    status: { type: String, trim: true },
  },
  { _id: false },
);

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      trim: true,
    },
    dedupeKey: {
      type: String,
      required: true,
      trim: true,
    },
    event: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PROCESSING", "PROCESSED", "FAILED"],
      default: "PROCESSING",
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: Date,
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
    },
    gateway: {
      type: String,
      enum: ["RAZORPAY", "STRIPE", "CASH", "UPI", "CARD"],
      default: "RAZORPAY",
    },
    gatewayOrderId: {
      type: String,
      trim: true,
    },
    gatewayPaymentId: {
      type: String,
      trim: true,
    },
    gatewayRefundId: {
      type: String,
      trim: true,
    },
    gatewaySignature: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountMinor: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: (value) => Number.isSafeInteger(value) && value >= 0,
        message: "Payment amountMinor must be a non-negative integer",
      },
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    method: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "CREATED",
    },
    failureReason: {
      type: String,
      trim: true,
    },
    paidAt: Date,
    refunds: {
      type: [refundSchema],
      default: [],
    },
    refund: {
      type: legacyRefundSchema,
      default: undefined,
    },
    eventIds: {
      type: [String],
      default: undefined,
    },
    processedEventIds: {
      type: [String],
      default: undefined,
    },
    dedupeKeys: {
      type: [String],
      default: undefined,
    },
    webhookEvents: {
      type: [webhookEventSchema],
      default: [],
    },
    lastEventId: {
      type: String,
      trim: true,
    },
    lastEventAt: Date,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ gatewayOrderId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ gatewayPaymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ gatewayRefundId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ "refunds.gatewayRefundId": 1 }, { unique: true, sparse: true });
paymentSchema.index({ eventIds: 1 }, { unique: true, sparse: true });
paymentSchema.index({ dedupeKeys: 1 }, { unique: true, sparse: true });
paymentSchema.index({ invoiceId: 1, createdAt: -1 });
paymentSchema.index({ bookingId: 1, createdAt: -1 });
paymentSchema.index({ customerId: 1, createdAt: -1 });
paymentSchema.index({ workshopId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

Payment.PAYMENT_STATUSES = PAYMENT_STATUSES;
Payment.refundSchema = refundSchema;
Payment.webhookEventSchema = webhookEventSchema;

module.exports = Payment;
