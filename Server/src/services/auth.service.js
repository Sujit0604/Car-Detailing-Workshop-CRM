const ApiError = require("../utils/ApiError.js");
const User = require("../models/User.js");
const { generateOTP } = require("../utils/generateOTP.js");
const { sendVerificationCode, sendWelcomeEmail } = require("../utils/Email.js");
const logger = require("../utils/logger.js");


const registerService = async (name, email, password, gender, phone, role) => {
    const existingUser = await User.findOne({
        $or: [{ email }, { phone }]
    }).select("-password");

    if (existingUser) {
        new ApiError(400, "User already exist!");
    }

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

    const sendUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const result = {
        user: sendUser,
        // accessToken: accToken,
        // refreshToken: refToken
    }

    return result;
};

const loginService = async (email, password) => {
    const user = await User.findOne({ email }).select("+password");

    if(!user) {
        throw new ApiError(401, "Invalid Credentials");
    }

    const isMatch = await user.comparePassword(password);

    if(!isMatch) {
        throw new ApiError(401, "Invalid Credentials");
    }

    if(user.needsVerification && !user.emailVerified) {
        const verificationCode = await generateOTP();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.verificationCode = verificationCode;
        user.verificationCodeExpires = verificationCodeExpires;  

        await user.save();

        await sendVerificationCode(user.email, verificationCode);
        
        const result = {
            message: 'OTP sent to your email. You should verify email for first time login.'
        }

        return result;
    }

    if(user.threeDayExpires < new Date() && user.emailVerified) {
        if(!user.needsVerification) {
            user.needsVerification = true;

            await user.save();
        }

        const verificationCode = await generateOTP();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.verificationCode = verificationCode;
        user.verificationCodeExpires = verificationCodeExpires;  

        await user.save();

        await sendVerificationCode(user.email, verificationCode);
        
        const result = {
            message: "OTP sent to your email for three day's reverify"
        }

        return result;
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

    const sendUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    const res = {
        user: sendUser,
        accessToken: accToken,
        refreshToken: refToken,
        message: 'User login successfully'
    }

    await sendWelcomeEmail(user.email, user.name);

    return res;
};

const verifyOtpService = async (email, code) => {
    const user = await User.findOne({ email });

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

    const sendUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    const result = {
      message: "Email verified!",
      user: sendUser,
      accessToken: accToken,
      refreshToken: refToken
    };

    await sendWelcomeEmail(user.email, user.name);

    return result;
}


module.exports = {
    registerService,
    loginService,
    verifyOtpService
}
