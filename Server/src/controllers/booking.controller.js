const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  createBookingService,
  getBookingByIdService,
  listBookingsService,
  updateBookingStatusService,
  updatePaymentStatusService,
  cancelBookingService,
} = require("../services/booking.service.js");

const createBooking = asyncHandler(async (req, res) => {
  const booking = await createBookingService(req.user._id, req.body);

  return sendResponse(res, 201, "Booking created successfully", booking);
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await getBookingByIdService(req.params.id, req.user);

  return sendResponse(res, 200, "Booking fetched successfully", booking);
});

const listMyBookings = asyncHandler(async (req, res) => {
  const result = await listBookingsService(req.user, req.query);

  return sendResponse(res, 200, "Bookings fetched successfully", result);
});

const listWorkshopBookings = asyncHandler(async (req, res) => {
  const { workshopId } = req.params;

  const result = await listBookingsService(req.user, req.query, workshopId);

  return sendResponse(res, 200, "Workshop bookings fetched successfully", result);
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const booking = await updateBookingStatusService(id, status, reason, req.user);

  return sendResponse(res, 200, "Booking status updated successfully", booking);
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  const booking = await updatePaymentStatusService(id, paymentStatus, req.user);

  return sendResponse(res, 200, "Payment status updated successfully", booking);
});

const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const booking = await cancelBookingService(id, reason, req.user);

  return sendResponse(res, 200, "Booking cancelled successfully", booking);
});

module.exports = {
  createBooking,
  getBookingById,
  listMyBookings,
  listWorkshopBookings,
  updateBookingStatus,
  updatePaymentStatus,
  cancelBooking,
};