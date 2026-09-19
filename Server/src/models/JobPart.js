const mongoose = require("mongoose");

const jobPartSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    inventoryPartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryPart",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["RESERVED", "USED", "RETURNED", "CANCELLED"],
      default: "RESERVED",
    },
    reservedAt: { type: Date },
    usedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

jobPartSchema.index({ jobId: 1 });
jobPartSchema.index({ inventoryPartId: 1 });
jobPartSchema.index({ status: 1 });

const JobPart = mongoose.model("JobPart", jobPartSchema);

module.exports = JobPart;