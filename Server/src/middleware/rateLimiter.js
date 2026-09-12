const rateLimit = require("express-rate-limit");
const ApiError = require("../utils/ApiError.js");

const apiLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false,

    message: new ApiError(
        401,
        "Too many requests. Please try again later."
    ),
});

const loginLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,

    message: new ApiError(
        401,
        "Too many login requests. Please try again after 15 mins."
    ),
});


const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,

    message: new ApiError(
        401,
        "Too many Registration requests. Please try again later."
    ),
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,

    message: new ApiError(
        401,
        "Password reset limit exceeds. Please try again later."
    ),
});


module.exports = {
    apiLimiter, 
    loginLimiter,
    registerLimiter,
    passwordResetLimiter
}
