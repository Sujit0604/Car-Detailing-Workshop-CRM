const dotenv = require("dotenv");

dotenv.config();

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

  CLIENT_URL: process.env.CLIENT_URL,

  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  

};

module.exports = env;
