const express = require("express");
const { 
    register,
    login,
    verifyOtp
} = require("../controllers/auth.controller.js");
const {
    loginLimiter,
    registerLimiter,
    passwordResetLimiter
} = require("../middleware/rateLimiter.js");
const logger = require("../utils/logger.js");
const validate = require("../middleware/validation.middleware.js");
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
} = require("../validators/auth.validator.js");

const authRouter = express.Router();

// 1. Router-level logging middleware (logs all incoming hits to /api/v1/auth/*)
authRouter.use((req, res, next) => {
    logger.info(`[Auth Router] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
});

// 2. Specialized route logger helper for specific endpoints
const logRoute = (routeName) => (req, res, next) => {
    logger.info(`[Auth Router] Executing ${routeName} route handler`);
    next();
};

authRouter.post(
    '/register',
    registerLimiter,
    logRoute("Register"),
    validate(registerSchema),
    register
);

authRouter.post(
    '/login',
    loginLimiter,
    logRoute("Login"),
    validate(loginSchema),
    login
);

authRouter.post(
    '/verify-otp',
    logRoute("Verify-Otp"),
    validate(verifyOtpSchema),
    verifyOtp
)


module.exports = authRouter;
