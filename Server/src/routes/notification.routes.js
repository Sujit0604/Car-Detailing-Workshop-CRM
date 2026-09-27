const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  createNotification,
  listMyNotifications,
  listAdminNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  broadcastNotification,
} = require("../controllers/notification.controller.js");
const {
  createNotificationSchema,
  broadcastNotificationSchema,
  listMyNotificationsQuerySchema,
  listAdminNotificationsQuerySchema,
  notificationIdParamSchema,
} = require("../validators/notification.validator.js");

const notificationRouter = express.Router();

notificationRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Notification Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

notificationRouter.post(
  "/",
  authorize("ADMIN"),
  validate(createNotificationSchema),
  logRoute("Create"),
  createNotification,
);

notificationRouter.get(
  "/admin",
  authorize("ADMIN"),
  validate(listAdminNotificationsQuerySchema),
  logRoute("ListAdmin"),
  listAdminNotifications,
);

notificationRouter.post(
  "/broadcast",
  authorize("ADMIN"),
  validate(broadcastNotificationSchema),
  logRoute("Broadcast"),
  broadcastNotification,
);

notificationRouter.get(
  "/mine",
  validate(listMyNotificationsQuerySchema),
  logRoute("ListMine"),
  listMyNotifications,
);

notificationRouter.get(
  "/unread-count",
  logRoute("UnreadCount"),
  getUnreadCount,
);

notificationRouter.patch(
  "/read-all",
  logRoute("MarkAllRead"),
  markAllNotificationsRead,
);

notificationRouter.patch(
  "/:id/read",
  validate(notificationIdParamSchema),
  logRoute("MarkRead"),
  markNotificationRead,
);

module.exports = notificationRouter;
