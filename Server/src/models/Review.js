const mongoose = require("mongoose");

const reviewImageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
  },
  { _id: false },
);

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
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer",
      },
    },
    title: {
      type: String,
      trim: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    images: {
      type: [reviewImageSchema],
      default: [],
    },
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
    moderation: {
      moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      moderatedAt: { type: Date },
      reason: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index({ customerId: 1, createdAt: -1 });
reviewSchema.index({ workshopId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
