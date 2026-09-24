const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

const USER_ROLES = ["CUSTOMER", "ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"];
const STAFF_ROLES = ["WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"];
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

const createStaffUserSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(30, "Name must be at most 30 characters"),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Please provide a valid email"),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
      .regex(/[0-9]/, "Password must contain at least 1 number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 symbol"),
    gender: z.enum(["male", "female", "other"]).optional().default("other"),
    phone: z
      .string({ required_error: "Phone is required" })
      .trim()
      .regex(/^\+?[0-9]{10,15}$/, "Please provide a valid phone number"),
    role: z.enum(STAFF_ROLES, {
      required_error: "Role is required",
    }),
    workshopId: objectIdSchema.nullable().optional(),
  }),
});

module.exports = {
  listUsersQuerySchema,
  userIdParamSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  updateUserWorkshopSchema,
  createStaffUserSchema,
};