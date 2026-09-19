const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  createBooking,
  getBookingById,
  listMyBookings,
  listWorkshopBookings,
  updateBookingStatus,
  updatePaymentStatus,
  cancelBooking,
} = require("../controllers/booking.controller.js");
const {
  createBookingSchema,
  bookingIdParamSchema,
  workshopIdParamSchema,
  updateBookingStatusSchema,
  updatePaymentStatusSchema,
  cancelBookingSchema,
  listBookingsQuerySchema,
} = require("../validators/booking.validator.js");

const bookingRouter = express.Router();

bookingRouter.use(authMiddleware);

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Booking Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

bookingRouter.post(
  "/",
  authorize("CUSTOMER", "ADMIN"),
  validate(createBookingSchema),
  logRoute("Create"),
  createBooking
);

bookingRouter.get(
  "/mine",
  authorize("CUSTOMER", "ADMIN"),
  validate(listBookingsQuerySchema),
  logRoute("ListMy"),
  listMyBookings
);

bookingRouter.get(
  "/workshop/:workshopId",
  authorize("WORKSHOP_MANAGER", "SERVICE_ADVISOR", "ADMIN"),
  validate(workshopIdParamSchema),
  validate(listBookingsQuerySchema),
  logRoute("ListWorkshop"),
  listWorkshopBookings
);

bookingRouter.get(
  "/:id",
  authorize("CUSTOMER", "ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR"),
  validate(bookingIdParamSchema),
  logRoute("GetById"),
  getBookingById
);

bookingRouter.patch(
  "/:id/status",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR"),
  validate(updateBookingStatusSchema),
  logRoute("UpdateStatus"),
  updateBookingStatus
);

bookingRouter.patch(
  "/:id/payment-status",
  authorize("ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR"),
  validate(updatePaymentStatusSchema),
  logRoute("UpdatePaymentStatus"),
  updatePaymentStatus
);

bookingRouter.post(
  "/:id/cancel",
  authorize("CUSTOMER", "ADMIN", "WORKSHOP_MANAGER", "SERVICE_ADVISOR"),
  validate(cancelBookingSchema),
  logRoute("Cancel"),
  cancelBooking
);

module.exports = bookingRouter;