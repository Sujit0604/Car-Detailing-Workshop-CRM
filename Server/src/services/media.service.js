const fs = require("fs/promises");
const ApiError = require("../utils/ApiError.js");
const logger = require("../utils/logger.js");
const Media = require("../models/Media.js");
const Job = require("../models/Job.js");
const Mechanic = require("../models/Mechanic.js");
const { uploadToBoth } = require("./storage/storage.service.js");
const cloudinaryStorage = require("./storage/cloudinary.storage.js");
const localStorage = require("./storage/local.storage.js");

const MEDIA_CATEGORIES = ["VEHICLE", "BEFORE", "AFTER", "DAMAGE", "INSPECTION", "INVOICE", "PROFILE"];

const getMyMechanic = async (userId) => {
  return Mechanic.findOne({ userId, status: { $ne: "INACTIVE" } });
};

const canViewJobMedia = async (job, user) => {
  if (user.role === "ADMIN" || user.role === "WORKSHOP_MANAGER" || user.role === "SERVICE_ADVISOR") {
    return true;
  }

  if (user.role === "CUSTOMER") {
    return job.customerId.toString() === user._id.toString();
  }

  if (user.role === "MECHANIC") {
    const mechanic = await getMyMechanic(user._id);
    if (!mechanic) return false;
    return (
      job.workshopId.toString() === mechanic.workshopId.toString() ||
      (job.assignedMechanicId && job.assignedMechanicId.toString() === mechanic._id.toString())
    );
  }

  return false;
};

const uploadJobMediaService = async (jobId, file, category, user) => {
  if (!MEDIA_CATEGORIES.includes(category)) {
    throw new ApiError(422, `Invalid media category. Allowed: ${MEDIA_CATEGORIES.join(", ")}`);
  }

  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const isStaff =
    user.role === "ADMIN" || user.role === "WORKSHOP_MANAGER" || user.role === "SERVICE_ADVISOR";

  if (!isStaff) {
    const mechanic = await getMyMechanic(user._id);
    const isAssigned =
      mechanic && job.assignedMechanicId && job.assignedMechanicId.toString() === mechanic._id.toString();

    if (!isAssigned) {
      throw new ApiError(403, "Only the assigned mechanic or workshop staff can upload job photos");
    }
  }

  const stored = await uploadToBoth({ file, userId: user._id });

  const media = await Media.create({
    ownerType: "JOB",
    ownerId: job._id,
    url: stored.cloudinary.url,
    publicId: stored.cloudinary.publicId,
    resourceType: stored.cloudinary.resourceType === "raw" ? "DOCUMENT" : "IMAGE",
    category,
    uploadedBy: user._id,
  });

  logger.info(`Job media uploaded: ${media._id} (job ${job.jobNumber}, ${category})`);

  return media;
};

const listJobMediaService = async (jobId, user) => {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const allowed = await canViewJobMedia(job, user);

  if (!allowed) {
    throw new ApiError(403, "You don't have permission to view this job's photos");
  }

  const media = await Media.find({ ownerType: "JOB", ownerId: job._id }).sort({ createdAt: -1 });

  return media;
};

const deleteMediaService = async (mediaId, user) => {
  const media = await Media.findById(mediaId);

  if (!media) {
    throw new ApiError(404, "Media not found");
  }

  const isOwner = media.uploadedBy.toString() === user._id.toString();
  const isPrivileged = ["ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR"].includes(user.role);

  if (!isOwner && !isPrivileged) {
    throw new ApiError(403, "You don't have permission to delete this photo");
  }

  try {
    await cloudinaryStorage.deleteFile(media.publicId, media.publicId ? "image" : undefined);
  } catch (err) {
    logger.warn(`Cloudinary delete failed for ${media.publicId}: ${err.message}`);
  }

  await Media.deleteOne({ _id: media._id });

  logger.info(`Media deleted: ${media._id}`);

  return { _id: media._id };
};

const removeTempFile = async (file) => {
  if (!file?.path) return;
  try {
    await fs.unlink(file.path);
  } catch (err) {
    if (err.code !== "ENOENT") {
      logger.warn(`Temp file cleanup failed: ${err.message}`);
    }
  }
};

module.exports = {
  MEDIA_CATEGORIES,
  uploadJobMediaService,
  listJobMediaService,
  deleteMediaService,
  removeTempFile,
};
