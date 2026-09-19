const mongoose = require("mongoose");

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
    gatewaySignature: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    method: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["CREATED", "PENDING", "SUCCESS", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"],
      default: "CREATED",
    },
    failureReason: {
      type: String,
      trim: true,
    },
    paidAt: { type: Date },
    refund: {
      amount: { type: Number, min: 0, default: 0 },
      reason: { type: String, trim: true },
      refundedAt: { type: Date },
      gatewayRefundId: { type: String, trim: true },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ invoiceId: 1 });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ paymentNumber: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;