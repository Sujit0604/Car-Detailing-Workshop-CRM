const User = require("../models/User.js");
const ApiError = require("../utils/ApiError.js");
const asyncHandler = require("../utils/asyncHandler.js");
const { verifyAccessToken } = require("../utils/jwt.js");
const logger = require("../utils/logger.js");


const authMiddleware = asyncHandler(async (req, res, next) => {
    let token;

    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(" ")[1] // Remove "Bearer " prefix
    }

    if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        throw new ApiError(401, "Access token is required")
    }

    const decode = await verifyAccessToken(token);

    const user = await User.findById(decode.id);

    logger.info(user);

    if (!user) {
        throw new ApiError(401, "User not found.")
    }

    if (user.status === "BLOCKED") {
        throw new ApiError(403, "Your account is blocked.")
    }

    req.user = user;

    next();
});

module.exports = authMiddleware;
