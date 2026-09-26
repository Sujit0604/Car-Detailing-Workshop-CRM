const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid ObjectId",
});

const listAuditLogsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    actorId: objectIdSchema.optional(),
    action: z.string().trim().min(1).max(100).optional(),
    entityType: z.string().trim().min(1).max(100).optional(),
    entityId: objectIdSchema.optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    sortBy: z.enum(["createdAt", "action", "entityType"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

const auditLogIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

module.exports = {
  listAuditLogsQuerySchema,
  auditLogIdParamSchema,
};
