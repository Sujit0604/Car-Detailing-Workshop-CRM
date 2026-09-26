const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  listAuditLogsService,
  getAuditLogService,
} = require("../services/audit.service.js");
const ApiError = require("../utils/ApiError.js");

const listAuditLogs = asyncHandler(async (req, res) => {
  const result = await listAuditLogsService(req.query);
  return sendResponse(res, 200, "Audit logs fetched successfully", result);
});

const getAuditLog = asyncHandler(async (req, res) => {
  const auditLog = await getAuditLogService(req.params.id);

  if (!auditLog) {
    throw new ApiError(404, "Audit log not found");
  }

  return sendResponse(res, 200, "Audit log fetched successfully", auditLog);
});

module.exports = {
  listAuditLogs,
  getAuditLog,
};
