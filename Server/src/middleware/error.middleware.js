const ApiError = require("../utils/ApiError.js");

const errorhandler = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        error = new ApiError(500, error.message || "Internal Server Error.")
    }

    return res.status(error.statusCode).json({
        success: false,
        statusCode: error.statusCode || 500,
        message: error.message,
        errors: error.errors || [],
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        timestamp: new Date().toISOString()
    });
};

module.exports = errorhandler;
