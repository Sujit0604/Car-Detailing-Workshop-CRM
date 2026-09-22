const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

const createServiceCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(1, "Name is required"),
    slug: z.string().trim().toLowerCase().optional(),
    description: z.string().trim().optional(),
    image: z.string().trim().optional(),
    displayOrder: z.number().int().default(0).optional(),
    isActive: z.boolean().default(true).optional(),
  }),
});

const updateServiceCategorySchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).optional(),
      slug: z.string().trim().toLowerCase().optional(),
      description: z.string().trim().optional(),
      image: z.string().trim().optional(),
      displayOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required to update",
    }),
  params: z.object({
    id: objectIdSchema,
  }),
});

const serviceCategoryIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const listServiceCategoriesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(["createdAt", "name", "displayOrder", "slug"]).default("displayOrder"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),
});

module.exports = {
  createServiceCategorySchema,
  updateServiceCategorySchema,
  serviceCategoryIdParamSchema,
  listServiceCategoriesQuerySchema,
};