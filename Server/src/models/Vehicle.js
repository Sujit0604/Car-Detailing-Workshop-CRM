const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    make: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    variant: {
      type: String,
      trim: true,
    },
    manufacturingYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    fuelType: {
      type: String,
      enum: ["PETROL", "DIESEL", "CNG", "ELECTRIC", "HYBRID"],
      default: "PETROL",
    },
    transmission: {
      type: String,
      enum: ["MANUAL", "AUTOMATIC", "AMT", "CVT", "DCT", "OTHER"],
      default: "MANUAL",
    },
    color: {
      type: String,
      trim: true,
    },
    vin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    odometer: {
      type: Number,
      min: 0,
      default: 0,
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

vehicleSchema.index({ ownerId: 1 });
vehicleSchema.index({ registrationNumber: 1 });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;