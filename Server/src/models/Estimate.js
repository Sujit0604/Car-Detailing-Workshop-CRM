const mongoose = require("mongoose");

const estimateItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["LABOUR", "PART", "SERVICE", "OTHER"],
      default: "OTHER",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
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
    total: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const estimateSchema = new mongoose.Schema(
  {
    estimateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [estimateItemSchema],
      default: [],
    },
    pricing: {
      subtotal: { type: Number, min: 0, default: 0 },
      discount: { type: Number, min: 0, default: 0 },
      tax: { type: Number, min: 0, default: 0 },
      total: { type: Number, min: 0, default: 0 },
    },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "EXPIRED"],
      default: "DRAFT",
    },
    customerResponse: {
      respondedAt: { type: Date },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      remarks: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  },
);

estimateSchema.index({ jobId: 1, version: 1 }, { unique: true });
estimateSchema.index({ estimateNumber: 1 });

const Estimate = mongoose.model("Estimate", estimateSchema);

module.exports = Estimate;