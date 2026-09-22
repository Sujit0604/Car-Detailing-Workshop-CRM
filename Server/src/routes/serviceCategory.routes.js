const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  createServiceCategory,
  getServiceCategoryById,
  listServiceCategories,
  updateServiceCategory,
  deleteServiceCategory,
} = require("../controllers/serviceCategory.controller.js");
const {
  createServiceCategorySchema,
  updateServiceCategorySchema,
  serviceCategoryIdParamSchema,
  listServiceCategoriesQuerySchema,
} = require("../validators/serviceCategory.validator.js");

const serviceCategoryRouter = express.Router();

serviceCategoryRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[ServiceCategory Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

serviceCategoryRouter.get(
  "/",
  validate(listServiceCategoriesQuerySchema),
  logRoute("List"),
  listServiceCategories
);

serviceCategoryRouter.post(
  "/",
  authorize("ADMIN"),
  validate(createServiceCategorySchema),
  logRoute("Create"),
  createServiceCategory
);

serviceCategoryRouter.get(
  "/:id",
  validate(serviceCategoryIdParamSchema),
  logRoute("GetById"),
  getServiceCategoryById
);

serviceCategoryRouter.patch(
  "/:id",
  authorize("ADMIN"),
  validate(updateServiceCategorySchema),
  logRoute("Update"),
  updateServiceCategory
);

serviceCategoryRouter.delete(
  "/:id",
  authorize("ADMIN"),
  validate(serviceCategoryIdParamSchema),
  logRoute("Delete"),
  deleteServiceCategory
);

module.exports = serviceCategoryRouter;