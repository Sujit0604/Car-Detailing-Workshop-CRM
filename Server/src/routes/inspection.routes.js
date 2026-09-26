const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  createInspection,
  getInspection,
  listInspections,
  updateInspection,
  completeInspection,
} = require("../controllers/inspection.controller.js");
const {
  createInspectionSchema,
  updateInspectionSchema,
  inspectionIdParamSchema,
  listInspectionsQuerySchema,
} = require("../validators/inspection.validator.js");

const inspectionRouter = express.Router();

inspectionRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(
    `[Inspection Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`,
  );
  next();
};

inspectionRouter.post(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(createInspectionSchema),
  logRoute("Create"),
  createInspection,
);

inspectionRouter.get(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC", "CUSTOMER"),
  validate(listInspectionsQuerySchema),
  logRoute("List"),
  listInspections,
);

inspectionRouter.get(
  "/:id",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC", "CUSTOMER"),
  validate(inspectionIdParamSchema),
  logRoute("GetById"),
  getInspection,
);

inspectionRouter.patch(
  "/:id",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(updateInspectionSchema),
  logRoute("Update"),
  updateInspection,
);

inspectionRouter.post(
  "/:id/complete",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(inspectionIdParamSchema),
  logRoute("Complete"),
  completeInspection,
);

module.exports = inspectionRouter;
