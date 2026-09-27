const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid ObjectId",
});

const paginationQueryShape = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "rating"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
};

const createReviewSchema = z.object({
  body: z.object({
    bookingId: objectIdSchema,
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().min(1).max(150).optional(),
    comment: z.string().trim().min(1).max(3000).optional(),
    images: z
      .array(
        z.object({
          url: z.string().trim().url().max(2000),
          publicId: z.string().trim().max(300).optional(),
        }),
      )
      .max(5)
      .optional(),
  }),
});

const reviewIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const listPublishedReviewsQuerySchema = z.object({
  query: z.object({
    ...paginationQueryShape,
    workshopId: objectIdSchema.optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
  }),
});

const listReviewsQuerySchema = z.object({
  query: z.object({
    ...paginationQueryShape,
    workshopId: objectIdSchema.optional(),
    customerId: objectIdSchema.optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    status: z.enum(["PUBLISHED", "HIDDEN", "FLAGGED"]).optional(),
  }),
});

const respondToReviewSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    message: z.string().trim().min(1).max(2000),
  }),
});

const moderateReviewSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(["PUBLISHED", "HIDDEN", "FLAGGED"]),
    reason: z.string().trim().max(1000).optional(),
  }),
});

module.exports = {
  createReviewSchema,
  reviewIdParamSchema,
  listPublishedReviewsQuerySchema,
  listReviewsQuerySchema,
  respondToReviewSchema,
  moderateReviewSchema,
};
