const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  createJobFromBooking,
  getJobById,
  listJobs,
  listWorkshopJobs,
  updateJobStatus,
  checkInJob,
  assignMechanic,
} = require("../controllers/job.controller.js");
const {
  createJobSchema,
  jobIdParamSchema,
  workshopIdParamSchema,
  updateJobStatusSchema,
  assignMechanicSchema,
  checkInJobSchema,
  listJobsQuerySchema,
} = require("../validators/job.validator.js");

const jobRouter = express.Router();

jobRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Job Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

jobRouter.post(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR"),
  validate(createJobSchema),
  logRoute("CreateFromBooking"),
  createJobFromBooking
);

jobRouter.get(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC", "CUSTOMER"),
  validate(listJobsQuerySchema),
  logRoute("List"),
  listJobs
);

jobRouter.get(
  "/workshop/:workshopId",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(workshopIdParamSchema),
  validate(listJobsQuerySchema),
  logRoute("ListWorkshop"),
  listWorkshopJobs
);

jobRouter.get(
  "/:id",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC", "CUSTOMER"),
  validate(jobIdParamSchema),
  logRoute("GetById"),
  getJobById
);

jobRouter.patch(
  "/:id/status",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(updateJobStatusSchema),
  logRoute("UpdateStatus"),
  updateJobStatus
);

jobRouter.post(
  "/:id/check-in",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR"),
  validate(checkInJobSchema),
  logRoute("CheckIn"),
  checkInJob
);

jobRouter.patch(
  "/:id/assign-mechanic",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR"),
  validate(assignMechanicSchema),
  logRoute("AssignMechanic"),
  assignMechanic
);

module.exports = jobRouter;