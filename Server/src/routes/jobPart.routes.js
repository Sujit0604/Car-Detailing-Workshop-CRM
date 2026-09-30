const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  listJobParts,
  createJobPart,
  updateJobPartStatus,
  cancelJobPart,
  deleteJobPart,
} = require("../controllers/jobPart.controller.js");
const {
  createJobPartSchema,
  updateJobPartStatusSchema,
  cancelJobPartSchema,
  jobPartIdParamSchema,
  listJobPartsQuerySchema,
} = require("../validators/jobPart.validator.js");

const jobPartRouter = express.Router({ mergeParams: true });

jobPartRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Job Part Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

jobPartRouter.get(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(listJobPartsQuerySchema),
  logRoute("List"),
  listJobParts,
);

jobPartRouter.post(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(createJobPartSchema),
  logRoute("Create"),
  createJobPart,
);

jobPartRouter.patch(
  "/:partId/status",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(updateJobPartStatusSchema),
  logRoute("UpdateStatus"),
  updateJobPartStatus,
);

jobPartRouter.post(
  "/:partId/cancel",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(cancelJobPartSchema),
  logRoute("Cancel"),
  cancelJobPart,
);

jobPartRouter.delete(
  "/:partId",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(jobPartIdParamSchema),
  logRoute("Delete"),
  deleteJobPart,
);

module.exports = jobPartRouter;
