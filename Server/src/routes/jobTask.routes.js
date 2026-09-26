const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  listJobTasks,
  createJobTask,
  updateJobTask,
  updateJobTaskStatus,
  deleteJobTask,
} = require("../controllers/jobTask.controller.js");
const {
  createJobTaskSchema,
  updateJobTaskSchema,
  updateJobTaskStatusSchema,
  jobTaskIdParamSchema,
  listJobTasksQuerySchema,
} = require("../validators/jobTask.validator.js");

const jobTaskRouter = express.Router({ mergeParams: true });

jobTaskRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Job Task Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

jobTaskRouter.get(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC", "CUSTOMER"),
  validate(listJobTasksQuerySchema),
  logRoute("List"),
  listJobTasks,
);

jobTaskRouter.post(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR"),
  validate(createJobTaskSchema),
  logRoute("Create"),
  createJobTask,
);

jobTaskRouter.patch(
  "/:taskId/status",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(updateJobTaskStatusSchema),
  logRoute("UpdateStatus"),
  updateJobTaskStatus,
);

jobTaskRouter.patch(
  "/:taskId",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(updateJobTaskSchema),
  logRoute("Update"),
  updateJobTask,
);

jobTaskRouter.delete(
  "/:taskId",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR"),
  validate(jobTaskIdParamSchema),
  logRoute("Delete"),
  deleteJobTask,
);

module.exports = jobTaskRouter;
