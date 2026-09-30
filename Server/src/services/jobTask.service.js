const ApiError = require("../utils/ApiError.js");
const logger = require("../utils/logger.js");
const Job = require("../models/Job.js");
const JobTask = require("../models/JobTask.js");
const Mechanic = require("../models/Mechanic.js");

const TASK_STATUS_TRANSITIONS = {
  PENDING: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["COMPLETED", "BLOCKED"],
  BLOCKED: ["IN_PROGRESS"],
  COMPLETED: [],
};

const populateTask = async (task) => {
  return task.populate({
    path: "assignedMechanicId",
    select: "employeeCode specialization status userId",
    populate: { path: "userId", select: "name email role" },
  });
};

const getMechanic = async (userId) => {
  const mechanic = await Mechanic.findOne({ userId, status: { $ne: "INACTIVE" } });

  if (!mechanic || !mechanic.workshopId) {
    throw new ApiError(403, "No mechanic profile is associated with your account");
  }

  return mechanic;
};

const assertJobAccess = async (job, user, mechanic = null) => {
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (user.role === "CUSTOMER") {
    if (job.customerId.toString() !== user._id.toString()) {
      throw new ApiError(403, "You don't have permission to access this job");
    }
    return;
  }

  if (user.role === "MECHANIC") {
    const actorMechanic = mechanic || (await getMechanic(user._id));

    if (job.workshopId.toString() !== actorMechanic.workshopId.toString()) {
      throw new ApiError(403, "This job does not belong to your workshop");
    }
    return;
  }

  if (user.role === "ADMIN" && !user.workshopId) {
    return;
  }

  if (!user.workshopId || job.workshopId.toString() !== user.workshopId.toString()) {
    throw new ApiError(403, "This job does not belong to your workshop");
  }
};

const assertMutationAccess = (user) => {
  if (user.role === "CUSTOMER") {
    throw new ApiError(403, "Customers cannot modify job tasks");
  }
};

const assertMechanicTaskAccess = (task, mechanic) => {
  if (!task.assignedMechanicId || task.assignedMechanicId.toString() !== mechanic._id.toString()) {
    throw new ApiError(403, "This task is not assigned to you");
  }
};

const validateAssignedMechanic = async (mechanicId, workshopId) => {
  if (!mechanicId) {
    return null;
  }

  const mechanic = await Mechanic.findOne({
    _id: mechanicId,
    workshopId,
    status: { $ne: "INACTIVE" },
  });

  if (!mechanic) {
    throw new ApiError(404, "Mechanic not found in this workshop");
  }

  return mechanic;
};

