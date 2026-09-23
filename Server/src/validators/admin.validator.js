const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

const USER_ROLES = ["CUSTOMER", "ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"];
const USER_STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED", "PENDING_VERIFICATION"];

const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    role: z.enum(USER_ROLES).optional(),
    status: z.enum(USER_STATUSES).optional(),
    workshopId: objectIdSchema.optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(["createdAt", "name", "email"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

const userIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const updateUserStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(USER_STATUSES),
  }),
});

const updateUserRoleSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    role: z.enum(USER_ROLES),
  }),
});

const updateUserWorkshopSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    workshopId: objectIdSchema.nullable().optional(),
  }),
});

module.exports = {
  listUsersQuerySchema,
  userIdParamSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  updateUserWorkshopSchema,
};