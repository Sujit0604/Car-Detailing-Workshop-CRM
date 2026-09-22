const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  uploadJobMediaService,
  listJobMediaService,
  deleteMediaService,
  removeTempFile,
} = require("../services/media.service.js");

const uploadJobMedia = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const category = req.body.category || "BEFORE";

  try {
    const media = await uploadJobMediaService(jobId, req.file, category, req.user);

    return sendResponse(res, 201, "Photo uploaded successfully", media);
  } finally {
    await removeTempFile(req.file);
  }
});

const listJobMedia = asyncHandler(async (req, res) => {
  const media = await listJobMediaService(req.params.jobId, req.user);

  return sendResponse(res, 200, "Job photos fetched successfully", media);
});

const deleteMedia = asyncHandler(async (req, res) => {
  const result = await deleteMediaService(req.params.id, req.user);

  return sendResponse(res, 200, "Photo deleted successfully", result);
});

module.exports = {
  uploadJobMedia,
  listJobMedia,
  deleteMedia,
};
