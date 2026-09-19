const { v4: uuidv4 } = require("uuid");
const ApiError = require("../utils/ApiError.js");
const logger = require("../utils/logger.js");
const Job = require("../models/Job.js");
const Booking = require("../models/Booking.js");
const Mechanic = require("../models/Mechanic.js");

const generateJobNumber = () => {
  return `JOB-${new Date().getFullYear()}-${uuidv4().split("-")[0].toUpperCase()}`;
};

const JOB_STATUS_TRANSITIONS = {
  CREATED: ["CHECK_IN", "CANCELLED"],
  CHECK_IN: ["INSPECTION", "CANCELLED"],
  INSPECTION: ["ESTIMATE_PENDING", "REWORK", "CANCELLED"],
  ESTIMATE_PENDING: ["CUSTOMER_APPROVAL", "APPROVED", "CANCELLED"],
  CUSTOMER_APPROVAL: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "REWORK"],
  IN_PROGRESS: ["QUALITY_CHECK", "REWORK", "CANCELLED"],
  QUALITY_CHECK: ["READY", "REWORK"],
  REWORK: ["IN_PROGRESS", "QUALITY_CHECK", "CANCELLED"],
  READY: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const validateJobStatusTransition = (currentStatus, nextStatus) => {
  const allowed = JOB_STATUS_TRANSITIONS[currentStatus];

  if (!allowed.includes(nextStatus)) {
    throw new ApiError(
      400,
      `Invalid job status transition from ${currentStatus} to ${nextStatus}`,
    );
  }
};

const createJobFromBookingService = async (bookingId, serviceAdvisorId = null) => {
  const booking = await Booking.findById(bookingId)
    .populate("services.serviceId", "durationMinutes");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const existingJob = await Job.findOne({ bookingId });

  if (existingJob) {
    throw new ApiError(409, "A job already exists for this booking");
  }

  const durationMinutes = booking.services.reduce(
    (sum, item) => sum + (item.durationMinutes || 0),
    0,
  );

  const job = await Job.create({
    jobNumber: generateJobNumber(),
    bookingId: booking._id,
    customerId: booking.customerId,
    vehicleId: booking.vehicleId,
    workshopId: booking.workshopId,
    serviceAdvisorId: serviceAdvisorId || booking.customerId,
    status: "CREATED",
    customerNotes: booking.customerNotes,
    expectedCompletionAt: new Date(
      new Date(booking.appointment.date).getTime() + durationMinutes * 60 * 1000,
    ),
  });

  logger.info(`Job created: ${job.jobNumber}`);

  return job;
};

const getJobByIdService = async (jobId, user) => {
  const job = await Job.findById(jobId)
    .populate("bookingId", "bookingNumber appointment pricing")
    .populate("customerId", "name email phone")
    .populate("vehicleId", "registrationNumber make model color")
    .populate("workshopId", "name code")
    .populate("assignedMechanicId")
    .populate("serviceAdvisorId", "name email");

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (user.role === "CUSTOMER" && job.customerId._id.toString() !== user._id.toString()) {
    throw new ApiError(403, "You don't have permission to access this job");
  }

  return job;
};

const listJobsService = async (user, query, workshopId) => {
  const {
    page = 1,
    limit = 10,
    status,
    mechanicId,
    fromDate,
    toDate,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (user.role === "CUSTOMER") {
    filter.customerId = user._id;
  }

  if (workshopId) filter.workshopId = workshopId;
  if (status) filter.status = status;
  if (mechanicId) filter.assignedMechanicId = mechanicId;

  if (fromDate || toDate) {
    const dateFilter = {};
    if (fromDate) dateFilter.$gte = new Date(fromDate);
    if (toDate) dateFilter.$lte = new Date(toDate);
    filter.createdAt = dateFilter;
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate("bookingId", "bookingNumber")
      .populate("vehicleId", "registrationNumber make model")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Job.countDocuments(filter),
  ]);

  return {
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateJobStatusService = async (jobId, status, notes, user) => {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  validateJobStatusTransition(job.status, status);

  const now = new Date();

  switch (status) {
    case "CHECK_IN":
      job.checkInAt = job.checkInAt || now;
      break;
    case "IN_PROGRESS":
      job.startedAt = job.startedAt || now;
      break;
    case "COMPLETED":
      job.completedAt = now;
      break;
  }

  if (notes) {
    job.internalNotes = notes;
  }

  job.status = status;

  await job.save();

  logger.info(`Job ${job.jobNumber} status -> ${status}`);

  return job;
};

const checkInJobService = async (jobId, { odometerIn, customerNotes, internalNotes }, user) => {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.status !== "CREATED") {
    throw new ApiError(400, `Job must be in CREATED status to check in, current: ${job.status}`);
  }

  if (odometerIn !== undefined) job.odometerIn = odometerIn;
  if (customerNotes !== undefined) job.customerNotes = customerNotes;
  if (internalNotes !== undefined) job.internalNotes = internalNotes;

  job.checkInAt = new Date();
  job.status = "CHECK_IN";

  await job.save();

  logger.info(`Job ${job.jobNumber} checked in`);

  return job;
};

const assignMechanicService = async (jobId, mechanicId) => {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const mechanic = await Mechanic.findOne({ _id: mechanicId, workshopId: job.workshopId, status: "ACTIVE" });

  if (!mechanic) {
    throw new ApiError(404, "Mechanic not found in this workshop");
  }

  job.assignedMechanicId = mechanic._id;

  if (job.status !== "ASSIGNED" && job.status !== "IN_PROGRESS" && job.status !== "REWORK") {
    job.status = "ASSIGNED";
  }

  await job.save();

  logger.info(`Job ${job.jobNumber} assigned to mechanic ${mechanic._id}`);

  return job;
};

module.exports = {
  createJobFromBookingService,
  getJobByIdService,
  listJobsService,
  updateJobStatusService,
  checkInJobService,
  assignMechanicService,
};