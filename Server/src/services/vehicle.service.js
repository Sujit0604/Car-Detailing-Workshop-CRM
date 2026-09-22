const ApiError = require("../utils/ApiError.js");
const Vehicle = require("../models/Vehicle.js");
const logger = require("../utils/logger.js");
const { uploadToBoth } = require("./storage/storage.service.js");
const cloudinaryStorage = require("./storage/cloudinary.storage.js");

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

  if (user.role !== "ADMIN" && vehicle.ownerId.toString() !== user._id.toString()) {
    throw new ApiError(403, "You don't have permission to access this vehicle");
  }

  return vehicle;
};

const listVehiclesService = async (user, query) => {
  const { page = 1, limit = 10, status, search, sortBy = "createdAt", sortOrder = "desc" } = query;

  const filter = {};

  if (user.role !== "ADMIN") {
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

const MAX_VEHICLE_IMAGES = 10;

const addVehicleImageService = async (vehicleId, file, user) => {
  const vehicle = await getVehicleByIdService(vehicleId, user);

  if ((vehicle.images || []).length >= MAX_VEHICLE_IMAGES) {
    throw new ApiError(400, `A vehicle can have at most ${MAX_VEHICLE_IMAGES} photos`);
  }

  const stored = await uploadToBoth({ file, userId: user._id });

  vehicle.images.push({
    url: stored.cloudinary.url,
    publicId: stored.cloudinary.publicId,
  });

  await vehicle.save();

  logger.info(`Vehicle image added: ${vehicle._id}`);

  return vehicle;
};

const removeVehicleImageService = async (vehicleId, publicId, user) => {
  if (!publicId) {
    throw new ApiError(422, "publicId query param is required");
  }

  const vehicle = await getVehicleByIdService(vehicleId, user);

  const image = (vehicle.images || []).find((img) => img.publicId === publicId);

  if (!image) {
    throw new ApiError(404, "Image not found on this vehicle");
  }

  vehicle.images = vehicle.images.filter((img) => img.publicId !== publicId);

  await vehicle.save();

  if (image.publicId) {
    try {
      await cloudinaryStorage.deleteFile(image.publicId, "image");
    } catch (err) {
      logger.warn(`Cloudinary delete failed for ${image.publicId}: ${err.message}`);
    }
  }

  logger.info(`Vehicle image removed: ${vehicle._id}`);

  return vehicle;
};

module.exports = {
  createVehicleService,
  getVehicleByIdService,
  listVehiclesService,
  updateVehicleService,
  deleteVehicleService,
  addVehicleImageService,
  removeVehicleImageService,
};