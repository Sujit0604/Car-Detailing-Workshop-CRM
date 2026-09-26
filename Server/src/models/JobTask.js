const mongoose = require("mongoose");

const jobTaskSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    sequence: {
      type: Number,
      min: 0,
      default: 0,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    taskType: {
      type: String,
      enum: ["REPAIR", "DETAILING", "INSPECTION", "MAINTENANCE"],
      default: "REPAIR",
    },
    assignedMechanicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mechanic",
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"],
      default: "PENDING",
    },
    estimatedMinutes: {
      type: Number,
      min: 0,
    },
    actualMinutes: {
      type: Number,
      min: 0,
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    blockedReason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: { type: Date },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

jobTaskSchema.index({ jobId: 1, sequence: 1 }, { unique: true });
jobTaskSchema.index({ assignedMechanicId: 1 });
jobTaskSchema.index({ status: 1 });

const JobTask = mongoose.model("JobTask", jobTaskSchema);

module.exports = JobTask;