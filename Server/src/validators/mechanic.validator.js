const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

const listMechanicsQuerySchema = z.object({
  query: z.object({
    workshopId: objectIdSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
    search: z.string().trim().optional(),
  }),
});

module.exports = {
  listMechanicsQuerySchema,
};