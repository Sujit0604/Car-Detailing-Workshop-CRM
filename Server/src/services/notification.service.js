const Notification = require("../models/Notification.js");
const User = require("../models/User.js");
const ApiError = require("../utils/ApiError.js");

const NOTIFICATION_TYPES = [
  "BOOKING_CONFIRMED",
  "BOOKING_CANCELLED",
  "JOB_STARTED",
  "JOB_COMPLETED",
  "ESTIMATE_READY",
  "ESTIMATE_APPROVED",
  "VEHICLE_READY",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "INVOICE_ISSUED",
  "INVOICE_PAID",
  "REVIEW_RESPONSE",
  "REVIEW_UPDATED",
  "GENERAL",
];

const assertAdmin = (actor) => {
  if (!actor || actor.role !== "ADMIN") {
    throw new ApiError(403, "Administrator access is required");
  }
};

const buildNotification = (userId, payload) => ({
  userId,
  type: payload.type || "GENERAL",
  channel: "IN_APP",
  title: payload.title.trim(),
  message: payload.message?.trim(),
  reference: payload.reference || { type: undefined, id: null },
  dedupeKey: payload.dedupeKey?.trim() || undefined,
  status: "SENT",
  sentAt: new Date(),
  readAt: null,
});

const createNotificationService = async (payload, actor) => {
  assertAdmin(actor);

  const user = await User.findById(payload.userId).select("_id").lean();

  if (!user) {
    throw new ApiError(404, "Notification recipient not found");
  }

  const notification = buildNotification(user._id, payload);

  if (!notification.dedupeKey) {
    return Notification.create(notification);
  }

  try {
    return await Notification.findOneAndUpdate(
      { userId: user._id, dedupeKey: notification.dedupeKey },
      { $setOnInsert: notification },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  } catch (error) {
    if (error?.code === 11000) {
      return Notification.findOne({
        userId: user._id,
        dedupeKey: notification.dedupeKey,
      });
    }

    throw error;
  }
};

const buildNotificationListFilter = (query = {}) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.unreadOnly) {
    filter.status = "SENT";
    filter.readAt = null;
  }

  return filter;
};

const paginateNotifications = async (filter, query = {}) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const listMyNotificationsService = async (user, query = {}) => {
  const filter = {
    userId: user._id,
    ...buildNotificationListFilter(query),
  };

  return paginateNotifications(filter, query);
};

const listAdminNotificationsService = async (query = {}) => {
  const filter = buildNotificationListFilter(query);

  if (query.userId) filter.userId = query.userId;
  if (query.type) filter.type = query.type;

  return paginateNotifications(filter, query);
};

const getUnreadCountService = async (user) => {
  const count = await Notification.countDocuments({
    userId: user._id,
    status: "SENT",
    readAt: null,
  });

  return { count };
};

const markNotificationReadService = async (notificationId, user) => {
  let notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      userId: user._id,
      status: { $ne: "READ" },
    },
    {
      $set: {
        status: "READ",
        readAt: new Date(),
      },
    },
    { new: true },
  );

  if (!notification) {
    notification = await Notification.findOne({
      _id: notificationId,
      userId: user._id,
    }).lean();
  }

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
};

const markAllNotificationsReadService = async (user) => {
  const result = await Notification.updateMany(
    {
      userId: user._id,
      status: { $ne: "READ" },
    },
    {
      $set: {
        status: "READ",
        readAt: new Date(),
      },
    },
  );

  return { updatedCount: result.modifiedCount };
};

const broadcastNotificationService = async (payload, actor) => {
  assertAdmin(actor);

  const recipientFilter = { status: "ACTIVE" };

  if (payload.userIds?.length) {
    recipientFilter._id = { $in: payload.userIds };
  }

  const users = await User.find(recipientFilter).select("_id").lean();

  if (users.length === 0) {
    return {
      notifications: [],
      requestedCount: payload.userIds?.length || 0,
      createdCount: 0,
    };
  }

  const dedupeKey = payload.dedupeKey?.trim();
  let notifications;
  let createdCount;

  if (dedupeKey) {
    const operations = users.map((user) => ({
      updateOne: {
        filter: { userId: user._id, dedupeKey },
        update: {
          $setOnInsert: buildNotification(user._id, payload),
        },
        upsert: true,
      },
    }));
    const result = await Notification.bulkWrite(operations, { ordered: false });
    notifications = await Notification.find({
      userId: { $in: users.map((user) => user._id) },
      dedupeKey,
    })
      .sort({ createdAt: -1 })
      .lean();
    createdCount = result.upsertedCount;
  } else {
    const records = users.map((user) => buildNotification(user._id, payload));
    notifications = await Notification.insertMany(records, { ordered: false });
    createdCount = notifications.length;
  }

  return {
    notifications,
    requestedCount: payload.userIds?.length || users.length,
    createdCount,
  };
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotificationService,
  listNotificationsService: listMyNotificationsService,
  listMyNotificationsService,
  listAdminNotificationsService,
  getUnreadCountService,
  markNotificationReadService,
  markAllNotificationsReadService,
  broadcastNotificationService,
};
