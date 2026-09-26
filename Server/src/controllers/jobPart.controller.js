const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  listJobPartsService,
  createJobPartService,
  updateJobPartStatusService,
  cancelJobPartService,
  deleteJobPartService,
} = require("../services/jobPart.service.js");

const listJobParts = asyncHandler(async (req, res) => {
  const result = await listJobPartsService(req.params.jobId, req.user, req.query);

  return sendResponse(res, 200, "Job parts fetched successfully", result);
});

const createJobPart = asyncHandler(async (req, res) => {
  const part = await createJobPartService(req.params.jobId, req.body, req.user);

  return sendResponse(res, 201, "Job part created successfully", part);
});

const updateJobPartStatus = asyncHandler(async (req, res) => {
  const part = await updateJobPartStatusService(
    req.params.jobId,
    req.params.partId,
    req.body,
    req.user,
  );

  return sendResponse(res, 200, "Job part status updated successfully", part);
});

const cancelJobPart = asyncHandler(async (req, res) => {
  const part = await cancelJobPartService(
    req.params.jobId,
    req.params.partId,
    req.body?.reason,
    req.user,
  );

  return sendResponse(res, 200, "Job part cancelled successfully", part);
});

const deleteJobPart = asyncHandler(async (req, res) => {
  const part = await deleteJobPartService(req.params.jobId, req.params.partId, req.user);

  return sendResponse(res, 200, "Job part deleted successfully", part);
});

module.exports = {
  listJobParts,
  createJobPart,
  updateJobPartStatus,
  cancelJobPart,
  deleteJobPart,
};
