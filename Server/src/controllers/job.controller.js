const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  createJobFromBookingService,
  getJobByIdService,
  listJobsService,
  updateJobStatusService,
  checkInJobService,
  assignMechanicService,
} = require("../services/job.service.js");

const createJobFromBooking = asyncHandler(async (req, res) => {
  const { bookingId, serviceAdvisorId } = req.body;

  const job = await createJobFromBookingService(bookingId, serviceAdvisorId, req.user);

  return sendResponse(res, 201, "Job created successfully", job);
});

const getJobById = asyncHandler(async (req, res) => {
  const job = await getJobByIdService(req.params.id, req.user);

  return sendResponse(res, 200, "Job fetched successfully", job);
});

const listJobs = asyncHandler(async (req, res) => {
  const result = await listJobsService(req.user, req.query);

  return sendResponse(res, 200, "Jobs fetched successfully", result);
});

const listWorkshopJobs = asyncHandler(async (req, res) => {
  const { workshopId } = req.params;

  const result = await listJobsService(req.user, req.query, workshopId);

  return sendResponse(res, 200, "Workshop jobs fetched successfully", result);
});

const updateJobStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const job = await updateJobStatusService(id, status, notes, req.user);

  return sendResponse(res, 200, "Job status updated successfully", job);
});

const checkInJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await checkInJobService(id, req.body, req.user);

  return sendResponse(res, 200, "Job checked in successfully", job);
});

const assignMechanic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { mechanicId } = req.body;

  const job = await assignMechanicService(id, mechanicId);

  return sendResponse(res, 200, "Mechanic assigned successfully", job);
});

module.exports = {
  createJobFromBooking,
  getJobById,
  listJobs,
  listWorkshopJobs,
  updateJobStatus,
  checkInJob,
  assignMechanic,
};