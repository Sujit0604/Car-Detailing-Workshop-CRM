const { z } = require("zod");

const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(30, "Name must be at most 30 characters"),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Please provide a valid email"),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
      .regex(/[0-9]/, "Password must contain at least 1 number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 symbol"),
    gender: z.enum(["male", "female", "other"]).optional().default("other"),
    phone: z
      .string({ required_error: "Phone is required" })
      .trim()
      .regex(/^\+?[0-9]{10,15}$/, "Please provide a valid phone number"),
    role: z.enum(["CUSTOMER", "ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"]).optional().default("CUSTOMER"),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Please provide a valid email"),
    password: z.string({ required_error: "Password is required" }),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Please provide a valid email"),
    code: z.string({ required_error: "OTP is required" }),
  }),
});

module.exports = { registerSchema, loginSchema, verifyOtpSchema };
