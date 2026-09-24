const ApiError = require("../utils/ApiError.js");
const logger = require("../utils/logger.js");
const User = require("../models/User.js");
const Workshop = require("../models/Workshop.js");
const Service = require("../models/Service.js");
const ServiceCategory = require("../models/ServiceCategory.js");
const Booking = require("../models/Booking.js");
const Job = require("../models/Job.js");

const USER_ROLES = ["CUSTOMER", "ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"];
const STAFF_ROLES = ["WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"];
const USER_STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED", "PENDING_VERIFICATION"];

const getStatsService = async () => {
  const [
    totalUsers,
    totalCustomers,
    totalWorkshops,
    totalServices,
    totalCategories,
    totalBookings,
    activeBookings,
    totalJobs,
    activeJobs,
    revenueResult,
    bookingStatusCounts,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "CUSTOMER" }),
    Workshop.countDocuments(),
    Service.countDocuments({ isActive: true }),
    ServiceCategory.countDocuments({ isActive: true }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: { $nin: ["CANCELLED", "NO_SHOW", "COMPLETED"] } }),
    Job.countDocuments(),
    Job.countDocuments({ status: { $nin: ["CANCELLED", "COMPLETED"] } }),
    Booking.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]),
    Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

    const statusBreakdown = Object.fromEntries(
      bookingStatusCounts.map((item) => [item._id, item.count]),
    );

    const recentBookings = await Booking.find()
      .populate("vehicleId", "registrationNumber make model")
      .populate("workshopId", "name code")
      .sort({ createdAt: -1 })
      .limit(6);

    logger.info("Admin dashboard stats fetched");

  return {
    users: {
      total: totalUsers,
      customers: totalCustomers,
    },
    workshops: totalWorkshops,
    services: totalServices,
    serviceCategories: totalCategories,
    bookings: {
      total: totalBookings,
      active: activeBookings,
    },
    jobs: {
      total: totalJobs,
      active: activeJobs,
    },
    revenue: revenueResult[0]?.total || 0,
    bookingStatusBreakdown: statusBreakdown,
    recentBookings,
  };
};

const listUsersService = async (query) => {
  const {
    page = 1,
    limit = 10,
    role,
    status,
    search,
    workshopId,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (role) filter.role = role;
  if (status) filter.status = status;
  if (workshopId) filter.workshopId = workshopId;

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [users, total] = await Promise.all([
    User.find(filter, "-password")
      .populate("workshopId", "name code")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateUserStatusService = async (userId, status, actorId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!USER_STATUSES.includes(status)) {
    throw new ApiError(400, "Invalid user status");
  }

  if (user._id.toString() === actorId.toString()) {
    throw new ApiError(400, "You cannot change your own status");
  }

  if (user.role === "ADMIN" && status !== "ACTIVE") {
    throw new ApiError(400, "An admin account cannot be blocked or deactivated");
  }

  user.status = status;

  await user.save();

  logger.info(`User ${user._id} status -> ${status} (by ${actorId})`);

  return { _id: user._id, name: user.name, role: user.role, status: user.status };
};

const updateUserRoleService = async (userId, role, actorId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!USER_ROLES.includes(role)) {
    throw new ApiError(400, "Invalid user role");
  }

  if (user._id.toString() === actorId.toString()) {
    throw new ApiError(400, "You cannot change your own role");
  }

  if (user.role === "ADMIN" && role !== "ADMIN") {
    throw new ApiError(400, "An admin account cannot be demoted");
  }

  user.role = role;

  if (!["WORKSHOP_MANAGER", "SERVICE_ADVISOR"].includes(role)) {
    user.workshopId = null;
  }

  await user.save();

  logger.info(`User ${user._id} role -> ${role} (by ${actorId})`);

  return { _id: user._id, name: user.name, role: user.role, status: user.status };
};

const updateUserWorkshopService = async (userId, workshopId, actorId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!["WORKSHOP_MANAGER", "SERVICE_ADVISOR"].includes(user.role)) {
    throw new ApiError(400, "Only a workshop manager or service advisor can be posted at a workshop");
  }

  if (workshopId) {
    const workshop = await Workshop.findById(workshopId).select("name code");

    if (!workshop) {
      throw new ApiError(404, "Workshop not found");
    }

    user.workshopId = workshop._id;
  } else {
    user.workshopId = null;
  }

  await user.save();

  logger.info(`User ${user._id} workshop -> ${user.workshopId || "none"} (by ${actorId})`);

  return {
    _id: user._id,
    name: user.name,
    role: user.role,
    status: user.status,
    workshopId: user.workshopId,
  };
};

const listAllBookingsService = async (query) => {
  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    fromDate,
    toDate,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  if (fromDate || toDate) {
    const dateFilter = {};
    if (fromDate) dateFilter.$gte = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
    if (toDate) dateFilter.$lte = new Date(new Date(toDate).setHours(23, 59, 59, 999));
    filter["appointment.date"] = dateFilter;
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("customerId", "name email phone")
      .populate("vehicleId", "registrationNumber make model")
      .populate("workshopId", "name code")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const createStaffUserService = async (data, actorId) => {
  const {
    name,
    email,
    password,
    gender,
    phone,
    role,
    workshopId,
  } = data;

  if (!STAFF_ROLES.includes(role)) {
    throw new ApiError(400, "Only staff roles can be created by an admin");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  }).select("_id");

  if (existingUser) {
    throw new ApiError(400, "User with this email or phone already exists");
  }

  if (workshopId) {
    const workshop = await Workshop.findById(workshopId).select("_id");

    if (!workshop) {
      throw new ApiError(404, "Workshop not found");
    }
  }

  const threeDayExpires = new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const user = await User.create({
    name,
    email,
    password,
    gender,
    phone,
    role,
    workshopId: workshopId || null,
    status: "ACTIVE",
    emailVerified: true,
    needsVerification: false,
    threeDayExpires,
  });

  logger.info(`Staff user created: ${user.email} (${role}) by ${actorId}`);

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    role: user.role,
    status: user.status,
    workshopId: workshopId || null,
  };
};

const listAllJobsService = async (query) => {
  const {
    page = 1,
    limit = 10,
    status,
    fromDate,
    toDate,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (status) filter.status = status;

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
      .populate("customerId", "name phone")
      .populate("vehicleId", "registrationNumber make model")
      .populate("workshopId", "name code")
      .populate("assignedMechanicId", "employeeCode specialization userId")
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

module.exports = {
  getStatsService,
  listUsersService,
  updateUserStatusService,
  updateUserRoleService,
  updateUserWorkshopService,
  createStaffUserService,
  listAllBookingsService,
  listAllJobsService,
};