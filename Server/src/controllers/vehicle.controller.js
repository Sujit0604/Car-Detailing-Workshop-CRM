const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  createVehicleService,
  getVehicleByIdService,
  listVehiclesService,
  updateVehicleService,
  deleteVehicleService,
} = require("../services/vehicle.service.js");

const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await createVehicleService(req.user._id, req.body);

  return sendResponse(res, 201, "Vehicle created successfully", vehicle);
});

const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await getVehicleByIdService(req.params.id, req.user);

  return sendResponse(res, 200, "Vehicle fetched successfully", vehicle);
});

const listVehicles = asyncHandler(async (req, res) => {
  const result = await listVehiclesService(req.user, req.query);

  return sendResponse(res, 200, "Vehicles fetched successfully", result);
});

const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await updateVehicleService(req.params.id, req.body, req.user);

  return sendResponse(res, 200, "Vehicle updated successfully", vehicle);
});

const deleteVehicle = asyncHandler(async (req, res) => {
  const result = await deleteVehicleService(req.params.id, req.user);

  return sendResponse(res, 200, "Vehicle deleted successfully", result);
});

module.exports = {
  createVehicle,
  getVehicleById,
  listVehicles,
  updateVehicle,
  deleteVehicle,
};