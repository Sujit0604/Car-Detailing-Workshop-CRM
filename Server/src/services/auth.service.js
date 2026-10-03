const ApiError = require("../utils/ApiError.js");
const User = require("../models/User.js");
const { generateOTP } = require("../utils/generateOTP.js");
const { sendVerificationCode, sendWelcomeEmail } = require("../utils/Email.js");
const { verifyRefreshToken } = require("../utils/jwt.js");
const logger = require("../utils/logger.js");

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const buildUserBrief = (user) => {
  const workshopId = user.workshopId
    ? typeof user.workshopId === "object" && user.workshopId._id
      ? { _id: user.workshopId._id, name: user.workshopId.name, code: user.workshopId.code }
      : user.workshopId
    : null;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    workshopId,
  };
};


// Issues an OTP, persists it, and mails it. The code is cleared again when the
// mail cannot be delivered so the next attempt starts from a fresh code instead
// of leaving the user holding one that was never sent.
const issueOtp = async (user, message) => {
    const verificationCode = await generateOTP();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;

    await user.save();

    const delivered = await sendVerificationCode(user.email, verificationCode);

    if (!delivered) {
        user.verificationCode = null;
        user.verificationCodeExpires = null;

        await user.save();

        throw new ApiError(503, "Could not send the verification email. Please try again.");
    }

    return { message };
};


const registerService = async (name, email, password, gender, phone, role) => {
    const existingUser = await User.findOne({
        $or: [{ email }, { phone }]
    }).select("-password");

    if (existingUser) {
        throw new ApiError(400, "User already exists!");
    }

    role = "CUSTOMER";

    const threeDayExpires = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const user = await User.create({
      name,
      email,
      password,
      gender,
      phone,
      role,
      threeDayExpires
    });

    // const accToken = await user.generateAccessToken();
    // const refToken = await user.generateRefreshToken();
    // const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // const verificationCode = await generateOTP();
    // const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    // user.refreshToken = refToken;
    // user.refreshTokenExpires = refreshTokenExpires;

    // user.verificationCode = verificationCode;
    // user.verificationCodeExpires = verificationCodeExpires;

    // await user.save();

    // send otp
    // sendVerificationCode(user.email, verificationCode);

    const sendUser = buildUserBrief(user);

    const result = {
        user: sendUser,
        // accessToken: accToken,
        // refreshToken: refToken
    }

    return result;
};

