const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError.js");
const logger = require("../utils/logger.js");
const Booking = require("../models/Booking.js");
const Review = require("../models/Review.js");
const { uploadToBoth } = require("./storage/storage.service.js");
const cloudinaryStorage = require("./storage/cloudinary.storage.js");

const STAFF_ROLES = ["WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"];
const REVIEW_STATUSES = ["PUBLISHED", "HIDDEN", "FLAGGED"];
const MAX_REVIEW_IMAGES = 5;
const sameId = (first, second) => Boolean(first && second && first.toString() === second.toString());

const assertReviewImageAccess = (review, user) => {
  if (user.role === "ADMIN") return;

  if (user.role !== "CUSTOMER" || !sameId(review.customerId, user._id)) {
    throw new ApiError(403, "You can only manage photos on your own review");
  }
};

const assertWorkshopReviewAccess = (user, workshopId) => {
  if (user.role === "ADMIN") return;

  if (!STAFF_ROLES.includes(user.role)) {
    throw new ApiError(403, "You don't have permission to access reviews for this workshop");
  }

  if (!user.workshopId || !sameId(user.workshopId, workshopId)) {
    throw new ApiError(403, "This review does not belong to your workshop");
  }
};

const populateReview = (query, includeModeration = false) => {
  const populated = query
    .populate("customerId", "name")
    .populate("vehicleId", "registrationNumber make model")
    .populate("workshopId", "name code")
    .populate("response.respondedBy", "name role");

  if (includeModeration) {
    populated.populate("moderation.moderatedBy", "name role");
  }

  return populated;
};

const toSafeReview = (review, includeModeration) => {
  if (includeModeration) return review;

  const data = typeof review.toObject === "function" ? review.toObject() : { ...review };
  delete data.moderation;
  return data;
};

const paginateReviews = async (filter, query = {}, includeModeration = false) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  const [reviewDocuments, total] = await Promise.all([
    populateReview(Review.find(filter), includeModeration)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return {
    reviews: reviewDocuments.map((review) => toSafeReview(review, includeModeration)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const createReviewService = async (payload, user) => {
  if (user.role !== "CUSTOMER") {
    throw new ApiError(403, "Only customers can create reviews");
  }

  const booking = await Booking.findById(payload.bookingId);

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (!sameId(booking.customerId, user._id)) {
    throw new ApiError(403, "You can only review your own bookings");
  }

  if (booking.status !== "COMPLETED") {
    throw new ApiError(400, "Reviews can only be created for completed bookings");
  }

  if (booking.paymentStatus !== "PAID") {
    throw new ApiError(400, "The booking must be paid before it can be reviewed");
  }

  const existingReview = await Review.findOne({ bookingId: booking._id }).select("_id").lean();

  if (existingReview) {
    throw new ApiError(409, "A review already exists for this booking");
  }

  try {
    const review = await Review.create({
      customerId: booking.customerId,
      bookingId: booking._id,
      vehicleId: booking.vehicleId,
      workshopId: booking.workshopId,
      rating: payload.rating,
      title: payload.title?.trim(),
      comment: payload.comment?.trim(),
      images: payload.images || [],
      status: "PUBLISHED",
    });

    return await getReviewByIdService(review._id, user);
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "A review already exists for this booking");
    }

    throw error;
  }
};

const listPublishedReviewsService = async (query = {}) => {
  const filter = { status: "PUBLISHED" };

  if (query.workshopId) filter.workshopId = query.workshopId;
  if (query.rating) filter.rating = query.rating;

  return paginateReviews(filter, query);
};

const listReviewsService = async (user, query = {}) => {
  const filter = {};

  if (user.role === "CUSTOMER") {
    filter.status = "PUBLISHED";
    if (query.workshopId) filter.workshopId = query.workshopId;
  } else if (user.role === "ADMIN") {
    if (query.workshopId) filter.workshopId = query.workshopId;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.status) filter.status = query.status;
  } else {
    if (!user.workshopId) {
      throw new ApiError(403, "Your account is not assigned to a workshop");
    }

    filter.workshopId = user.workshopId;
    if (query.status) filter.status = query.status;
  }

  if (query.rating) filter.rating = query.rating;

  return paginateReviews(filter, query, user.role !== "CUSTOMER");
};

const listMyReviewsService = async (user, query = {}) => {
  const filter = { customerId: user._id };

  if (query.status) filter.status = query.status;

  return paginateReviews(filter, query, true);
};

const getReviewByIdService = async (reviewId, user) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ApiError(404, "Review not found");
  }

  const includeModeration = user.role !== "CUSTOMER";
  const review = await populateReview(Review.findById(reviewId), includeModeration).lean();

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  if (user.role === "CUSTOMER") {
    if (review.status !== "PUBLISHED") {
      throw new ApiError(404, "Review not found");
    }
  } else {
    const workshopId = review.workshopId?._id || review.workshopId;
    assertWorkshopReviewAccess(user, workshopId);
  }

  return toSafeReview(review, includeModeration);
};

const addReviewImageService = async (reviewId, file, user) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ApiError(404, "Review not found");
  }

  if (!file) {
    throw new ApiError(422, "An image file is required");
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  assertReviewImageAccess(review, user);

  if ((review.images || []).length >= MAX_REVIEW_IMAGES) {
    throw new ApiError(400, `A review can have at most ${MAX_REVIEW_IMAGES} photos`);
  }

  const stored = await uploadToBoth({ file, userId: user._id });

  review.images.push({
    url: stored.cloudinary.url,
    publicId: stored.cloudinary.publicId,
  });

  await review.save();

  logger.info(`Review image added: ${review._id}`);

  return populateReview(Review.findById(review._id), true).lean();
};

const removeReviewImageService = async (reviewId, publicId, user) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ApiError(404, "Review not found");
  }

  if (!publicId) {
    throw new ApiError(422, "publicId query param is required");
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  assertReviewImageAccess(review, user);

  const image = (review.images || []).find((img) => img.publicId === publicId);

  if (!image) {
    throw new ApiError(404, "Image not found on this review");
  }

  review.images = review.images.filter((img) => img.publicId !== publicId);

  await review.save();

  if (image.publicId) {
    try {
      await cloudinaryStorage.deleteFile(image.publicId, "image");
    } catch (err) {
      logger.warn(`Cloudinary delete failed for ${image.publicId}: ${err.message}`);
    }
  }

  logger.info(`Review image removed: ${review._id}`);

  return populateReview(Review.findById(review._id), true).lean();
};

const respondToReviewService = async (reviewId, payload, user) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ApiError(404, "Review not found");
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  assertWorkshopReviewAccess(user, review.workshopId);

  review.response = {
    message: payload.message.trim(),
    respondedBy: user._id,
    respondedAt: new Date(),
  };
  await review.save();

  return populateReview(Review.findById(review._id), true).lean();
};

const moderateReviewService = async (reviewId, payload, user) => {
  if (user.role !== "ADMIN") {
    throw new ApiError(403, "Administrator access is required");
  }

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ApiError(404, "Review not found");
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  review.status = payload.status;
  review.moderation = {
    moderatedBy: user._id,
    moderatedAt: new Date(),
    reason: payload.reason?.trim() || undefined,
  };
  await review.save();

  return populateReview(Review.findById(review._id), true).lean();
};

module.exports = {
  REVIEW_STATUSES,
  MAX_REVIEW_IMAGES,
  createReviewService,
  listPublishedReviewsService,
  listReviewsService,
  listMyReviewsService,
  getReviewByIdService,
  addReviewImageService,
  removeReviewImageService,
  respondToReviewService,
  moderateReviewService,
};
