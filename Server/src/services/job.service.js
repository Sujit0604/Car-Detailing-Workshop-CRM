const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError.js");
const logger = require("../utils/logger.js");
const { resolveScopedWorkshopId, assertOwnWorkshop } = require("../utils/workshopScope.js");
const Job = require("../models/Job.js");
const Booking = require("../models/Booking.js");
const User = require("../models/User.js");
const Mechanic = require("../models/Mechanic.js");

const generateJobNumber = () => {
  return `JOB-${new Date().getFullYear()}-${uuidv4().split("-")[0].toUpperCase()}`;
};

const VEHICLE_DETAIL_FIELDS =
  "registrationNumber make model variant vin manufacturingYear fuelType transmission color odometer images";

const JOB_STATUS_TRANSITIONS = {
  CREATED: ["CHECK_IN", "CANCELLED"],
  CHECK_IN: ["INSPECTION", "CANCELLED"],
  INSPECTION: ["ESTIMATE_PENDING", "REWORK", "CANCELLED"],
  ESTIMATE_PENDING: ["CUSTOMER_APPROVAL", "APPROVED", "CANCELLED"],
  CUSTOMER_APPROVAL: ["APPROVED", "ESTIMATE_PENDING", "CANCELLED"],
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

// Who is allowed to move a job INTO each target status.
// Workshop Manager supervises both the mechanics' work (quality control)
// and the service advisor's workflow, so they can drive every stage.
const ROLE_STATUS_PERMISSIONS = {
  CHECK_IN: ["SERVICE_ADVISOR", "WORKSHOP_MANAGER", "ADMIN"],
  INSPECTION: ["SERVICE_ADVISOR", "WORKSHOP_MANAGER", "ADMIN"],
  ESTIMATE_PENDING: ["SERVICE_ADVISOR", "WORKSHOP_MANAGER", "ADMIN"],
  CUSTOMER_APPROVAL: ["SERVICE_ADVISOR", "WORKSHOP_MANAGER", "ADMIN"],
  APPROVED: ["SERVICE_ADVISOR", "WORKSHOP_MANAGER", "ADMIN"],
  ASSIGNED: ["SERVICE_ADVISOR", "WORKSHOP_MANAGER", "ADMIN"],
  IN_PROGRESS: ["MECHANIC", "WORKSHOP_MANAGER", "ADMIN"],
  QUALITY_CHECK: ["MECHANIC", "WORKSHOP_MANAGER", "ADMIN"],
  REWORK: ["MECHANIC", "SERVICE_ADVISOR", "WORKSHOP_MANAGER", "ADMIN"],
  READY: ["WORKSHOP_MANAGER", "ADMIN"],
  DELIVERED: ["SERVICE_ADVISOR", "WORKSHOP_MANAGER", "ADMIN"],
  COMPLETED: ["SERVICE_ADVISOR", "WORKSHOP_MANAGER", "ADMIN"],
  CANCELLED: ["SERVICE_ADVISOR", "WORKSHOP_MANAGER", "ADMIN"],
};

const getMechanicForUser = async (userId) => {
  return Mechanic.findOne({ userId, status: { $ne: "INACTIVE" } });
};

const validateJobStatusTransition = (currentStatus, nextStatus) => {
  const allowed = JOB_STATUS_TRANSITIONS[currentStatus];

  if (!allowed || !allowed.includes(nextStatus)) {
    throw new ApiError(
      400,
      `Invalid job status transition from ${currentStatus} to ${nextStatus}`,
    );
  }
};

const authorizeJobStatusChange = (user, nextStatus) => {
  const roles = ROLE_STATUS_PERMISSIONS[nextStatus];

  if (!roles) {
    throw new ApiError(400, `Status ${nextStatus} cannot be set through this endpoint`);
  }

  if (!roles.includes(user.role)) {
    throw new ApiError(403, "Your role is not allowed to perform this action");
  }
};

const assertMechanicCanUpdate = async (job, user) => {
  if (user.role !== "MECHANIC") return;

  const mechanic = await getMechanicForUser(user._id);

  if (!mechanic) {
    throw new ApiError(403, "No mechanic profile found for your account");
  }

  if (!job.assignedMechanicId || job.assignedMechanicId.toString() !== mechanic._id.toString()) {
    throw new ApiError(403, "This job is not assigned to you");
  }
};

const findBookingByIdentifier = async (identifier) => {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return Booking.findById(identifier)
      .populate("services.serviceId", "durationMinutes");
  }

  return Booking.findOne({ bookingNumber: identifier.toUpperCase() })
    .populate("services.serviceId", "durationMinutes");
};

