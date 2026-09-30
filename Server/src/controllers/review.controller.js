const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const { removeTempFile } = require("../services/media.service.js");
const {
  createReviewService,
  listPublishedReviewsService,
  listReviewsService,
  listMyReviewsService,
  getReviewByIdService,
  addReviewImageService,
  removeReviewImageService,
  respondToReviewService,
  moderateReviewService,
} = require("../services/review.service.js");

const createReview = asyncHandler(async (req, res) => {
  const review = await createReviewService(req.body, req.user);
  return sendResponse(res, 201, "Review created successfully", review);
});

const listPublishedReviews = asyncHandler(async (req, res) => {
  const result = await listPublishedReviewsService(req.query);
  return sendResponse(res, 200, "Published reviews fetched successfully", result);
});

const listReviews = asyncHandler(async (req, res) => {
  const result = await listReviewsService(req.user, req.query);
  return sendResponse(res, 200, "Reviews fetched successfully", result);
});

const listMyReviews = asyncHandler(async (req, res) => {
  const result = await listMyReviewsService(req.user, req.query);
  return sendResponse(res, 200, "Reviews fetched successfully", result);
});

const getReviewById = asyncHandler(async (req, res) => {
  const review = await getReviewByIdService(req.params.id, req.user);
  return sendResponse(res, 200, "Review fetched successfully", review);
});

const addReviewImage = asyncHandler(async (req, res) => {
  try {
    const review = await addReviewImageService(req.params.id, req.file, req.user);

    return sendResponse(res, 201, "Review photo added successfully", review);
  } finally {
    await removeTempFile(req.file);
  }
});

const removeReviewImage = asyncHandler(async (req, res) => {
  const review = await removeReviewImageService(req.params.id, req.query.publicId, req.user);

  return sendResponse(res, 200, "Review photo removed successfully", review);
});

const respondToReview = asyncHandler(async (req, res) => {
  const review = await respondToReviewService(req.params.id, req.body, req.user);
  return sendResponse(res, 200, "Review response updated successfully", review);
});

const moderateReview = asyncHandler(async (req, res) => {
  const review = await moderateReviewService(req.params.id, req.body, req.user);
  return sendResponse(res, 200, "Review moderated successfully", review);
});

module.exports = {
  createReview,
  listPublishedReviews,
  listReviews,
  listMyReviews,
  getReviewById,
  addReviewImage,
  removeReviewImage,
  respondToReview,
  moderateReview,
};
