const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const upload = require("../middleware/upload.middleware.js");
const logger = require("../utils/logger.js");
const {
  createReview,
  listPublishedReviews,
  listReviews,
  listMyReviews,
  getReviewById,
  addReviewImage,
  removeReviewImage,
  respondToReview,
  moderateReview,
} = require("../controllers/review.controller.js");
const {
  createReviewSchema,
  reviewIdParamSchema,
  listPublishedReviewsQuerySchema,
  listReviewsQuerySchema,
  respondToReviewSchema,
  moderateReviewSchema,
} = require("../validators/review.validator.js");

const reviewRouter = express.Router();

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Review Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

reviewRouter.get(
  "/published",
  validate(listPublishedReviewsQuerySchema),
  logRoute("ListPublished"),
  listPublishedReviews,
);

reviewRouter.use(authMiddleware);

reviewRouter.post(
  "/",
  authorize("CUSTOMER"),
  validate(createReviewSchema),
  logRoute("Create"),
  createReview,
);

reviewRouter.get(
  "/mine",
  validate(listReviewsQuerySchema),
  logRoute("ListMine"),
  listMyReviews,
);

reviewRouter.get(
  "/",
  validate(listReviewsQuerySchema),
  logRoute("List"),
  listReviews,
);

reviewRouter.get(
  "/:id",
  validate(reviewIdParamSchema),
  logRoute("GetById"),
  getReviewById,
);

reviewRouter.post(
  "/:id/images",
  authorize("CUSTOMER", "ADMIN"),
  validate(reviewIdParamSchema),
  upload.single("image"),
  logRoute("AddImage"),
  addReviewImage
);

reviewRouter.delete(
  "/:id/images",
  authorize("CUSTOMER", "ADMIN"),
  validate(reviewIdParamSchema),
  logRoute("RemoveImage"),
  removeReviewImage
);

reviewRouter.patch(
  "/:id/response",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"),
  validate(respondToReviewSchema),
  logRoute("Respond"),
  respondToReview,
);

reviewRouter.patch(
  "/:id/moderate",
  authorize("ADMIN"),
  validate(moderateReviewSchema),
  logRoute("Moderate"),
  moderateReview,
);

module.exports = reviewRouter;
