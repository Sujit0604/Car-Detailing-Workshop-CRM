const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid ObjectId",
});

// Accepts either a Mongo ObjectId or a human readable job number (JOB-2026-AB12CD34).
const jobIdentifierSchema = z
  .string()
  .trim()
  .min(1, "Job id is required")
  .refine(
    (value) =>
      mongoose.Types.ObjectId.isValid(value) || /^[A-Za-z0-9][A-Za-z0-9-]{3,63}$/.test(value),
    { message: "Enter a valid job ObjectId or job number (e.g. JOB-2026-AB12CD34)" },
  );

// Optional. Admins may paste an estimate ObjectId or an estimate number
// (EST-2026-AB12CD34); a missing or blank value is normalised to undefined.
// Note: in Zod 4 a bare z.union([z.string(), z.undefined()]) still requires the
// key to be present, so .optional() is what makes an omitted key valid.
const estimateIdentifierSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const currencySchema = z
  .string()
  .trim()
  .length(3, "Currency must be a three-letter code")
  .regex(/^[A-Za-z]{3}$/, "Currency must be a three-letter code")
  .transform((value) => value.toUpperCase());

const generateInvoiceSchema = z.object({
  body: z.object({
    jobId: jobIdentifierSchema,
    estimateId: estimateIdentifierSchema,
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
