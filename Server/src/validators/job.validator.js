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

const createJobSchema = z.object({
  body: z.object({
    bookingId: objectIdSchema,
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

module.exports = {
  createJobSchema,
  jobIdParamSchema,
  workshopIdParamSchema,
  updateJobStatusSchema,
  assignMechanicSchema,
  checkInJobSchema,
  listJobsQuerySchema,
};