const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    jobNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
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
    assignedMechanicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mechanic",
      default: null,
    },
    serviceAdvisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: [
        "CREATED",
        "CHECK_IN",
        "INSPECTION",
        "ESTIMATE_PENDING",
        "CUSTOMER_APPROVAL",
        "APPROVED",
        "ASSIGNED",
        "IN_PROGRESS",
        "QUALITY_CHECK",
        "REWORK",
        "READY",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "CREATED",
    },
    odometerIn: {
      type: Number,
      min: 0,
    },
    odometerOut: {
      type: Number,
      min: 0,
    },
    checkInAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    expectedCompletionAt: { type: Date },
    customerNotes: {
      type: String,
      trim: true,
    },
    internalNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

jobSchema.index({ bookingId: 1 }, { unique: true });
jobSchema.index({ customerId: 1 });
jobSchema.index({ vehicleId: 1 });
jobSchema.index({ workshopId: 1, status: 1 });
jobSchema.index({ assignedMechanicId: 1 });
jobSchema.index({ jobNumber: 1 });

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;