const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  getStatsService,
  listUsersService,
  updateUserStatusService,
  updateUserRoleService,
  listAllBookingsService,
  listAllJobsService,
} = require("../services/admin.service.js");

const getStats = asyncHandler(async (req, res) => {
  const stats = await getStatsService();

  return sendResponse(res, 200, "Stats fetched successfully", stats);
});

const listUsers = asyncHandler(async (req, res) => {
  const result = await listUsersService(req.query);

  return sendResponse(res, 200, "Users fetched successfully", result);
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const result = await updateUserStatusService(req.params.id, req.body.status, req.user._id);

  return sendResponse(res, 200, "User status updated successfully", result);
});

const updateUserRole = asyncHandler(async (req, res) => {
  const result = await updateUserRoleService(req.params.id, req.body.role, req.user._id);

  return sendResponse(res, 200, "User role updated successfully", result);
});

const listAllBookings = asyncHandler(async (req, res) => {
  const result = await listAllBookingsService(req.query);

  return sendResponse(res, 200, "Bookings fetched successfully", result);
});

const listAllJobs = asyncHandler(async (req, res) => {
  const result = await listAllJobsService(req.query);

  return sendResponse(res, 200, "Jobs fetched successfully", result);
});

module.exports = {
  getStats,
  listUsers,
  updateUserStatus,
  updateUserRole,
  listAllBookings,
  listAllJobs,
};