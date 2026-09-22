const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

const SERVICE_TYPES = ["DETAILING", "REPAIR", "MAINTENANCE", "INSPECTION"];
const PRICING_TYPES = ["FIXED", "STARTING_FROM", "INSPECTION_REQUIRED"];

const createServiceSchema = z.object({
  body: z.object({
    workshopId: objectIdSchema,
    categoryId: objectIdSchema,
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(1, "Name is required"),
    slug: z.string().trim().toLowerCase().optional(),
    description: z.string().trim().optional(),
    serviceType: z.enum(SERVICE_TYPES).default("DETAILING").optional(),
    pricingType: z.enum(PRICING_TYPES).default("FIXED").optional(),
    basePrice: z.number().min(0).default(0).optional(),
    estimatedDurationMinutes: z.number().int().min(0).default(0).optional(),
    requiredSkills: z.array(z.string().trim()).default([]).optional(),
    images: z
      .array(
        z.object({
          url: z.string().url("Image url must be valid"),
          publicId: z.string().optional(),
        }),
      )
      .optional(),
    isActive: z.boolean().default(true).optional(),
  }),
});

const updateServiceSchema = z.object({
  body: z
    .object({
      categoryId: objectIdSchema.optional(),
      name: z.string().trim().min(1).optional(),
      slug: z.string().trim().toLowerCase().optional(),
      description: z.string().trim().optional(),
      serviceType: z.enum(SERVICE_TYPES).optional(),
      pricingType: z.enum(PRICING_TYPES).optional(),
      basePrice: z.number().min(0).optional(),
      estimatedDurationMinutes: z.number().int().min(0).optional(),
      requiredSkills: z.array(z.string().trim()).optional(),
      images: z.array(z.object({ url: z.string().url(), publicId: z.string().optional() })).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required to update",
    }),
  params: z.object({
    id: objectIdSchema,
  }),
});

const serviceIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const listServicesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    workshopId: objectIdSchema.optional(),
    categoryId: objectIdSchema.optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(["createdAt", "name", "basePrice"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

module.exports = {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
  listServicesQuerySchema,
};