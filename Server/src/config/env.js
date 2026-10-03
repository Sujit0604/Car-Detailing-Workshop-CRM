const dotenv = require("dotenv");

if(process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const env = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,

  MONGO_URI: process.env.MONGO_URI,

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES,

  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES,

  CRYPTO_SECRET: process.env.CRYPTO_SECRET,
  CRYPTO_ALGORITHM: process.env.CRYPTO_ALGORITHM,
  CRYPTO_IV: process.env.CRYPTO_IV,

  OTP_LENGTH: process.env.OTP_LENGTH,
  OTP_EXPIRY_MINUTES: process.env.OTP_EXPIRY_MINUTES,

  BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS,

  JWT_AUDIENCE: process.env.JWT_AUDIENCE,
  JWT_ISSUER: process.env.JWT_ISSUER,

  CORS_ORIGINS: process.env.CORS_ORIGINS,
  CLIENT_URL: process.env.CLIENT_URL,
  ADMIN_URL: process.env.ADMIN_URL,

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
};

module.exports = env;
