const { z } = require("zod");
const mongoose = require("mongoose");
const { NOTIFICATION_TYPES } = require("../services/notification.service.js");

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid ObjectId",
});

const booleanQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const referenceSchema = z.object({
  type: z.string().trim().min(1).max(100).optional(),
  id: objectIdSchema.nullable().optional(),
});

const notificationBodySchema = z.object({
  userId: objectIdSchema.optional(),
  type: z.enum(NOTIFICATION_TYPES).optional().default("GENERAL"),
  title: z.string().trim().min(1, "Title is required").max(150),
  message: z.string().trim().max(2000).optional(),
  reference: referenceSchema.optional(),
  dedupeKey: z.string().trim().min(1).max(200).optional(),
});

const createNotificationSchema = z.object({
  body: notificationBodySchema.extend({
    userId: objectIdSchema,
  }),
});

const broadcastNotificationSchema = z.object({
  body: notificationBodySchema.extend({
    userIds: z.array(objectIdSchema).min(1).max(1000).optional(),
  }),
});

const listMyNotificationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(["SENT", "READ"]).optional(),
    unreadOnly: booleanQuerySchema.optional(),
    sortBy: z.enum(["createdAt", "sentAt", "type"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

const listAdminNotificationsQuerySchema = z.object({
  query: listMyNotificationsQuerySchema.shape.query.extend({
    userId: objectIdSchema.optional(),
    type: z.enum(NOTIFICATION_TYPES).optional(),
  }),
});

const notificationIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

module.exports = {
  createNotificationSchema,
  broadcastNotificationSchema,
  listMyNotificationsQuerySchema,
  listAdminNotificationsQuerySchema,
  notificationIdParamSchema,
};
