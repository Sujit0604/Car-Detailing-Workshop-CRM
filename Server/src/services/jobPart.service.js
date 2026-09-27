const ApiError = require("../utils/ApiError.js");
const logger = require("../utils/logger.js");
const InventoryPart = require("../models/InventoryPart.js");
const Job = require("../models/Job.js");
const JobPart = require("../models/JobPart.js");
const Mechanic = require("../models/Mechanic.js");

const JOB_PART_STATUS_TRANSITIONS = {
  RESERVED: ["USED", "CANCELLED"],
  USED: ["RETURNED"],
  RETURNED: [],
  CANCELLED: [],
};

const populatePart = async (part) => {
  return part.populate({
    path: "inventoryPartId",
    select: "workshopId partNumber name category brand unit sellingPrice stock status",
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

const assertStaffAccess = (user) => {
  if (user.role === "CUSTOMER") {
    throw new ApiError(403, "Customers cannot access job parts");
  }
};

const getJobPart = async (jobId, partId) => {
  const part = await JobPart.findOne({ _id: partId, jobId, isDeleted: false });

  if (!part) {
    throw new ApiError(404, "Job part not found");
  }

  return part;
};

const listJobPartsService = async (jobId, user, query) => {
  assertStaffAccess(user);

  const job = await Job.findById(jobId);
  const mechanic = user.role === "MECHANIC" ? await getMechanic(user._id) : null;

  await assertJobAccess(job, user, mechanic);

  const {
    inventoryPartId,
    status,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;
  const filter = { jobId: job._id, isDeleted: false };

  if (inventoryPartId) filter.inventoryPartId = inventoryPartId;
  if (status) filter.status = status;

  const direction = sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: direction, _id: 1 };
  const [parts, total] = await Promise.all([
    JobPart.find(filter)
      .populate({
        path: "inventoryPartId",
        select: "workshopId partNumber name category brand unit sellingPrice stock status",
      })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    JobPart.countDocuments(filter),
  ]);

  return {
    parts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const createJobPartService = async (jobId, data, user) => {
  assertStaffAccess(user);

  const job = await Job.findById(jobId);
  const mechanic = user.role === "MECHANIC" ? await getMechanic(user._id) : null;

  await assertJobAccess(job, user, mechanic);

  const inventoryPart = await InventoryPart.findOne({
    _id: data.inventoryPartId,
    workshopId: job.workshopId,
    status: "ACTIVE",
  });

  if (!inventoryPart) {
    throw new ApiError(404, "Inventory part not found in this workshop");
  }

  const reservedPart = await InventoryPart.findOneAndUpdate(
    {
      _id: inventoryPart._id,
      workshopId: job.workshopId,
      status: "ACTIVE",
      $expr: {
        $gte: [
          { $subtract: ["$stock.quantity", "$stock.reservedQuantity"] },
          data.quantity,
        ],
      },
    },
    {
      $inc: { "stock.reservedQuantity": data.quantity },
      $set: {
        "stock.reasonOfLastAdjustment": `Reserved for job ${job.jobNumber}`,
      },
    },
    { new: true },
  );

  if (!reservedPart) {
    throw new ApiError(409, "Insufficient available stock");
  }

  const unitPrice = reservedPart.sellingPrice;
  const totalPrice = Number((unitPrice * data.quantity).toFixed(2));

  try {
    const part = await JobPart.create({
      jobId: job._id,
      inventoryPartId: inventoryPart._id,
      quantity: data.quantity,
      unitPrice,
      totalPrice,
      status: "RESERVED",
      reservedAt: new Date(),
    });

    logger.info(`Inventory part ${inventoryPart.partNumber} reserved for job ${job.jobNumber}`);

    return populatePart(part);
  } catch (error) {
    await InventoryPart.updateOne(
      {
        _id: inventoryPart._id,
        workshopId: job.workshopId,
        "stock.reservedQuantity": { $gte: data.quantity },
      },
      {
        $inc: { "stock.reservedQuantity": -data.quantity },
        $set: {
          "stock.reasonOfLastAdjustment": `Reservation rolled back for job ${job.jobNumber}`,
        },
      },
    );

    throw error;
  }
};

const applyInventoryStatusChange = async (part, job, inventoryPart, nextStatus) => {
  const reason = `Job ${job.jobNumber} part ${inventoryPart.partNumber} marked ${nextStatus}`;

  if (nextStatus === "USED") {
    const updatedPart = await InventoryPart.findOneAndUpdate(
      {
        _id: inventoryPart._id,
        workshopId: job.workshopId,
        "stock.quantity": { $gte: part.quantity },
        "stock.reservedQuantity": { $gte: part.quantity },
      },
      {
        $inc: {
          "stock.quantity": -part.quantity,
          "stock.reservedQuantity": -part.quantity,
        },
        $set: { "stock.reasonOfLastAdjustment": reason },
      },
      { new: true },
    );

    if (!updatedPart) {
      throw new ApiError(409, "Reserved stock is no longer available");
    }
    return;
  }

  if (nextStatus === "RETURNED") {
    const updatedPart = await InventoryPart.findOneAndUpdate(
      { _id: inventoryPart._id, workshopId: job.workshopId },
      {
        $inc: { "stock.quantity": part.quantity },
        $set: { "stock.reasonOfLastAdjustment": reason },
      },
      { new: true },
    );

    if (!updatedPart) {
      throw new ApiError(404, "Inventory part not found");
    }
    return;
  }

  if (nextStatus === "CANCELLED") {
    const updatedPart = await InventoryPart.findOneAndUpdate(
      {
        _id: inventoryPart._id,
        workshopId: job.workshopId,
        "stock.reservedQuantity": { $gte: part.quantity },
      },
      {
        $inc: { "stock.reservedQuantity": -part.quantity },
        $set: { "stock.reasonOfLastAdjustment": reason },
      },
      { new: true },
    );

    if (!updatedPart) {
      throw new ApiError(409, "Reserved stock is no longer available");
    }
  }
};

const transitionJobPart = async (part, job, nextStatus, reason, user) => {
  if (part.status === nextStatus) {
    return part;
  }

  const allowedStatuses = JOB_PART_STATUS_TRANSITIONS[part.status] || [];

  if (!allowedStatuses.includes(nextStatus)) {
    throw new ApiError(400, `Invalid job part status transition from ${part.status} to ${nextStatus}`);
  }

  const inventoryPart = await InventoryPart.findById(part.inventoryPartId).select(
    "_id partNumber workshopId",
  );

  if (!inventoryPart || inventoryPart.workshopId.toString() !== job.workshopId.toString()) {
    throw new ApiError(404, "Inventory part not found in this workshop");
  }

  const now = new Date();
  const timestampField = {
    USED: "usedAt",
    RETURNED: "returnedAt",
    CANCELLED: "cancelledAt",
  }[nextStatus];
  const claimedPart = await JobPart.findOneAndUpdate(
    { _id: part._id, jobId: job._id, status: part.status, isDeleted: false },
    {
      $set: {
        status: nextStatus,
        [timestampField]: now,
        statusReason: reason || null,
      },
    },
    { new: true },
  );

  if (!claimedPart) {
    const currentPart = await JobPart.findById(part._id);

    if (currentPart?.status === nextStatus) {
      return currentPart;
    }

    throw new ApiError(409, "Job part status changed before the update could be applied");
  }

  try {
    await applyInventoryStatusChange(claimedPart, job, inventoryPart, nextStatus);
  } catch (error) {
    await JobPart.updateOne(
      { _id: claimedPart._id, status: nextStatus, [timestampField]: now },
      {
        $set: {
          status: part.status,
          [timestampField]: null,
          statusReason: null,
        },
      },
    );

    throw error;
  }

  logger.info(
    `Job part ${claimedPart._id} status -> ${nextStatus} by ${user.role} for job ${job.jobNumber}`,
  );

  return claimedPart;
};

const updateJobPartStatusService = async (jobId, partId, data, user) => {
  assertStaffAccess(user);

  const job = await Job.findById(jobId);
  const mechanic = user.role === "MECHANIC" ? await getMechanic(user._id) : null;

  await assertJobAccess(job, user, mechanic);

  const part = await getJobPart(jobId, partId);
  const updatedPart = await transitionJobPart(part, job, data.status, data.reason, user);

  return populatePart(updatedPart);
};

const cancelJobPartService = async (jobId, partId, reason, user) => {
  assertStaffAccess(user);

  const job = await Job.findById(jobId);
  const mechanic = user.role === "MECHANIC" ? await getMechanic(user._id) : null;

  await assertJobAccess(job, user, mechanic);

  const part = await getJobPart(jobId, partId);
  const cancelledPart = await transitionJobPart(part, job, "CANCELLED", reason, user);

  return populatePart(cancelledPart);
};

const deleteJobPartService = async (jobId, partId, user) => {
  assertStaffAccess(user);

  const job = await Job.findById(jobId);
  const mechanic = user.role === "MECHANIC" ? await getMechanic(user._id) : null;

  await assertJobAccess(job, user, mechanic);

  let part = await getJobPart(jobId, partId);

  if (part.status === "RESERVED") {
    part = await transitionJobPart(part, job, "CANCELLED", "Job part deleted", user);
  }

  if (part.status === "USED") {
    throw new ApiError(400, "Used parts must be returned before deletion");
  }

  part.isDeleted = true;
  part.deletedAt = new Date();
  part.deletedBy = user._id;
  await part.save();

  logger.info(`Job part ${part._id} soft deleted`);

  return populatePart(part);
};

module.exports = {
  JOB_PART_STATUS_TRANSITIONS,
  listJobPartsService,
  createJobPartService,
  updateJobPartStatusService,
  cancelJobPartService,
  deleteJobPartService,
};
