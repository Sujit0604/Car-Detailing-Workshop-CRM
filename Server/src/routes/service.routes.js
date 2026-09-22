const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  createService,
  getServiceById,
  listServices,
  updateService,
  deleteService,
} = require("../controllers/service.controller.js");
const {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
  listServicesQuerySchema,
} = require("../validators/service.validator.js");

const serviceRouter = express.Router();

serviceRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Service Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

serviceRouter.get(
  "/",
  validate(listServicesQuerySchema),
  logRoute("List"),
  listServices
);

serviceRouter.post(
  "/",
  authorize("ADMIN"),
  validate(createServiceSchema),
  logRoute("Create"),
  createService
);

serviceRouter.get(
  "/:id",
  validate(serviceIdParamSchema),
  logRoute("GetById"),
  getServiceById
);

serviceRouter.patch(
  "/:id",
  authorize("ADMIN"),
  validate(updateServiceSchema),
  logRoute("Update"),
  updateService
);

serviceRouter.delete(
  "/:id",
  authorize("ADMIN"),
  validate(serviceIdParamSchema),
  logRoute("Delete"),
  deleteService
);

module.exports = serviceRouter;