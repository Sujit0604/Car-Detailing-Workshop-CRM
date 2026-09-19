const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    serviceType: {
      type: String,
      enum: ["DETAILING", "REPAIR", "MAINTENANCE", "INSPECTION"],
      default: "DETAILING",
    },
    pricingType: {
      type: String,
      enum: ["FIXED", "STARTING_FROM", "INSPECTION_REQUIRED"],
      default: "FIXED",
    },
    basePrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    estimatedDurationMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

serviceSchema.index({ workshopId: 1, slug: 1 }, { unique: true });
serviceSchema.index({ categoryId: 1 });

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;