const loginService = async (email, password) => {
    const user = await User.findOne({ email }).select("+password").populate("workshopId", "name code");

    if(!user) {
        throw new ApiError(401, "Invalid Credentials");
    }

    const isMatch = await user.comparePassword(password);

    if(!isMatch) {
        throw new ApiError(401, "Invalid Credentials");
    }

    if(user.needsVerification && !user.emailVerified) {
        return issueOtp(
            user,
            'OTP sent to your email. You should verify email for first time login.'
        );
    }

    if(user.threeDayExpires < new Date() && user.emailVerified) {
        if(!user.needsVerification) {
            user.needsVerification = true;

            await user.save();
        }

        return issueOtp(user, "OTP sent to your email for three day's reverify");
    }

    let refToken;

    if(user.refreshToken !== null) {
        if(user.refreshTokenExpires < new Date()) {
            refToken = await user.generateRefreshToken();
            
            user.refreshTokenExpires = new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString();
            user.refreshToken = refToken;
            
            await user.save();
            
            logger.info("Refresh token was expired, new one generated and saved.");
        } else {
            refToken = user.refreshToken;

            logger.info("Existing valid refresh token reused.");
        }
    } else {
        refToken = await user.generateRefreshToken();

        user.refreshTokenExpires = new Date(
           Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        user.refreshToken = refToken;

        await user.save();
        
        logger.info("No refresh token found, new one created.");
    }

    const accToken = await user.generateAccessToken();

    const sendUser = buildUserBrief(user);

    const res = {
        user: sendUser,
        accessToken: accToken,
        refreshToken: refToken,
        message: 'User login successfully'
    }

    // Best effort: a failed or slow SMTP host must not delay or fail the login.
    void sendWelcomeEmail(user.email, user.name);

    return res;
};

const verifyOtpService = async (email, code) => {
    const user = await User.findOne({ email }).populate("workshopId", "name code");

    if(!user) {
        throw new ApiError(401, "Invalid Credentials");
    }

    if(user.emailVerified && !user.needsVerification) {
        throw new ApiError(400, "Email already verified!, You have no need to verify!");
    }

    if(
      !user.verificationCodeExpires ||
      new Date() > user.verificationCodeExpires
    ) {
      user.verificationCode = null;
      user.verificationCodeExpires = null;

      await user.save();

      const result = {
        message: "Verification code has expired!"
      };

      return result;
    }

    if(user.verificationCode !== code) {
        throw new ApiError(400, "Invalid verification code");
    }

    let refToken;

    if(!user.emailVerified && user.needsVerification) {
        user.emailVerified = true;
        user.status = "ACTIVE";
        refToken = await user.generateRefreshToken();

        user.refreshTokenExpires = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        user.refreshToken = refToken;

        await user.save();   
        
        logger.info("New refresh token created");
    } else {
        if(user.refreshTokenExpires < new Date()) {
            refToken = await user.generateRefreshToken();
            
            user.refreshTokenExpires = new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString();
            user.refreshToken = refToken;
            
            await user.save();
            
            logger.info("Refresh token was expired, new one generated and saved.");
        } else {
            refToken = user.refreshToken;

            logger.info("Existing valid refresh token reused.");
        }
    }

    user.verificationCode = null;
    user.verificationCodeExpires = null;
    user.needsVerification = false;

    await user.save();

    if(user.threeDayExpires < new Date() && user.emailVerified) {
        user.threeDayExpires = new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000,
        ).toISOString();

        await user.save();
    }

    const accToken = await user.generateAccessToken();

    const sendUser = buildUserBrief(user);

    const result = {
      message: "Email verified!",
      user: sendUser,
      accessToken: accToken,
      refreshToken: refToken
    };

    // Best effort: the code is already verified, so never fail on email here.
    void sendWelcomeEmail(user.email, user.name);

    return result;
}


const refreshTokenService = async (providedToken) => {
  if (!providedToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let payload;

  try {
    payload = await verifyRefreshToken(providedToken);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(payload.id);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  if (user.status === "BLOCKED") {
    throw new ApiError(403, "Your account is blocked.");
  }

  if (!user.refreshToken || user.refreshToken !== providedToken) {
    user.refreshToken = null;
    user.refreshTokenExpires = null;
    await user.save();
    throw new ApiError(401, "Refresh token reuse detected. Please login again.");
  }

  if (!user.refreshTokenExpires || user.refreshTokenExpires < new Date()) {
    user.refreshToken = null;
    user.refreshTokenExpires = null;
    await user.save();
    throw new ApiError(401, "Refresh token expired. Please login again.");
  }

  const refToken = await user.generateRefreshToken();

  user.refreshToken = refToken;
  user.refreshTokenExpires = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();

  await user.save();

  logger.info(`Refresh token rotated for user: ${user._id}`);

  const accToken = await user.generateAccessToken();

  const sendUser = buildUserBrief(user);

  return {
    user: sendUser,
    accessToken: accToken,
    refreshToken: refToken,
  };
};

const logoutService = async (providedToken) => {
  if (!providedToken) {
    return { message: "Logged out successfully" };
  }

  try {
    const payload = await verifyRefreshToken(providedToken);
    const user = await User.findById(payload.id).populate("workshopId", "name code");

    if (user) {
      user.refreshToken = null;
      user.refreshTokenExpires = null;
      await user.save();
      logger.info(`User logged out: ${user._id}`);
    }
  } catch (error) {
    // best effort - clear session client side even if token is invalid/expired
  }

  return { message: "Logged out successfully" };
};


module.exports = {
    registerService,
    loginService,
    verifyOtpService,
    refreshTokenService,
    logoutService
}