const resolveJobWorkshopManager = async (actor, booking) => {
  if (actor && actor.role === "WORKSHOP_MANAGER" && actor.workshopId) {
    return actor._id;
  }

  const manager = await User.findOne({
    role: "WORKSHOP_MANAGER",
    status: "ACTIVE",
    workshopId: booking.workshopId,
  }).select("_id");

  return manager ? manager._id : null;
};

const createJobFromBookingService = async (bookingId, serviceAdvisorId, actor = null) => {
  const booking = await findBookingByIdentifier(bookingId);

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (actor) {
    await assertOwnWorkshop(actor, booking.workshopId);
  }

  const existingJob = await Job.findOne({ bookingId });

  if (existingJob) {
    throw new ApiError(409, "A job already exists for this booking");
  }

  const durationMinutes = booking.services.reduce(
    (sum, item) => sum + (item.durationMinutes || 0),
    0,
  );

  const advisorId =
    serviceAdvisorId ||
    (actor && ["SERVICE_ADVISOR", "WORKSHOP_MANAGER", "ADMIN"].includes(actor.role)
      ? actor._id
      : null);

  const workshopManagerId = await resolveJobWorkshopManager(actor, booking);

  const job = await Job.create({
    jobNumber: generateJobNumber(),
    bookingId: booking._id,
    customerId: booking.customerId,
    vehicleId: booking.vehicleId,
    workshopId: booking.workshopId,
    serviceAdvisorId: advisorId,
    workshopManagerId,
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
    .populate("vehicleId", VEHICLE_DETAIL_FIELDS)
    .populate("workshopId", "name code")
    .populate({
      path: "assignedMechanicId",
      select: "employeeCode specialization experienceYears userId",
      populate: { path: "userId", select: "name email phone role" },
    })
    .populate("serviceAdvisorId", "name email phone role")
    .populate("workshopManagerId", "name email phone role");

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (user.role === "CUSTOMER" && job.customerId._id.toString() !== user._id.toString()) {
    throw new ApiError(403, "You don't have permission to access this job");
  }

  if (user.role === "MECHANIC") {
    const mechanic = await getMechanicForUser(user._id);

    if (!mechanic || job.workshopId._id.toString() !== mechanic.workshopId.toString()) {
      throw new ApiError(403, "This job does not belong to your workshop");
    }
  }

  await assertOwnWorkshop(user, job.workshopId?._id);

  const result = job.toObject();

  if (result.serviceAdvisorId && result.serviceAdvisorId.role === "CUSTOMER") {
    const workshopSA = await User.findOne({
      role: "SERVICE_ADVISOR",
      status: "ACTIVE",
      workshopId: result.workshopId?._id || job.workshopId,
    }).select("name email phone");

    if (workshopSA) result.serviceAdvisorId = workshopSA;
  }

  if (!result.workshopManagerId) {
    const workshopManager = await User.findOne({
      role: "WORKSHOP_MANAGER",
      status: "ACTIVE",
      workshopId: result.workshopId?._id || job.workshopId,
    }).select("name email phone");

    if (workshopManager) result.workshopManagerId = workshopManager;
  }

  return result;
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

  // Workshop staff only ever list jobs from the workshop they are posted to.
  const scopedWorkshopId = await resolveScopedWorkshopId(user, workshopId);

  if (user.role === "MECHANIC") {
    const mechanic = await getMechanicForUser(user._id);

    if (!mechanic) {
      return { jobs: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    filter.assignedMechanicId = mechanic._id;
    filter.workshopId = scopedWorkshopId || mechanic.workshopId;
  } else if (scopedWorkshopId) {
    filter.workshopId = scopedWorkshopId;
  }

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
      .populate("vehicleId", "registrationNumber make model variant color")
      .populate({
        path: "assignedMechanicId",
        select: "employeeCode userId",
        populate: { path: "userId", select: "name" },
      })
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

  authorizeJobStatusChange(user, status);

  await assertMechanicCanUpdate(job, user);

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

  logger.info(`Job ${job.jobNumber} status -> ${status} (by ${user.role})`);

  return job;
};

const checkInJobService = async (jobId, { odometerIn, customerNotes, internalNotes }, user) => {
  if (!["SERVICE_ADVISOR", "WORKSHOP_MANAGER", "ADMIN"].includes(user.role)) {
    throw new ApiError(403, "Only a service advisor or workshop manager can check in a vehicle");
  }

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
  JOB_STATUS_TRANSITIONS,
  ROLE_STATUS_PERMISSIONS,
  getMechanicForUser,
  createJobFromBookingService,
  getJobByIdService,
  listJobsService,
  updateJobStatusService,
  checkInJobService,
  assignMechanicService,
};