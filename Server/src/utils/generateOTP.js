const crypto = require("crypto");

const generateOTP = (length = Number(process.env.OTP_LENGTH) || 6) => {
    const digit = "0123456789";
    let otp = "";
    
    while (otp.length < length) {
        const randomIndex = crypto.randomInt(0, digit.length);
        otp += digit[randomIndex]; 
    }
    
    return otp;
};

module.exports = { generateOTP };
