const mongoose = require("mongoose");

const bookingServiceSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    estimatedPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    durationMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
    },
    appointment: {
      date: { type: Date, required: true },
      startTime: { type: String, trim: true },
      endTime: { type: String, trim: true },
      slotId: { type: String },
    },
    services: {
      type: [bookingServiceSchema],
      default: [],
    },
    pricing: {
      subtotal: { type: Number, min: 0, default: 0 },
      discount: { type: Number, min: 0, default: 0 },
      tax: { type: Number, min: 0, default: 0 },
      total: { type: Number, min: 0, default: 0 },
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "VEHICLE_RECEIVED",
        "IN_PROGRESS",
        "COMPLETED",
        "NO_SHOW",
      ],
      default: "PENDING",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PARTIAL", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    customerNotes: {
      type: String,
      trim: true,
    },
    cancellation: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      reason: { type: String, trim: true },
      cancelledAt: { type: Date },
    },
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ vehicleId: 1 });
bookingSchema.index({ workshopId: 1, appointment: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingNumber: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;