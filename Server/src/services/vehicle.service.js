const ApiError = require("../utils/ApiError.js");
const Vehicle = require("../models/Vehicle.js");
const logger = require("../utils/logger.js");

const createVehicleService = async (ownerId, vehicleData) => {
  const { registrationNumber } = vehicleData;

  const existingVehicle = await Vehicle.findOne({ registrationNumber });

  if (existingVehicle) {
    throw new ApiError(409, "Vehicle with this registration number already exists");
  }

  const vehicle = await Vehicle.create({
    ownerId,
    ...vehicleData,
  });

  logger.info(`Vehicle created: ${vehicle._id}`);

  return vehicle;
};

const getVehicleByIdService = async (vehicleId, user) => {
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  if (user.role === "CUSTOMER" && vehicle.ownerId.toString() !== user._id.toString()) {
    throw new ApiError(403, "You don't have permission to access this vehicle");
  }

  return vehicle;
};

const listVehiclesService = async (user, query) => {
  const { page = 1, limit = 10, status, search, sortBy = "createdAt", sortOrder = "desc" } = query;

  const filter = {};

  if (user.role === "CUSTOMER") {
    filter.ownerId = user._id;
  }

  if (status) {
    filter.status = status;
  }

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ registrationNumber: regex }, { make: regex }, { model: regex }];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Vehicle.countDocuments(filter),
  ]);

  return {
    vehicles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateVehicleService = async (vehicleId, updateData, user) => {
  const vehicle = await getVehicleByIdService(vehicleId, user);

  if (updateData.registrationNumber && updateData.registrationNumber !== vehicle.registrationNumber) {
    const existingVehicle = await Vehicle.findOne({ registrationNumber: updateData.registrationNumber });

    if (existingVehicle) {
      throw new ApiError(409, "Vehicle with this registration number already exists");
    }
  }

  Object.assign(vehicle, updateData);

  await vehicle.save();

  logger.info(`Vehicle updated: ${vehicle._id}`);

  return vehicle;
};

const deleteVehicleService = async (vehicleId, user) => {
  const vehicle = await getVehicleByIdService(vehicleId, user);

  vehicle.status = "INACTIVE";

  await vehicle.save();

  logger.info(`Vehicle deleted (soft): ${vehicle._id}`);

  return { _id: vehicle._id, status: vehicle.status };
};

module.exports = {
  createVehicleService,
  getVehicleByIdService,
  listVehiclesService,
  updateVehicleService,
  deleteVehicleService,
};