const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid ObjectId",
});

const JOB_PART_STATUSES = ["RESERVED", "USED", "RETURNED", "CANCELLED"];

const createJobPartSchema = z.object({
  params: z.object({
    jobId: objectIdSchema,
  }),
  body: z.object({
    inventoryPartId: objectIdSchema,
    quantity: z.coerce.number().int().min(1).default(1),
  }),
});

const updateJobPartStatusSchema = z.object({
  params: z.object({
    jobId: objectIdSchema,
    partId: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(JOB_PART_STATUSES),
    reason: z.string().trim().optional(),
  }),
});

const cancelJobPartSchema = z.object({
  params: z.object({
    jobId: objectIdSchema,
    partId: objectIdSchema,
  }),
  body: z
    .object({
      reason: z.string().trim().optional(),
    })
    .optional(),
});

const jobPartIdParamSchema = z.object({
  params: z.object({
    jobId: objectIdSchema,
    partId: objectIdSchema,
  }),
});

const listJobPartsQuerySchema = z.object({
  params: z.object({
    jobId: objectIdSchema,
  }),
  query: z.object({
    inventoryPartId: objectIdSchema.optional(),
    status: z.enum(JOB_PART_STATUSES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z.enum(["createdAt", "updatedAt", "status", "totalPrice"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

module.exports = {
  createJobPartSchema,
  updateJobPartStatusSchema,
  cancelJobPartSchema,
  jobPartIdParamSchema,
  listJobPartsQuerySchema,
};
