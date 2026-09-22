const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  createWorkshop,
  getWorkshopById,
  listWorkshops,
  updateWorkshop,
  deleteWorkshop,
  getWorkshopOverview,
} = require("../controllers/workshop.controller.js");
const {
  createWorkshopSchema,
  updateWorkshopSchema,
  workshopIdParamSchema,
  listWorkshopsQuerySchema,
} = require("../validators/workshop.validator.js");

const workshopRouter = express.Router();

workshopRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Workshop Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

workshopRouter.get(
  "/",
  validate(listWorkshopsQuerySchema),
  logRoute("List"),
  listWorkshops
);

workshopRouter.post(
  "/",
  authorize("ADMIN"),
  validate(createWorkshopSchema),
  logRoute("Create"),
  createWorkshop
);

workshopRouter.get(
  "/:id",
  validate(workshopIdParamSchema),
  logRoute("GetById"),
  getWorkshopById
);

workshopRouter.get(
  "/:id/overview",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR"),
  validate(workshopIdParamSchema),
  logRoute("GetOverview"),
  getWorkshopOverview
);

workshopRouter.patch(
  "/:id",
  authorize("ADMIN"),
  validate(updateWorkshopSchema),
  logRoute("Update"),
  updateWorkshop
);

workshopRouter.delete(
  "/:id",
  authorize("ADMIN"),
  validate(workshopIdParamSchema),
  logRoute("Delete"),
  deleteWorkshop
);

module.exports = workshopRouter;