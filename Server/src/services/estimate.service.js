const { v4: uuidv4 } = require("uuid");
const ApiError = require("../utils/ApiError.js");
const logger = require("../utils/logger.js");
const Estimate = require("../models/Estimate.js");
const Job = require("../models/Job.js");
const Booking = require("../models/Booking.js");
const { JOB_STATUS_TRANSITIONS } = require("./job.service.js");

const generateEstimateNumber = () => {
  return `EST-${new Date().getFullYear()}-${uuidv4().split("-")[0].toUpperCase()}`;
};

const moveJobTo = (job, target) => {
  const allowed = JOB_STATUS_TRANSITIONS[job.status] || [];

  if (allowed.includes(target)) {
    job.status = target;
    return;
  }

  if (job.status === "INSPECTION" && target === "CUSTOMER_APPROVAL") {
    job.status = "CUSTOMER_APPROVAL";
    return;
  }

  throw new ApiError(400, `Job cannot move from ${job.status} to ${target}`);
};

const computeEstimatePricing = (items, discount = 0, tax = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 1) * (item.unitPrice || 0), 0);
  const total = Math.max(0, subtotal - discount) + tax;

  return { subtotal, discount, tax, total };
};

const createEstimateService = async (jobId, payload, user) => {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const allowedJobStatuses = ["INSPECTION", "ESTIMATE_PENDING", "CUSTOMER_APPROVAL"];

  if (!allowedJobStatuses.includes(job.status)) {
    throw new ApiError(400, `Estimates can only be created while job is in ${allowedJobStatuses.join(" / ")}`);
  }

  const { items, discount = 0, tax = 0, notes } = payload;

  const latest = await Estimate.findOne({ jobId: job._id }).sort({ version: -1 });
  const version = latest ? latest.version + 1 : 1;

  const sanitizedItems = items.map((item) => ({
    type: item.type || "OTHER",
    name: item.name.trim(),
    description: item.description?.trim() || undefined,
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || 0,
    total: (item.quantity || 1) * (item.unitPrice || 0),
  }));

  const pricing = computeEstimatePricing(sanitizedItems, discount, tax);

  const estimate = await Estimate.create({
    estimateNumber: generateEstimateNumber(),
    jobId: job._id,
    version,
    createdBy: user._id,
    items: sanitizedItems,
    pricing,
    notes,
    status: "PENDING_APPROVAL",
  });

  moveJobTo(job, "CUSTOMER_APPROVAL");
  job.internalNotes = notes?.trim() ? notes.trim() : job.internalNotes;
  await job.save();

  logger.info(`Estimate ${estimate.estimateNumber} (v${version}) created for job ${job.jobNumber}`);

  return estimate;
};

const getLatestEstimateService = async (jobId, user) => {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (user.role === "CUSTOMER" && job.customerId.toString() !== user._id.toString()) {
    throw new ApiError(403, "You don't have permission to view this estimate");
  }

  const estimate = await Estimate.findOne({ jobId: job._id }).sort({ version: -1 });

  return estimate;
};

const respondToEstimateService = async (jobId, payload, user) => {
  const { action, remarks, cancelBooking = false } = payload;

  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.customerId.toString() !== user._id.toString() && user.role !== "ADMIN") {
    throw new ApiError(403, "Only the job's customer can respond to the estimate");
  }

  const estimate = await Estimate.findOne({ jobId: job._id, status: "PENDING_APPROVAL" }).sort({
    version: -1,
  });

  if (!estimate) {
    throw new ApiError(404, "No pending estimate found for this job");
  }

  if (job.status !== "CUSTOMER_APPROVAL") {
    throw new ApiError(400, "Job is not awaiting customer approval");
  }

  estimate.status = action;
  estimate.customerResponse = {
    respondedAt: new Date(),
    respondedBy: user._id,
    remarks: remarks?.trim() || undefined,
  };

  await estimate.save();

  if (action === "APPROVED") {
    moveJobTo(job, "APPROVED");
  } else if (cancelBooking) {
    moveJobTo(job, "CANCELLED");

    const reason = remarks?.trim() || `Booking cancelled by customer after rejecting estimate ${estimate.estimateNumber}`;
    job.internalNotes = reason;

    await Booking.updateOne(
      { _id: job.bookingId },
      {
        status: "CANCELLED",
        cancellation: {
          cancelledBy: user._id,
          reason,
          cancelledAt: new Date(),
        },
      },
    );
  } else {
    moveJobTo(job, "ESTIMATE_PENDING");
  }

  await job.save();

  logger.info(`Estimate ${estimate.estimateNumber} ${action.toLowerCase()} for job ${job.jobNumber}`);

  return estimate;
};

module.exports = {
  createEstimateService,
  getLatestEstimateService,
  respondToEstimateService,
};