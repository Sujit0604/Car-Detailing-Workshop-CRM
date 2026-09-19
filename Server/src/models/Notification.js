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
        "ESTIMATE_READY",
        "ESTIMATE_APPROVED",
        "VEHICLE_READY",
        "PAYMENT_SUCCESS",
        "PAYMENT_FAILED",
        "GENERAL",
      ],
      default: "GENERAL",
    },
    channel: {
      type: String,
      enum: ["IN_APP", "EMAIL", "SMS", "WHATSAPP", "PUSH"],
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
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED", "READ"],
      default: "PENDING",
    },
    sentAt: { type: Date },
    readAt: { type: Date },
    failureReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;