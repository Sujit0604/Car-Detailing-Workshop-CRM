const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  createInventoryPart,
  getInventoryPart,
  listInventoryParts,
  updateInventoryPart,
  adjustStock,
  deleteInventoryPart,
} = require("../controllers/inventory.controller.js");
const {
  createInventoryPartSchema,
  updateInventoryPartSchema,
  adjustStockSchema,
  inventoryIdParamSchema,
  listInventoryPartsQuerySchema,
} = require("../validators/inventory.validator.js");

const inventoryRouter = express.Router();

inventoryRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Inventory Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

inventoryRouter.get(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(listInventoryPartsQuerySchema),
  logRoute("List"),
  listInventoryParts
);

inventoryRouter.get(
  "/:id",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(inventoryIdParamSchema),
  logRoute("GetById"),
  getInventoryPart
);

inventoryRouter.post(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER"),
  validate(createInventoryPartSchema),
  logRoute("Create"),
  createInventoryPart
);

inventoryRouter.patch(
  "/:id",
  authorize("ADMIN", "WORKSHOP_MANAGER"),
  validate(updateInventoryPartSchema),
  logRoute("Update"),
  updateInventoryPart
);

inventoryRouter.patch(
  "/:id/stock",
  authorize("ADMIN", "WORKSHOP_MANAGER"),
  validate(adjustStockSchema),
  logRoute("AdjustStock"),
  adjustStock
);

inventoryRouter.delete(
  "/:id",
  authorize("ADMIN", "WORKSHOP_MANAGER"),
  validate(inventoryIdParamSchema),
  logRoute("Delete"),
  deleteInventoryPart
);

module.exports = inventoryRouter;