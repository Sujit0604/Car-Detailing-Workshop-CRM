const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/jwt.js");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        default: "other"
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [
        "CUSTOMER",

        "ADMIN",

        "WORKSHOP_MANAGER",

        "SERVICE_ADVISOR",

        "MECHANIC",
      ],
      default: "CUSTOMER",
    },
    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      default: null
    },
    status: {
        type: String,
        enum: [
            "ACTIVE",

            "INACTIVE",

            "BLOCKED",

            "PENDING_VERIFICATION"
        ],
        default: "PENDING_VERIFICATION",
    },
    needsVerification: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    profileImage: {
        type: String,
        default: "https://imgs.search.brave.com/PfUH5aHdppw945pAdoyjSAr4rRsYtHdKC1c5PbUszU0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbmcu/cG5ndHJlZS5jb20v/cG5nLXZlY3Rvci8y/MDI2MDMzMC9vdXJt/aWQvcG5ndHJlZS1k/ZWZhdWx0LXVzZXIt/YXZhdGFyLWluLXNp/bXBsZS1zdHlsZS12/ZWN0b3ItcG5nLWlt/YWdlXzE5MDIxODU3/LndlYnA",
    },
    lastLoginAt: Date,
    refreshToken: {
        type: String,
        default: null
    },
    refreshTokenExpires: {
      type: Date,
      default: null
    },
    verificationCode: {
        type: String,
        default: null
    },
    verificationCodeExpires: {
        type: Date,
        default: null
    },
    threeDayExpires: {
      type: Date,
      default: null
    }
    
  },
  {
    timestamps: true,
  },
);

userSchema.index({ workshopId: 1 });

// password before save - hash
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = process.env.BCRYPT_SALT_ROUNDS || 12;

  this.password = await bcrypt.hash(this.password, Number(salt));
});

userSchema.methods.comparePassword = async function (password) {
  console.log(this.password);
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return generateAccessToken({
    id: this._id,
    email: this.email,
    role: this.role,
  });
};

userSchema.methods.generateRefreshToken = function () {
  return generateRefreshToken({
    id: this._id,
  });
};

const User = mongoose.model("User", userSchema);

module.exports = User;
