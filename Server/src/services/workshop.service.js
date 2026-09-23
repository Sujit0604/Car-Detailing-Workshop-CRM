const ApiError = require("../utils/ApiError.js");
const Workshop = require("../models/Workshop.js");
const Job = require("../models/Job.js");
const Booking = require("../models/Booking.js");
const InventoryPart = require("../models/InventoryPart.js");
const Mechanic = require("../models/Mechanic.js");
const User = require("../models/User.js");
const logger = require("../utils/logger.js");

const createWorkshopService = async (workshopData) => {
  const { code } = workshopData;

  const existingWorkshop = await Workshop.findOne({ code });

  if (existingWorkshop) {
    throw new ApiError(409, "A workshop with this code already exists");
  }

  const workshop = await Workshop.create(workshopData);

  logger.info(`Workshop created: ${workshop._id}`);

  return workshop;
};

const getWorkshopByIdService = async (workshopId) => {
  const workshop = await Workshop.findById(workshopId);

  if (!workshop) {
    throw new ApiError(404, "Workshop not found");
  }

  return workshop;
};

const listWorkshopsService = async (user, query) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    city,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  } else if (user.role !== "ADMIN") {
    filter.status = "ACTIVE";
  }

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { code: regex }, { "address.city": regex }];
  }

  if (city) {
    filter["address.city"] = new RegExp(city, "i");
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [workshops, total] = await Promise.all([
    Workshop.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Workshop.countDocuments(filter),
  ]);

  const workshopIds = workshops.map((w) => w._id);

  const [mechanics, advisors, managers] = await Promise.all([
    Mechanic.aggregate([
      { $match: { workshopId: { $in: workshopIds }, status: { $ne: "INACTIVE" } } },
      { $group: { _id: "$workshopId", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { role: "SERVICE_ADVISOR", status: "ACTIVE", workshopId: { $in: workshopIds } } },
      { $group: { _id: "$workshopId", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { role: "WORKSHOP_MANAGER", status: "ACTIVE", workshopId: { $in: workshopIds } } },
      { $group: { _id: "$workshopId", count: { $sum: 1 } } },
    ]),
  ]);

  const toCountMap = (rows) => Object.fromEntries(rows.map((r) => [r._id.toString(), r.count]));
  const mechanicCounts = toCountMap(mechanics);
  const advisorCounts = toCountMap(advisors);
  const managerCounts = toCountMap(managers);

  const decorated = workshops.map((w) => ({
    ...w.toObject(),
    staff: {
      managers: managerCounts[w._id.toString()] || 0,
      advisors: advisorCounts[w._id.toString()] || 0,
      mechanics: mechanicCounts[w._id.toString()] || 0,
    },
  }));

  return {
    workshops: decorated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateWorkshopService = async (workshopId, updateData) => {
  const workshop = await getWorkshopByIdService(workshopId);

  if (updateData.code && updateData.code !== workshop.code) {
    const existingWorkshop = await Workshop.findOne({ code: updateData.code });

    if (existingWorkshop) {
      throw new ApiError(409, "A workshop with this code already exists");
    }
  }

  Object.assign(workshop, updateData);

  await workshop.save();

  logger.info(`Workshop updated: ${workshop._id}`);

  return workshop;
};

const deleteWorkshopService = async (workshopId) => {
  const workshop = await getWorkshopByIdService(workshopId);

  workshop.status = "INACTIVE";

  await workshop.save();

  logger.info(`Workshop deactivated (soft): ${workshop._id}`);

  return { _id: workshop._id, status: workshop.status };
};

const getWorkshopOverviewService = async (workshopId) => {
  const workshop = await getWorkshopByIdService(workshopId);

  const [jobCounts, bookingCounts, activeJobs, lowStockParts, mechanicsActive, advisorCount, managerCount, todayBookings] =
    await Promise.all([
      Job.aggregate([{ $match: { workshopId: workshop._id } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Booking.aggregate([{ $match: { workshopId: workshop._id } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Job.countDocuments({ workshopId: workshop._id, status: { $nin: ["COMPLETED", "CANCELLED", "DELIVERED"] } }),
      InventoryPart.find({
        workshopId: workshop._id,
        status: "ACTIVE",
        $expr: { $lte: ["$stock.quantity", "$stock.reorderLevel"] },
      })
        .select("partNumber name stock")
        .sort({ "stock.quantity": 1 })
        .limit(8),
      Mechanic.countDocuments({ workshopId: workshop._id, status: { $ne: "INACTIVE" } }),
      User.countDocuments({ role: "SERVICE_ADVISOR", status: "ACTIVE", workshopId: workshop._id }),
      User.countDocuments({ role: "WORKSHOP_MANAGER", status: "ACTIVE", workshopId: workshop._id }),
      Booking.countDocuments({
        workshopId: workshop._id,
        status: { $nin: ["CANCELLED", "NO_SHOW", "COMPLETED"] },
      }),
    ]);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const bookingsToday = await Booking.countDocuments({
    workshopId: workshop._id,
    "appointment.date": { $gte: startOfDay, $lte: endOfDay },
  });

  const jobsByStatus = Object.fromEntries(jobCounts.map((item) => [item._id, item.count]));
  const bookingsByStatus = Object.fromEntries(bookingCounts.map((item) => [item._id, item.count]));

  return {
    workshop: { _id: workshop._id, name: workshop.name, code: workshop.code },
    jobsByStatus,
    bookingsByStatus,
    totalActiveJobs: activeJobs,
    bookingsToday,
    totalOpenBookings: todayBookings,
    activeMechanics: mechanicsActive,
    activeServiceAdvisors: advisorCount,
    activeWorkshopManagers: managerCount,
    lowStockParts,
    lowStockCount: lowStockParts.length,
  };
};

const getWorkshopStaffService = async (workshopId) => {
  const workshop = await getWorkshopByIdService(workshopId);

  const [managers, advisors, mechanics] = await Promise.all([
    User.find({ role: "WORKSHOP_MANAGER", workshopId: workshop._id }, "-password")
      .sort({ createdAt: 1 }),
    User.find({ role: "SERVICE_ADVISOR", workshopId: workshop._id }, "-password")
      .sort({ createdAt: 1 }),
    Mechanic.find({ workshopId: workshop._id })
      .populate("userId", "name email phone role status")
      .sort({ createdAt: 1 }),
  ]);

  return {
    workshop: { _id: workshop._id, name: workshop.name, code: workshop.code },
    managers,
    advisors,
    mechanics,
  };
};

module.exports = {
  createWorkshopService,
  getWorkshopByIdService,
  listWorkshopsService,
  updateWorkshopService,
  deleteWorkshopService,
  getWorkshopOverviewService,
  getWorkshopStaffService,
};