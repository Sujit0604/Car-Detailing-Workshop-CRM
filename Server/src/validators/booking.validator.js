const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

const createBookingSchema = z.object({
  body: z.object({
    vehicleId: objectIdSchema,
    workshopId: objectIdSchema,
    appointment: z.object({
      date: z.coerce.date({ required_error: "Appointment date is required" }),
      startTime: z.string({ required_error: "Start time is required" }).trim(),
      endTime: z.string({ required_error: "End time is required" }).trim(),
      slotId: z.string().trim().optional(),
    }),
    services: z
      .array(
        z.object({
          serviceId: objectIdSchema,
          quantity: z.number().int().min(1).default(1),
        }),
      )
      .min(1, "At least one service is required"),
    couponCode: z.string().trim().optional(),
    customerNotes: z.string().trim().max(1000).optional(),
  }),
});

const bookingIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const workshopIdParamSchema = z.object({
  params: z.object({
    workshopId: objectIdSchema,
  }),
});

const updateBookingStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum([
      "PENDING",
      "CONFIRMED",
      "CANCELLED",
      "VEHICLE_RECEIVED",
      "IN_PROGRESS",
      "COMPLETED",
      "NO_SHOW",
    ]),
    reason: z.string().trim().optional(),
  }),
});

const updatePaymentStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    paymentStatus: z.enum(["PENDING", "PARTIAL", "PAID", "FAILED", "REFUNDED"]),
  }),
});

const cancelBookingSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    reason: z.string().trim().max(500).optional(),
  }),
});

const listBookingsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z
      .enum([
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "VEHICLE_RECEIVED",
        "IN_PROGRESS",
        "COMPLETED",
        "NO_SHOW",
      ])
      .optional(),
    paymentStatus: z.enum(["PENDING", "PARTIAL", "PAID", "FAILED", "REFUNDED"]).optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    sortBy: z.enum(["createdAt", "appointment.date", "pricing.total"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

module.exports = {
  createBookingSchema,
  bookingIdParamSchema,
  workshopIdParamSchema,
  updateBookingStatusSchema,
  updatePaymentStatusSchema,
  cancelBookingSchema,
  listBookingsQuerySchema,
};