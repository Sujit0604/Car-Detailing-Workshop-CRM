const asyncHandler = require("../utils/asyncHandler.js");
const {
  registerService,
  loginService,
  verifyOtpService,
} = require("../services/auth.service.js");
const sendResponse = require("../utils/sendResponse.js");


const register = asyncHandler(async (req, res) => {
    const { name, email, password, gender, phone, role } = req.body;

    const result = await registerService(name, email, password, gender, phone, role);

    return sendResponse(res, 201, "User registered successfully", result);
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await loginService(email, password);

    return sendResponse(res, 201, result.message, result);
});

const verifyOtp = asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    const result = await verifyOtpService(email, code);

    return sendResponse(res, 201, result.message, result);
});


module.exports = { 
    register,
    login,
    verifyOtp
};
