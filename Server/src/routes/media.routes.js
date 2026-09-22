const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const upload = require("../middleware/upload.middleware.js");
const logger = require("../utils/logger.js");
const {
  uploadJobMedia,
  listJobMedia,
  deleteMedia,
} = require("../controllers/media.controller.js");
const { MEDIA_CATEGORIES } = require("../services/media.service.js");

const mediaRouter = express.Router();

mediaRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Media Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

mediaRouter.post(
  "/jobs/:jobId",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  upload.single("image"),
  logRoute("UploadJobMedia"),
  uploadJobMedia
);

mediaRouter.get(
  "/jobs/:jobId",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC", "CUSTOMER"),
  logRoute("ListJobMedia"),
  listJobMedia
);

mediaRouter.delete(
  "/:id",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  logRoute("DeleteMedia"),
  deleteMedia
);

module.exports = { mediaRouter, MEDIA_CATEGORIES };
