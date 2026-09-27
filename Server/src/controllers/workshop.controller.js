const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  createWorkshopService,
  getWorkshopByIdService,
  listWorkshopsService,
  updateWorkshopService,
  deleteWorkshopService,
  getWorkshopOverviewService,
  getWorkshopStaffService,
} = require("../services/workshop.service.js");

const createWorkshop = asyncHandler(async (req, res) => {
  const workshop = await createWorkshopService(req.body);

  return sendResponse(res, 201, "Workshop created successfully", workshop);
});

const getWorkshopById = asyncHandler(async (req, res) => {
  const workshop = await getWorkshopByIdService(req.params.id, req.user);

  return sendResponse(res, 200, "Workshop fetched successfully", workshop);
});

const listWorkshops = asyncHandler(async (req, res) => {
  const result = await listWorkshopsService(req.user, req.query);

  return sendResponse(res, 200, "Workshops fetched successfully", result);
});

const updateWorkshop = asyncHandler(async (req, res) => {
  const workshop = await updateWorkshopService(req.params.id, req.body);

  return sendResponse(res, 200, "Workshop updated successfully", workshop);
});

const deleteWorkshop = asyncHandler(async (req, res) => {
  const result = await deleteWorkshopService(req.params.id);

  return sendResponse(res, 200, "Workshop deleted successfully", result);
});

const getWorkshopOverview = asyncHandler(async (req, res) => {
  const result = await getWorkshopOverviewService(req.params.id, req.user);

  return sendResponse(res, 200, "Workshop overview fetched successfully", result);
});

const getWorkshopStaff = asyncHandler(async (req, res) => {
  const result = await getWorkshopStaffService(req.params.id, req.user);

  return sendResponse(res, 200, "Workshop staff fetched successfully", result);
});

module.exports = {
  createWorkshop,
  getWorkshopById,
  listWorkshops,
  updateWorkshop,
  deleteWorkshop,
  getWorkshopOverview,
  getWorkshopStaff,
};