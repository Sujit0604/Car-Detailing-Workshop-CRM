const ApiError = require("../utils/ApiError.js");
const Mechanic = require("../models/Mechanic.js");

const listMechanicsService = async (query) => {
  const {
    workshopId,
    page = 1,
    limit = 100,
    status,
    search,
  } = query;

  const filter = {};

  if (workshopId) filter.workshopId = workshopId;
  if (status) filter.status = status;

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ employeeCode: regex }, { specialization: regex }];
  }

  const [mechanics, total] = await Promise.all([
    Mechanic.find(filter)
      .populate("userId", "name email phone role")
      .populate("workshopId", "name code")
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Mechanic.countDocuments(filter),
  ]);

  return {
    mechanics,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getMyMechanicService = async (userId) => {
  const mechanic = await Mechanic.findOne({ userId })
    .populate("userId", "name email phone role")
    .populate("workshopId", "name code phone address");

  if (!mechanic) {
    throw new ApiError(404, "No mechanic profile found for your account");
  }

  return mechanic;
};

module.exports = {
  listMechanicsService,
  getMyMechanicService,
};