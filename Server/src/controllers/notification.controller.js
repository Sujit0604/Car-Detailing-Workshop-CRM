const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  createNotificationService,
  listMyNotificationsService,
  listAdminNotificationsService,
  getUnreadCountService,
  markNotificationReadService,
  markAllNotificationsReadService,
  broadcastNotificationService,
} = require("../services/notification.service.js");

const createNotification = asyncHandler(async (req, res) => {
  const notification = await createNotificationService(req.body, req.user);
  return sendResponse(res, 201, "Notification created successfully", notification);
});

const listMyNotifications = asyncHandler(async (req, res) => {
  const result = await listMyNotificationsService(req.user, req.query);
  return sendResponse(res, 200, "Notifications fetched successfully", result);
});

const listAdminNotifications = asyncHandler(async (req, res) => {
  const result = await listAdminNotificationsService(req.query);
  return sendResponse(res, 200, "Notifications fetched successfully", result);
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await getUnreadCountService(req.user);
  return sendResponse(res, 200, "Unread notification count fetched successfully", result);
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await markNotificationReadService(req.params.id, req.user);
  return sendResponse(res, 200, "Notification marked as read successfully", notification);
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await markAllNotificationsReadService(req.user);
  return sendResponse(res, 200, "All notifications marked as read successfully", result);
});

const broadcastNotification = asyncHandler(async (req, res) => {
  const result = await broadcastNotificationService(req.body, req.user);
  return sendResponse(res, 201, "Notification broadcast completed successfully", result);
});

module.exports = {
  createNotification,
  listMyNotifications,
  listAdminNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  broadcastNotification,
};
