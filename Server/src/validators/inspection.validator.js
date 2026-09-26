const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid ObjectId",
});

const INSPECTION_TYPES = ["INITIAL", "FINAL", "REINSPECTION"];
const INSPECTION_STATUSES = ["DRAFT", "COMPLETED"];

const inspectionItemSchema = z.object({
  component: z.string().trim().min(1, "Component is required"),
  condition: z
    .enum(["GOOD", "FAIR", "POOR", "DAMAGED", "REPLACE_REQUIRED"])
    .default("GOOD"),
  notes: z.string().trim().optional(),
  images: z
    .array(
      z.object({
        url: z.string().trim().url("Image URL must be valid"),
        publicId: z.string().trim().optional(),
      }),
    )
    .default([]),
  recommendedAction: z.string().trim().optional(),
});

const createInspectionSchema = z.object({
  body: z.object({
    jobId: objectIdSchema,
    inspectionType: z.enum(INSPECTION_TYPES).default("INITIAL"),
    odometerReading: z.coerce.number().min(0).optional(),
    fuelLevel: z.coerce.number().min(0).max(100).optional(),
    exteriorCondition: z.string().trim().optional(),
    interiorCondition: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    items: z.array(inspectionItemSchema).default([]),
  }),
});

const updateInspectionSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      inspectionType: z.enum(INSPECTION_TYPES).optional(),
      odometerReading: z.coerce.number().min(0).optional(),
      fuelLevel: z.coerce.number().min(0).max(100).optional(),
      exteriorCondition: z.string().trim().optional(),
      interiorCondition: z.string().trim().optional(),
      notes: z.string().trim().optional(),
      items: z.array(inspectionItemSchema).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required to update",
    }),
});

const inspectionIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const listInspectionsQuerySchema = z.object({
  query: z.object({
    jobId: objectIdSchema.optional(),
    inspectionType: z.enum(INSPECTION_TYPES).optional(),
    status: z.enum(INSPECTION_STATUSES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z.enum(["createdAt", "updatedAt", "inspectionType", "status"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

module.exports = {
  createInspectionSchema,
  updateInspectionSchema,
  inspectionIdParamSchema,
  listInspectionsQuerySchema,
};
