const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  listMechanics,
  getMyMechanic,
} = require("../controllers/mechanic.controller.js");
const {
  listMechanicsQuerySchema,
} = require("../validators/mechanic.validator.js");

const mechanicRouter = express.Router();

mechanicRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Mechanic Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

mechanicRouter.get(
  "/me",
  authorize("MECHANIC"),
  logRoute("GetMyProfile"),
  getMyMechanic
);

mechanicRouter.get(
  "/",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(listMechanicsQuerySchema),
  logRoute("List"),
  listMechanics
);

module.exports = mechanicRouter;