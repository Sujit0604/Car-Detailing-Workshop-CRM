const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      default: "PERCENTAGE",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maximumDiscount: {
      type: Number,
      min: 0,
    },
    minimumOrderValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    usageLimit: {
      type: Number,
      min: 0,
      default: 0,
    },
    usageCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      min: 0,
      default: 1,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    applicableServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    applicableWorkshops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workshop",
      },
    ],
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "EXPIRED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ status: 1, validFrom: 1, validUntil: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;