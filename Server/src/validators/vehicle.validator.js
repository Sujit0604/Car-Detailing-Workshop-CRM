const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

const createVehicleSchema = z.object({
  body: z.object({
    registrationNumber: z
      .string({ required_error: "Registration number is required" })
      .trim()
      .toUpperCase()
      .min(3, "Registration number must be at least 3 characters")
      .max(20, "Registration number must be at most 20 characters"),
    make: z
      .string({ required_error: "Make is required" })
      .trim()
      .min(1, "Make is required"),
    model: z
      .string({ required_error: "Model is required" })
      .trim()
      .min(1, "Model is required"),
    variant: z.string().trim().optional(),
    manufacturingYear: z
      .number()
      .int()
      .min(1900, "Manufacturing year cannot be before 1900")
      .max(new Date().getFullYear() + 1, `Year cannot exceed ${new Date().getFullYear() + 1}`)
      .optional(),
    fuelType: z
      .enum(["PETROL", "DIESEL", "CNG", "ELECTRIC", "HYBRID"])
      .optional(),
    transmission: z
      .enum(["MANUAL", "AUTOMATIC", "AMT", "CVT", "DCT", "OTHER"])
      .optional(),
    color: z.string().trim().optional(),
    vin: z.string().trim().toUpperCase().optional(),
    odometer: z.number().int().min(0).optional(),
    images: z
      .array(
        z.object({
          url: z.string().url("Image url must be valid"),
          publicId: z.string().optional(),
        }),
      )
      .optional(),
  }),
});

const updateVehicleSchema = z.object({
  body: z
    .object({
      registrationNumber: z.string().trim().toUpperCase().min(3).max(20).optional(),
      make: z.string().trim().min(1).optional(),
      model: z.string().trim().min(1).optional(),
      variant: z.string().trim().optional(),
      manufacturingYear: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
      fuelType: z.enum(["PETROL", "DIESEL", "CNG", "ELECTRIC", "HYBRID"]).optional(),
      transmission: z.enum(["MANUAL", "AUTOMATIC", "AMT", "CVT", "DCT", "OTHER"]).optional(),
      color: z.string().trim().optional(),
      vin: z.string().trim().toUpperCase().optional(),
      odometer: z.number().int().min(0).optional(),
      images: z.array(z.object({ url: z.string().url(), publicId: z.string().optional() })).optional(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required to update",
    }),
  params: z.object({
    id: objectIdSchema,
  }),
});

const vehicleIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const listVehiclesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(["createdAt", "registrationNumber", "manufacturingYear"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

module.exports = {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
  listVehiclesQuerySchema,
};