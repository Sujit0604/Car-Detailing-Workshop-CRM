const mongoose = require("mongoose");

const mechanicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
    },
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    specialization: {
      type: [
        {
          type: String,
          enum: [
            "ENGINE",
            "BRAKES",
            "ELECTRICAL",
            "AC",
            "BODY",
            "PAINT",
            "DETAILING",
            "TYRE",
            "GENERAL",
          ],
        },
      ],
      default: ["GENERAL"],
    },
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ON_LEAVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

mechanicSchema.index({ workshopId: 1 });
mechanicSchema.index({ employeeCode: 1 });

const Mechanic = mongoose.model("Mechanic", mechanicSchema);

module.exports = Mechanic;