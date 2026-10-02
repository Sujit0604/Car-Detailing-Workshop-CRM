const rateLimit = require("express-rate-limit");
const ApiResponse = require("../utils/ApiResponse.js");

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

// Limits come from env so each environment can be tuned without a redeploy of code.
const limitFromEnv = (name, fallback) => {
    const parsed = Number(process.env[name]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const shared = {
    windowMs: limitFromEnv("RATE_LIMIT_WINDOW_MS", FIFTEEN_MINUTES),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    // Keys default to req.ip, which needs app.set("trust proxy", 1) in app.js.
    handler: (req, res) =>
        res.status(429).json(
            new ApiResponse(429, "Too many requests. Please try again later.")
        ),
};

// Generous ceiling for normal browsing. A dashboard page fires many parallel
// requests, so this only exists to stop runaway/abusive traffic.
const apiLimiter = rateLimit({
    ...shared,
    limit: limitFromEnv("RATE_LIMIT_MAX_REQUESTS", 300),
    // Never count uptime probes or Razorpay's webhook deliveries.
    skip: (req) =>
        req.path === "/" ||
        req.path === "/health" ||
        req.originalUrl.startsWith("/api/v1/payments/webhooks/"),
});

// Only failed logins count, otherwise a legitimate user who signs in a few
// times gets locked out of their own account.
const loginLimiter = rateLimit({
    ...shared,
    windowMs: limitFromEnv("LOGIN_LIMIT_WINDOW_MS", FIFTEEN_MINUTES),
    limit: limitFromEnv("LOGIN_LIMIT_MAX_ATTEMPTS", 10),
    skipSuccessfulRequests: true,
    handler: (req, res) =>
        res.status(429).json(
            new ApiResponse(429, "Too many failed login attempts. Please try again in 15 minutes.")
        ),
});

const registerLimiter = rateLimit({
    ...shared,
    windowMs: limitFromEnv("REGISTER_LIMIT_WINDOW_MS", ONE_HOUR),
    limit: limitFromEnv("REGISTER_LIMIT_MAX_ATTEMPTS", 20),
    handler: (req, res) =>
        res.status(429).json(
            new ApiResponse(429, "Too many registration attempts. Please try again later.")
        ),
});

const passwordResetLimiter = rateLimit({
    ...shared,
    windowMs: limitFromEnv("PASSWORD_RESET_LIMIT_WINDOW_MS", ONE_HOUR),
    limit: limitFromEnv("PASSWORD_RESET_LIMIT_MAX_ATTEMPTS", 5),
    handler: (req, res) =>
        res.status(429).json(
            new ApiResponse(429, "Too many password reset attempts. Please try again later.")
        ),
});


module.exports = {
    apiLimiter,
    loginLimiter,
    registerLimiter,
    passwordResetLimiter
}
