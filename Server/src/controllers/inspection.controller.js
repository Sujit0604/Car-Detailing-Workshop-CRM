const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  createInspectionService,
  getInspectionService,
  listInspectionsService,
  updateInspectionService,
  completeInspectionService,
} = require("../services/inspection.service.js");

const createInspection = asyncHandler(async (req, res) => {
  const inspection = await createInspectionService(req.body, req.user);

  return sendResponse(res, 201, "Inspection created successfully", inspection);
});

const getInspection = asyncHandler(async (req, res) => {
  const inspection = await getInspectionService(req.params.id, req.user);

  return sendResponse(res, 200, "Inspection fetched successfully", inspection);
});

const listInspections = asyncHandler(async (req, res) => {
  const result = await listInspectionsService(req.user, req.query);

  return sendResponse(res, 200, "Inspections fetched successfully", result);
});

const updateInspection = asyncHandler(async (req, res) => {
  const inspection = await updateInspectionService(req.params.id, req.body, req.user);

  return sendResponse(res, 200, "Inspection updated successfully", inspection);
});

const completeInspection = asyncHandler(async (req, res) => {
  const inspection = await completeInspectionService(req.params.id, req.user);

  return sendResponse(res, 200, "Inspection completed successfully", inspection);
});

module.exports = {
  createInspection,
  getInspection,
  listInspections,
  updateInspection,
  completeInspection,
};
