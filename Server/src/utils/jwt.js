const jwt = require("jsonwebtoken");
const env = require("../config/env.js");
const ApiError = require("../utils/ApiError.js");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id || user._id,
      email: user.email,
      role: user.role,
      type: "access",
    },
    env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_EXPIRES,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    },
  );
};

// gen ref token
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id || user._id,
      type: "refresh",
    },
    env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_EXPIRES,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    },
  );
};

// ver acc token
const verifyAccessToken = async (token) => {
  try {
    return jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
  } catch (error) {
    throw new ApiError(401, " Invalid or Expired Access Token");
  }
};

// verify ref token
const verifyRefreshToken = async (token) => {
  try {
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch (error) {
    throw new ApiError(401, "Invalid or Expired Refresh Token");
  }
};

const decodeToken = async (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};