const listJobTasksService = async (jobId, user, query) => {
  const job = await Job.findById(jobId);
  const mechanic = user.role === "MECHANIC" ? await getMechanic(user._id) : null;

  await assertJobAccess(job, user, mechanic);

  const {
    status,
    assignedMechanicId,
    page = 1,
    limit = 10,
    sortBy = "sequence",
    sortOrder = "asc",
  } = query;
  const filter = { jobId: job._id, isDeleted: false };

  if (status) filter.status = status;
  if (assignedMechanicId) filter.assignedMechanicId = assignedMechanicId;

  const direction = sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: direction, _id: 1 };
  const [tasks, total] = await Promise.all([
    JobTask.find(filter)
      .populate({
        path: "assignedMechanicId",
        select: "employeeCode specialization status userId",
        populate: { path: "userId", select: "name email role" },
      })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    JobTask.countDocuments(filter),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const createJobTaskService = async (jobId, data, user) => {
  assertMutationAccess(user);

  const job = await Job.findById(jobId);
  const mechanic = user.role === "MECHANIC" ? await getMechanic(user._id) : null;

  await assertJobAccess(job, user, mechanic);

  if (user.role === "MECHANIC" && data.assignedMechanicId) {
    if (data.assignedMechanicId !== mechanic._id.toString()) {
      throw new ApiError(403, "Mechanics can only create tasks assigned to themselves");
    }
  }

  await validateAssignedMechanic(data.assignedMechanicId, job.workshopId);

  let sequence = data.sequence;

  if (sequence === undefined) {
    const lastTask = await JobTask.findOne({ jobId: job._id })
      .sort({ sequence: -1, createdAt: -1 })
      .select("sequence");
    sequence = lastTask ? lastTask.sequence + 1 : 0;
  } else {
    const duplicate = await JobTask.exists({ jobId: job._id, sequence });

    if (duplicate) {
      throw new ApiError(409, "A task with this sequence already exists");
    }
  }

  const task = await JobTask.create({
    ...data,
    jobId: job._id,
    assignedMechanicId: data.assignedMechanicId || null,
    sequence,
  });

  logger.info(`Job task ${task._id} created for job ${job.jobNumber}`);

  return populateTask(task);
};

const updateJobTaskService = async (jobId, taskId, data, user) => {
  assertMutationAccess(user);

  const job = await Job.findById(jobId);
  const mechanic = user.role === "MECHANIC" ? await getMechanic(user._id) : null;

  await assertJobAccess(job, user, mechanic);

  const task = await JobTask.findOne({ _id: taskId, jobId: job._id, isDeleted: false });

  if (!task) {
    throw new ApiError(404, "Job task not found");
  }

  if (mechanic) {
    assertMechanicTaskAccess(task, mechanic);

    if (
      Object.prototype.hasOwnProperty.call(data, "assignedMechanicId") &&
      data.assignedMechanicId !== mechanic._id.toString()
    ) {
      throw new ApiError(403, "Mechanics cannot reassign their tasks");
    }
  }

  if (data.assignedMechanicId !== undefined) {
    await validateAssignedMechanic(data.assignedMechanicId, job.workshopId);
  }

  if (data.sequence !== undefined && data.sequence !== task.sequence) {
    const duplicate = await JobTask.exists({
      _id: { $ne: task._id },
      jobId: job._id,
      sequence: data.sequence,
    });

    if (duplicate) {
      throw new ApiError(409, "A task with this sequence already exists");
    }
  }

  Object.assign(task, data);

  if (data.assignedMechanicId !== undefined) {
    task.assignedMechanicId = data.assignedMechanicId || null;
  }

  await task.save();

  logger.info(`Job task ${task._id} updated`);

  return populateTask(task);
};

const updateJobTaskStatusService = async (jobId, taskId, data, user) => {
  assertMutationAccess(user);

  const job = await Job.findById(jobId);
  const mechanic = user.role === "MECHANIC" ? await getMechanic(user._id) : null;

  await assertJobAccess(job, user, mechanic);

  const task = await JobTask.findOne({ _id: taskId, jobId: job._id, isDeleted: false });

  if (!task) {
    throw new ApiError(404, "Job task not found");
  }

  if (mechanic) {
    assertMechanicTaskAccess(task, mechanic);
  }

  const allowedStatuses = TASK_STATUS_TRANSITIONS[task.status] || [];

  if (!allowedStatuses.includes(data.status)) {
    throw new ApiError(400, `Invalid task status transition from ${task.status} to ${data.status}`);
  }

  const now = new Date();

  if (data.status === "IN_PROGRESS") {
    task.startedAt = task.startedAt || now;
    task.blockedReason = null;
  }

  if (data.status === "COMPLETED") {
    task.completedAt = now;
    task.actualMinutes =
      data.actualMinutes ??
      (task.startedAt ? Math.max(0, Math.ceil((now - task.startedAt) / 60000)) : 0);
  }

  if (data.status === "BLOCKED") {
    task.blockedReason = data.blockedReason;
  }

  task.status = data.status;

  await task.save();

  logger.info(`Job task ${task._id} status -> ${data.status}`);

  return populateTask(task);
};

const deleteJobTaskService = async (jobId, taskId, user) => {
  assertMutationAccess(user);

  const job = await Job.findById(jobId);
  const mechanic = user.role === "MECHANIC" ? await getMechanic(user._id) : null;

  await assertJobAccess(job, user, mechanic);

  const task = await JobTask.findOne({ _id: taskId, jobId: job._id, isDeleted: false });

  if (!task) {
    throw new ApiError(404, "Job task not found");
  }

  if (mechanic) {
    assertMechanicTaskAccess(task, mechanic);
  }

  task.isDeleted = true;
  task.deletedAt = new Date();
  task.deletedBy = user._id;

  await task.save();

  logger.info(`Job task ${task._id} soft deleted`);

  return populateTask(task);
};

module.exports = {
  TASK_STATUS_TRANSITIONS,
  listJobTasksService,
  createJobTaskService,
  updateJobTaskService,
  updateJobTaskStatusService,
  deleteJobTaskService,
};
