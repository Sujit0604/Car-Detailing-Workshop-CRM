const mongoose = require("mongoose");

const workshopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
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
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    openingHours: [
      {
        day: {
          type: String,
          enum: [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
          ],
        },
        open: { type: String, trim: true },
        close: { type: String, trim: true },
        isClosed: { type: Boolean, default: false },
      },
    ],
    slotDurationMinutes: {
      type: Number,
      default: 30,
      min: 5,
    },
    maxBookingsPerSlot: {
      type: Number,
      default: 1,
      min: 1,
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "TEMPORARILY_CLOSED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

workshopSchema.index({ location: "2dsphere" });
workshopSchema.index({ code: 1 });

const Workshop = mongoose.model("Workshop", workshopSchema);

module.exports = Workshop;