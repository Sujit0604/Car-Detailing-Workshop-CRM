const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const upload = require("../middleware/upload.middleware.js");
const logger = require("../utils/logger.js");
const {
  createVehicle,
  getVehicleById,
  listVehicles,
  updateVehicle,
  deleteVehicle,
  addVehicleImage,
  removeVehicleImage,
} = require("../controllers/vehicle.controller.js");
const {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
  listVehiclesQuerySchema,
} = require("../validators/vehicle.validator.js");

const vehicleRouter = express.Router();

vehicleRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Vehicle Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

vehicleRouter.get(
  "/",
  authorize("CUSTOMER", "ADMIN"),
  validate(listVehiclesQuerySchema),
  logRoute("List"),
  listVehicles
);

vehicleRouter.post(
  "/",
  authorize("CUSTOMER", "ADMIN"),
  validate(createVehicleSchema),
  logRoute("Create"),
  createVehicle
);

vehicleRouter.get(
  "/:id",
  authorize("CUSTOMER", "ADMIN"),
  validate(vehicleIdParamSchema),
  logRoute("GetById"),
  getVehicleById
);

vehicleRouter.patch(
  "/:id",
  authorize("CUSTOMER", "ADMIN"),
  validate(updateVehicleSchema),
  logRoute("Update"),
  updateVehicle
);

vehicleRouter.delete(
  "/:id",
  authorize("CUSTOMER", "ADMIN"),
  validate(vehicleIdParamSchema),
  logRoute("Delete"),
  deleteVehicle
);

vehicleRouter.post(
  "/:id/images",
  authorize("CUSTOMER", "ADMIN"),
  validate(vehicleIdParamSchema),
  upload.single("image"),
  logRoute("AddImage"),
  addVehicleImage
);

vehicleRouter.delete(
  "/:id/images",
  authorize("CUSTOMER", "ADMIN"),
  validate(vehicleIdParamSchema),
  logRoute("RemoveImage"),
  removeVehicleImage
);

module.exports = vehicleRouter;