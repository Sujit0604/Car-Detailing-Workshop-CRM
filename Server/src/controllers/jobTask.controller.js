const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  listJobTasksService,
  createJobTaskService,
  updateJobTaskService,
  updateJobTaskStatusService,
  deleteJobTaskService,
} = require("../services/jobTask.service.js");

const listJobTasks = asyncHandler(async (req, res) => {
  const result = await listJobTasksService(req.params.jobId, req.user, req.query);

  return sendResponse(res, 200, "Job tasks fetched successfully", result);
});

const createJobTask = asyncHandler(async (req, res) => {
  const task = await createJobTaskService(req.params.jobId, req.body, req.user);

  return sendResponse(res, 201, "Job task created successfully", task);
});

const updateJobTask = asyncHandler(async (req, res) => {
  const task = await updateJobTaskService(
    req.params.jobId,
    req.params.taskId,
    req.body,
    req.user,
  );

  return sendResponse(res, 200, "Job task updated successfully", task);
});

const updateJobTaskStatus = asyncHandler(async (req, res) => {
  const task = await updateJobTaskStatusService(
    req.params.jobId,
    req.params.taskId,
    req.body,
    req.user,
  );

  return sendResponse(res, 200, "Job task status updated successfully", task);
});

const deleteJobTask = asyncHandler(async (req, res) => {
  const task = await deleteJobTaskService(req.params.jobId, req.params.taskId, req.user);

  return sendResponse(res, 200, "Job task deleted successfully", task);
});

module.exports = {
  listJobTasks,
  createJobTask,
  updateJobTask,
  updateJobTaskStatus,
  deleteJobTask,
};
