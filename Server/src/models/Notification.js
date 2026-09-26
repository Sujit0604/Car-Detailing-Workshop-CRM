const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "BOOKING_CONFIRMED",
        "BOOKING_CANCELLED",
        "JOB_STARTED",
        "JOB_COMPLETED",
        "ESTIMATE_READY",
        "ESTIMATE_APPROVED",
        "VEHICLE_READY",
        "PAYMENT_SUCCESS",
        "PAYMENT_FAILED",
        "INVOICE_ISSUED",
        "INVOICE_PAID",
        "REVIEW_RESPONSE",
        "REVIEW_UPDATED",
        "GENERAL",
      ],
      default: "GENERAL",
    },
    channel: {
      type: String,
      enum: ["IN_APP"],
      default: "IN_APP",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    reference: {
      type: { type: String, trim: true },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },
    dedupeKey: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["SENT", "READ"],
      default: "SENT",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index(
  { userId: 1, dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dedupeKey: { $type: "string" } },
  },
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
