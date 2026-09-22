const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  createEstimateService,
  getLatestEstimateService,
  respondToEstimateService,
} = require("../services/estimate.service.js");

const createEstimate = asyncHandler(async (req, res) => {
  const estimate = await createEstimateService(req.params.id, req.body, req.user);

  return sendResponse(res, 201, "Estimate created and sent for customer approval", estimate);
});

const getLatestEstimate = asyncHandler(async (req, res) => {
  const estimate = await getLatestEstimateService(req.params.id, req.user);

  return sendResponse(res, 200, "Estimate fetched successfully", estimate);
});

const respondToEstimate = asyncHandler(async (req, res) => {
  const estimate = await respondToEstimateService(req.params.id, req.body, req.user);

  return sendResponse(res, 200, "Estimate response recorded", estimate);
});

module.exports = {
  createEstimate,
  getLatestEstimate,
  respondToEstimate,
};