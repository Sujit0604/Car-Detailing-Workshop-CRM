const asyncHandler = require("../utils/asyncHandler.js");
const {
  registerService,
  loginService,
  verifyOtpService,
  refreshTokenService,
  logoutService,
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

const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const result = await refreshTokenService(refreshToken);

    return sendResponse(res, 200, "Tokens refreshed successfully", result);
});

const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const result = await logoutService(refreshToken);

    return sendResponse(res, 200, result.message, result);
});


module.exports = { 
    register,
    login,
    verifyOtp,
    refreshToken,
    logout
};
