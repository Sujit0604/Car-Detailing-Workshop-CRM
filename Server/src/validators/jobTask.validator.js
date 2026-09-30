const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid ObjectId",
});

const JOB_TASK_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"];
const JOB_TASK_TYPES = ["REPAIR", "DETAILING", "INSPECTION", "MAINTENANCE"];

const createJobTaskSchema = z.object({
  params: z.object({
    jobId: objectIdSchema,
  }),
  body: z.object({
    title: z.string().trim().min(1, "Task title is required"),
    description: z.string().trim().optional(),
    taskType: z.enum(JOB_TASK_TYPES).default("REPAIR"),
    assignedMechanicId: objectIdSchema.nullable().optional(),
    estimatedMinutes: z.coerce.number().int().min(0).optional(),
    notes: z.string().trim().optional(),
    sequence: z.coerce.number().int().min(0).optional(),
  }),
});

const updateJobTaskSchema = z.object({
  params: z.object({
    jobId: objectIdSchema,
    taskId: objectIdSchema,
  }),
  body: z
    .object({
      title: z.string().trim().min(1).optional(),
      description: z.string().trim().optional(),
      taskType: z.enum(JOB_TASK_TYPES).optional(),
      assignedMechanicId: objectIdSchema.nullable().optional(),
      estimatedMinutes: z.coerce.number().int().min(0).optional(),
      notes: z.string().trim().optional(),
      sequence: z.coerce.number().int().min(0).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required to update",
    }),
});

const updateJobTaskStatusSchema = z.object({
  params: z.object({
    jobId: objectIdSchema,
    taskId: objectIdSchema,
  }),
  body: z
    .object({
      status: z.enum(JOB_TASK_STATUSES),
      blockedReason: z.string().trim().min(1).optional(),
      actualMinutes: z.coerce.number().int().min(0).optional(),
    })
    .superRefine((data, context) => {
      if (data.status === "BLOCKED" && !data.blockedReason) {
        context.addIssue({
          code: "custom",
          path: ["blockedReason"],
          message: "Blocked reason is required",
        });
      }

      if (data.actualMinutes !== undefined && data.status !== "COMPLETED") {
        context.addIssue({
          code: "custom",
          path: ["actualMinutes"],
          message: "Actual minutes can only be set when completing a task",
        });
      }
    }),
});

const jobTaskIdParamSchema = z.object({
  params: z.object({
    jobId: objectIdSchema,
    taskId: objectIdSchema,
  }),
});

const listJobTasksQuerySchema = z.object({
  params: z.object({
    jobId: objectIdSchema,
  }),
  query: z.object({
    status: z.enum(JOB_TASK_STATUSES).optional(),
    assignedMechanicId: objectIdSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z.enum(["sequence", "status", "createdAt", "updatedAt"]).default("sequence"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),
});

module.exports = {
  createJobTaskSchema,
  updateJobTaskSchema,
  updateJobTaskStatusSchema,
  jobTaskIdParamSchema,
  listJobTasksQuerySchema,
};
