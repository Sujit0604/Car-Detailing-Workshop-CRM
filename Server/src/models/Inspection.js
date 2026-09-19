const mongoose = require("mongoose");

const inspectionItemSchema = new mongoose.Schema(
  {
    component: {
      type: String,
      required: true,
      trim: true,
    },
    condition: {
      type: String,
      enum: ["GOOD", "FAIR", "POOR", "DAMAGED", "REPLACE_REQUIRED"],
      default: "GOOD",
    },
    notes: {
      type: String,
      trim: true,
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    recommendedAction: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const inspectionSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inspectionType: {
      type: String,
      enum: ["INITIAL", "FINAL", "REINSPECTION"],
      default: "INITIAL",
    },
    status: {
      type: String,
      enum: ["DRAFT", "COMPLETED"],
      default: "DRAFT",
    },
    odometerReading: {
      type: Number,
      min: 0,
    },
    fuelLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
    exteriorCondition: {
      type: String,
      trim: true,
    },
    interiorCondition: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    items: {
      type: [inspectionItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

inspectionSchema.index({ jobId: 1, createdAt: -1 });
inspectionSchema.index({ inspectorId: 1 });

const Inspection = mongoose.model("Inspection", inspectionSchema);

module.exports = Inspection;