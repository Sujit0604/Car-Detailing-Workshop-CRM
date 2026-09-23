const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

const JOB_STATUSES = [
  "CREATED",
  "CHECK_IN",
  "INSPECTION",
  "ESTIMATE_PENDING",
  "CUSTOMER_APPROVAL",
  "APPROVED",
  "ASSIGNED",
  "IN_PROGRESS",
  "QUALITY_CHECK",
  "REWORK",
  "READY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
];

const bookingIdentifierSchema = z
  .string()
  .trim()
  .min(1, "Booking id or booking number is required");

const createJobSchema = z.object({
  body: z.object({
    bookingId: z.union([objectIdSchema, bookingIdentifierSchema]),
    serviceAdvisorId: objectIdSchema.optional(),
  }),
});

const jobIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const workshopIdParamSchema = z.object({
  params: z.object({
    workshopId: objectIdSchema,
  }),
});

const updateJobStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(JOB_STATUSES),
    notes: z.string().trim().optional(),
  }),
});

const assignMechanicSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    mechanicId: objectIdSchema,
  }),
});

const checkInJobSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    odometerIn: z.number().int().min(0).optional(),
    customerNotes: z.string().trim().optional(),
    internalNotes: z.string().trim().optional(),
  }),
});

const listJobsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(JOB_STATUSES).optional(),
    mechanicId: objectIdSchema.optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    sortBy: z.enum(["createdAt", "expectedCompletionAt", "status"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

const estimateItemSchema = z.object({
  type: z.enum(["LABOUR", "PART", "SERVICE", "OTHER"]).default("OTHER"),
  name: z.string({ required_error: "Item name is required" }).trim().min(1, "Item name is required"),
  description: z.string().trim().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0).default(0),
});

const createEstimateSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    items: z
      .array(estimateItemSchema)
      .min(1, "At least one estimate item is required"),
    discount: z.coerce.number().min(0).default(0),
    tax: z.coerce.number().min(0).default(0),
    notes: z.string().trim().optional(),
  }),
});

const estimateRespondSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    action: z.enum(["APPROVED", "REJECTED"]),
    remarks: z.string().trim().optional(),
    cancelBooking: z.boolean().optional(),
  }),
});

module.exports = {
  createJobSchema,
  jobIdParamSchema,
  workshopIdParamSchema,
  updateJobStatusSchema,
  assignMechanicSchema,
  checkInJobSchema,
  listJobsQuerySchema,
  createEstimateSchema,
  estimateRespondSchema,
};