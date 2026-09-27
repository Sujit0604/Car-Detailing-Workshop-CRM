const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid ObjectId",
});

const paymentStatusSchema = z.enum([
  "CREATED",
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

const checkoutSignatureSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{64}$/i, "Invalid Razorpay checkout signature");

const createRazorpayOrderSchema = z.object({
  body: z.object({
    invoiceId: objectIdSchema,
  }),
});

const verifyPaymentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    razorpayOrderId: z.string().trim().min(1, "Razorpay order id is required"),
    razorpayPaymentId: z.string().trim().min(1, "Razorpay payment id is required"),
    razorpaySignature: checkoutSignatureSchema,
  }),
});

const paymentIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const recordOfflinePaymentBodySchema = z
  .object({
    invoiceId: objectIdSchema,
    method: z.enum(["CASH", "UPI", "CARD"]),
    amountMinor: z.coerce.number().int().positive().optional(),
    amount: z.union([z.coerce.number().positive(), z.string().trim().min(1)]).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.amountMinor !== undefined || data.amount !== undefined, {
    message: "amountMinor or amount is required",
    path: ["amountMinor"],
  });

const recordOfflinePaymentSchema = z.object({
  body: recordOfflinePaymentBodySchema,
});

const refundPaymentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    amountMinor: z.coerce.number().int().positive(),
    reason: z.string().trim().max(500).optional(),
  }),
});

const listPaymentsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: paymentStatusSchema.optional(),
    method: z.string().trim().optional(),
    invoiceId: objectIdSchema.optional(),
    workshopId: objectIdSchema.optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    sortBy: z.enum(["createdAt", "paidAt", "amount", "status"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

module.exports = {
  objectIdSchema,
  createRazorpayOrderSchema,
  createOrderSchema: createRazorpayOrderSchema,
  verifyPaymentSchema,
  verifyRazorpayPaymentSchema: verifyPaymentSchema,
  paymentIdParamSchema,
  recordOfflinePaymentSchema,
  recordOfflinePaymentBodySchema,
  recordPaymentSchema: recordOfflinePaymentSchema,
  refundPaymentSchema,
  listPaymentsQuerySchema,
};
