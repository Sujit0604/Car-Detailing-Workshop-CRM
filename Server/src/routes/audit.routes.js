const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  listAuditLogs,
  getAuditLog,
} = require("../controllers/audit.controller.js");
const {
  listAuditLogsQuerySchema,
  auditLogIdParamSchema,
} = require("../validators/audit.validator.js");

const auditRouter = express.Router();

auditRouter.use(authMiddleware, authorize("ADMIN"));

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Audit Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

auditRouter.get(
  "/",
  validate(listAuditLogsQuerySchema),
  logRoute("List"),
  listAuditLogs,
);

auditRouter.get(
  "/:id",
  validate(auditLogIdParamSchema),
  logRoute("GetById"),
  getAuditLog,
);

module.exports = auditRouter;
