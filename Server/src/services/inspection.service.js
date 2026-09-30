const ApiError = require("../utils/ApiError.js");
const logger = require("../utils/logger.js");
const mongoose = require("mongoose");
const Inspection = require("../models/Inspection.js");
const Job = require("../models/Job.js");
const Mechanic = require("../models/Mechanic.js");

// Staff paste whatever is on their screen: a job ObjectId or a job number
// (JOB-2026-AB12CD34). Accept both.
const resolveJob = async (identifier) => {
  const value = String(identifier || "").trim();

  if (!value) return null;

  if (mongoose.Types.ObjectId.isValid(value)) {
    return Job.findById(value);
  }

  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Job.findOne({ jobNumber: new RegExp(`^${escaped}$`, "i") });
};

const populateInspection = async (inspection) => {
  return inspection.populate("jobId", "jobNumber status workshopId customerId");
};

const getStaffWorkshopId = async (user) => {
  if (user.role === "ADMIN") {
    return user.workshopId || null;
  }

  if (user.role === "MECHANIC") {
    const mechanic = await Mechanic.findOne({ userId: user._id, status: { $ne: "INACTIVE" } });

    if (!mechanic || !mechanic.workshopId) {
      throw new ApiError(403, "No mechanic profile is associated with your account");
    }

    return mechanic.workshopId;
  }

  if (!user.workshopId) {
    throw new ApiError(403, "Your account is not assigned to a workshop");
  }

  return user.workshopId;
};

const assertStaffAccess = (user) => {
  if (user.role === "CUSTOMER") {
    throw new ApiError(403, "Customers cannot modify inspections");
  }
};

const assertJobAccess = async (job, user) => {
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (user.role === "CUSTOMER") {
    if (job.customerId.toString() !== user._id.toString()) {
      throw new ApiError(403, "You don't have permission to access this job");
    }
    return;
  }

  if (user.role === "ADMIN" && !user.workshopId) {
    return;
  }

  const workshopId = await getStaffWorkshopId(user);

  if (!workshopId || job.workshopId.toString() !== workshopId.toString()) {
    throw new ApiError(403, "This job does not belong to your workshop");
  }
};

const createInspectionService = async (data, user) => {
  assertStaffAccess(user);

  const job = await resolveJob(data.jobId);

  await assertJobAccess(job, user);

  const inspection = await Inspection.create({
    ...data,
    // Always store the resolved ObjectId, never the job number the user typed.
    jobId: job._id,
    inspectorId: user._id,
  });

  logger.info(`Inspection created for job ${job.jobNumber}`);

  return populateInspection(inspection);
};

const getInspectionService = async (inspectionId, user) => {
  const inspection = await Inspection.findById(inspectionId);

  if (!inspection) {
    throw new ApiError(404, "Inspection not found");
  }

  const job = await Job.findById(inspection.jobId);

  await assertJobAccess(job, user);

  return populateInspection(inspection);
};

const listInspectionsService = async (user, query) => {
  const {
    jobId,
    inspectionType,
    status,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;
  const jobFilter = {};
  let resolvedJobId = null;

  if (jobId) {
    const requestedJob = await resolveJob(jobId);

    if (!requestedJob) {
      throw new ApiError(404, "Job not found");
    }

    resolvedJobId = requestedJob._id;
  }

  if (user.role === "CUSTOMER") {
    jobFilter.customerId = user._id;
  } else if (user.role !== "ADMIN" || user.workshopId) {
    jobFilter.workshopId = await getStaffWorkshopId(user);
  }

  const jobs = await Job.find(jobFilter).select("_id");
  const filter = {};

  filter.jobId = resolvedJobId ? resolvedJobId : { $in: jobs.map((job) => job._id) };

  if (inspectionType) filter.inspectionType = inspectionType;
  if (status) filter.status = status;

  const direction = sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: direction, _id: 1 };
  const [inspections, total] = await Promise.all([
    Inspection.find(filter)
      .populate("jobId", "jobNumber status workshopId customerId")
      .populate("inspectorId", "name email role")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Inspection.countDocuments(filter),
  ]);

  return {
    inspections,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateInspectionService = async (inspectionId, data, user) => {
  assertStaffAccess(user);

  const inspection = await Inspection.findById(inspectionId);

  if (!inspection) {
    throw new ApiError(404, "Inspection not found");
  }

  const job = await Job.findById(inspection.jobId);

  await assertJobAccess(job, user);

  if (inspection.status === "COMPLETED") {
    throw new ApiError(400, "Completed inspections cannot be updated");
  }

  Object.assign(inspection, data);
  await inspection.save();

  logger.info(`Inspection ${inspection._id} updated`);

  return populateInspection(inspection);
};

const completeInspectionService = async (inspectionId, user) => {
  assertStaffAccess(user);

  const inspection = await Inspection.findById(inspectionId);

  if (!inspection) {
    throw new ApiError(404, "Inspection not found");
  }

  const job = await Job.findById(inspection.jobId);

  await assertJobAccess(job, user);

  if (inspection.status === "COMPLETED" && job.status === "ESTIMATE_PENDING") {
    return populateInspection(inspection);
  }

  if (!["INSPECTION", "REWORK"].includes(job.status)) {
    throw new ApiError(
      400,
      `Inspection can only be completed when the job is in INSPECTION or REWORK status`,
    );
  }

  if (inspection.status === "COMPLETED") {
    throw new ApiError(409, "Completed inspection and job status are out of sync");
  }

  const previousJobStatus = job.status;
  const transitionedJob = await Job.findOneAndUpdate(
    { _id: job._id, status: { $in: ["INSPECTION", "REWORK"] } },
    { $set: { status: "ESTIMATE_PENDING" } },
    { new: true },
  );

  if (!transitionedJob) {
    throw new ApiError(409, "Job status changed before the inspection could be completed");
  }

  const rollbackJobStatus = async () => {
    await Job.updateOne(
      { _id: job._id, status: "ESTIMATE_PENDING" },
      { $set: { status: previousJobStatus } },
    );
  };
  let completedInspection;

  try {
    completedInspection = await Inspection.findOneAndUpdate(
      { _id: inspection._id, status: "DRAFT" },
      { $set: { status: "COMPLETED", completedAt: new Date() } },
      { new: true },
    );

    if (!completedInspection) {
      throw new ApiError(409, "Inspection status changed before completion");
    }
  } catch (error) {
    await rollbackJobStatus();
    throw error;
  }

  logger.info(`Inspection ${completedInspection._id} completed for job ${job.jobNumber}`);

  return populateInspection(completedInspection);
};

module.exports = {
  createInspectionService,
  getInspectionService,
  listInspectionsService,
  updateInspectionService,
  completeInspectionService,
};
