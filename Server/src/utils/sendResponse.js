const ApiResponse = require("../utils/ApiResponse.js");

const sendResponse = (
    res,
    statusCode = 200,
    message = "success",
    data = null
) => {
    return res.status(statusCode)
        .json(new ApiResponse(statusCode, message, data))
}

module.exports = sendResponse;
