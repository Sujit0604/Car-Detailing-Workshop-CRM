const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ["PUBLISHED", "HIDDEN", "FLAGGED"],
      default: "PUBLISHED",
    },
    response: {
      message: { type: String, trim: true },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      respondedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index({ customerId: 1 });
reviewSchema.index({ workshopId: 1, status: 1 });
reviewSchema.index({ bookingId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;