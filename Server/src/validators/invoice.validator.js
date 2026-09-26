const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid ObjectId",
});

const currencySchema = z
  .string()
  .trim()
  .length(3, "Currency must be a three-letter code")
  .regex(/^[A-Za-z]{3}$/, "Currency must be a three-letter code")
  .transform((value) => value.toUpperCase());

const generateInvoiceSchema = z.object({
  body: z.object({
    jobId: objectIdSchema,
    estimateId: objectIdSchema.optional(),
  }),
});

const invoiceIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const listInvoicesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "VOID"]).optional(),
    currency: currencySchema.optional(),
    customerId: objectIdSchema.optional(),
    workshopId: objectIdSchema.optional(),
    bookingId: objectIdSchema.optional(),
    jobId: objectIdSchema.optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    sortBy: z
      .enum(["createdAt", "issuedAt", "dueAt", "status", "pricing.grandTotal"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

const issueInvoiceSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    dueAt: z.coerce.date().optional(),
  }),
});

const voidInvoiceSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    reason: z.string().trim().min(1).max(500).optional(),
  }),
});

module.exports = {
  generateInvoiceSchema,
  invoiceIdParamSchema,
  listInvoicesQuerySchema,
  issueInvoiceSchema,
  voidInvoiceSchema,
};
