const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    ownerType: {
      type: String,
      enum: ["VEHICLE", "JOB", "INSPECTION", "REVIEW", "USER", "WORKSHOP"],
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
    resourceType: {
      type: String,
      enum: ["IMAGE", "VIDEO", "DOCUMENT"],
      default: "IMAGE",
    },
    category: {
      type: String,
      enum: ["VEHICLE", "BEFORE", "AFTER", "DAMAGE", "INSPECTION", "INVOICE", "PROFILE"],
      default: "VEHICLE",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

mediaSchema.index({ ownerType: 1, ownerId: 1 });
mediaSchema.index({ uploadedBy: 1 });

const Media = mongoose.model("Media", mediaSchema);

module.exports = Media;