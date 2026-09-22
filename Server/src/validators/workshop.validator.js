const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

const WEEK_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const WORKSHOP_STATUSES = ["ACTIVE", "INACTIVE", "TEMPORARILY_CLOSED"];

const openingHoursSchema = z
  .array(
    z.object({
      day: z.enum(WEEK_DAYS),
      open: z.string().trim().optional(),
      close: z.string().trim().optional(),
      isClosed: z.boolean().default(false),
    }),
  )
  .optional();

const createWorkshopSchema = z.object({
  body: z
    .object({
      name: z.string({ required_error: "Name is required" }).trim().min(1, "Name is required"),
      code: z
        .string({ required_error: "Workshop code is required" })
        .trim()
        .toUpperCase()
        .min(2, "Workshop code must be at least 2 characters")
        .max(20, "Workshop code must be at most 20 characters"),
      description: z.string().trim().optional(),
      phone: z.string({ required_error: "Phone is required" }).trim().min(7, "Phone must be valid"),
      email: z.string().trim().toLowerCase().email("Email must be valid").optional(),
      address: z
        .object({
          line1: z.string().trim().optional(),
          line2: z.string().trim().optional(),
          city: z.string().trim().optional(),
          state: z.string().trim().optional(),
          country: z.string().trim().optional(),
          postalCode: z.string().trim().optional(),
        })
        .optional(),
      location: z
        .object({
          type: z.literal("Point").default("Point"),
          coordinates: z.array(z.number()).length(2).default([0, 0]),
        })
        .optional(),
      openingHours: openingHoursSchema,
      slotDurationMinutes: z.number().int().min(5).default(30).optional(),
      maxBookingsPerSlot: z.number().int().min(1).default(1).optional(),
      images: z
        .array(
          z.object({
            url: z.string().url("Image url must be valid"),
            publicId: z.string().optional(),
          }),
        )
        .optional(),
      status: z.enum(WORKSHOP_STATUSES).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
});

const updateWorkshopSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).optional(),
      code: z.string().trim().toUpperCase().min(2).max(20).optional(),
      description: z.string().trim().optional(),
      phone: z.string().trim().min(7).optional(),
      email: z.string().trim().toLowerCase().email().optional(),
      address: z
        .object({
          line1: z.string().trim().optional(),
          line2: z.string().trim().optional(),
          city: z.string().trim().optional(),
          state: z.string().trim().optional(),
          country: z.string().trim().optional(),
          postalCode: z.string().trim().optional(),
        })
        .optional(),
      location: z
        .object({
          type: z.literal("Point"),
          coordinates: z.array(z.number()).length(2),
        })
        .optional(),
      openingHours: openingHoursSchema,
      slotDurationMinutes: z.number().int().min(5).optional(),
      maxBookingsPerSlot: z.number().int().min(1).optional(),
      images: z.array(z.object({ url: z.string().url(), publicId: z.string().optional() })).optional(),
      status: z.enum(WORKSHOP_STATUSES).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required to update",
    }),
  params: z.object({
    id: objectIdSchema,
  }),
});

const workshopIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const listWorkshopsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(WORKSHOP_STATUSES).optional(),
    search: z.string().trim().optional(),
    city: z.string().trim().optional(),
    sortBy: z.enum(["createdAt", "name", "code"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

module.exports = {
  createWorkshopSchema,
  updateWorkshopSchema,
  workshopIdParamSchema,
  listWorkshopsQuerySchema,
};