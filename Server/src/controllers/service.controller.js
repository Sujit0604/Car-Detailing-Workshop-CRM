const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  createServiceService,
  getServiceByIdService,
  listServicesService,
  updateServiceService,
  deleteServiceService,
} = require("../services/service.service.js");

const createService = asyncHandler(async (req, res) => {
  const service = await createServiceService(req.body);

  return sendResponse(res, 201, "Service created successfully", service);
});

const getServiceById = asyncHandler(async (req, res) => {
  const service = await getServiceByIdService(req.params.id);

  return sendResponse(res, 200, "Service fetched successfully", service);
});

const listServices = asyncHandler(async (req, res) => {
  const result = await listServicesService(req.query);

  return sendResponse(res, 200, "Services fetched successfully", result);
});

const updateService = asyncHandler(async (req, res) => {
  const service = await updateServiceService(req.params.id, req.body);

  return sendResponse(res, 200, "Service updated successfully", service);
});

const deleteService = asyncHandler(async (req, res) => {
  const result = await deleteServiceService(req.params.id);

  return sendResponse(res, 200, "Service deleted successfully", result);
});

module.exports = {
  createService,
  getServiceById,
  listServices,
  updateService,
  deleteService,
};