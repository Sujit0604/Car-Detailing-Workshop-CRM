const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

const PART_STATUSES = ["ACTIVE", "INACTIVE"];

const stockSchema = z
  .object({
    quantity: z.coerce.number().min(0).default(0),
    reservedQuantity: z.coerce.number().min(0).default(0),
    reorderLevel: z.coerce.number().min(0).default(0),
    maxStockLevel: z.coerce.number().min(0).default(0),
  })
  .optional();

const createInventoryPartSchema = z.object({
  body: z.object({
    workshopId: objectIdSchema,
    partNumber: z.string({ required_error: "Part number is required" }).trim().toUpperCase().min(2),
    name: z.string({ required_error: "Part name is required" }).trim().min(1, "Part name is required"),
    category: z.string().trim().optional(),
    brand: z.string().trim().optional(),
    description: z.string().trim().optional(),
    unit: z.string().trim().optional(),
    purchasePrice: z.coerce.number().min(0).default(0),
    sellingPrice: z.coerce.number().min(0).default(0),
    stock: stockSchema,
    supplier: z
      .object({
        name: z.string().trim().optional(),
        contact: z.string().trim().optional(),
      })
      .optional(),
    location: z.string().trim().optional(),
  }),
});

const updateInventoryPartSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      partNumber: z.string().trim().toUpperCase().min(2).optional(),
      name: z.string().trim().min(1).optional(),
      category: z.string().trim().optional(),
      brand: z.string().trim().optional(),
      description: z.string().trim().optional(),
      unit: z.string().trim().optional(),
      purchasePrice: z.coerce.number().min(0).optional(),
      sellingPrice: z.coerce.number().min(0).optional(),
      stock: stockSchema,
      supplier: z
        .object({
          name: z.string().trim().optional(),
          contact: z.string().trim().optional(),
        })
        .optional(),
      location: z.string().trim().optional(),
      status: z.enum(PART_STATUSES).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required to update",
    }),
});

const adjustStockSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    adjustment: z.coerce
      .number()
      .int()
      .refine((v) => v !== 0, { message: "Adjustment cannot be zero" }),
    reason: z.string().trim().optional(),
  }),
});

const inventoryIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const listInventoryPartsQuerySchema = z.object({
  query: z.object({
    workshopId: objectIdSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(PART_STATUSES).optional(),
    lowStock: z.enum(["true", "false"]).optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(["createdAt", "name", "partNumber", "sellingPrice"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

module.exports = {
  createInventoryPartSchema,
  updateInventoryPartSchema,
  adjustStockSchema,
  inventoryIdParamSchema,
  listInventoryPartsQuerySchema,
};