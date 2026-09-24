const { v4: uuidv4 } = require("uuid");
const ApiError = require("../utils/ApiError.js");
const logger = require("../utils/logger.js");
const Booking = require("../models/Booking.js");
const Vehicle = require("../models/Vehicle.js");
const Workshop = require("../models/Workshop.js");
const Service = require("../models/Service.js");
const Coupon = require("../models/Coupon.js");

const TAX_RATE_PERCENT = 18;

const generateBookingNumber = () => {
  return `BKG-${new Date().getFullYear()}-${uuidv4().split("-")[0].toUpperCase()}`;
};

const BOOKING_STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED", "NO_SHOW"],
  CONFIRMED: ["VEHICLE_RECEIVED", "CANCELLED", "NO_SHOW"],
  VEHICLE_RECEIVED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const validateStatusTransition = (currentStatus, nextStatus) => {
  const allowed = BOOKING_STATUS_TRANSITIONS[currentStatus];

  if (!allowed.includes(nextStatus)) {
    throw new ApiError(
      400,
      `Invalid status transition from ${currentStatus} to ${nextStatus}`,
    );
  }
};

const validateCoupon = async (couponCode, subtotal, workshopId, serviceIds) => {
  if (!couponCode) return { discount: 0, couponId: null };

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

  if (!coupon) {
    throw new ApiError(404, "Invalid coupon code");
  }

  if (coupon.status !== "ACTIVE") {
    throw new ApiError(400, "This coupon is not active");
  }

  const now = new Date();

  if (coupon.validFrom > now || coupon.validUntil < now) {
    throw new ApiError(400, "This coupon has expired");
  }

  if (
    coupon.usageLimit > 0 &&
    coupon.usageCount >= coupon.usageLimit
  ) {
    throw new ApiError(400, "This coupon has reached its usage limit");
  }

  if (subtotal < coupon.minimumOrderValue) {
    throw new ApiError(
      400,
      `Minimum order value of ${coupon.minimumOrderValue} required for this coupon`,
    );
  }

  if (
    coupon.applicableWorkshops.length > 0 &&
    !coupon.applicableWorkshops.some((id) => id.toString() === workshopId.toString())
  ) {
    throw new ApiError(400, "This coupon is not applicable to the selected workshop");
  }

  if (
    coupon.applicableServices.length > 0 &&
    !serviceIds.some((id) => coupon.applicableServices.some((couponId) => couponId.toString() === id.toString()))
  ) {
    throw new ApiError(400, "This coupon is not applicable to the selected services");
  }

  let discount = 0;

  if (coupon.discountType === "PERCENTAGE") {
    discount = (subtotal * coupon.discountValue) / 100;
  } else {
    discount = coupon.discountValue;
  }

  if (coupon.maximumDiscount > 0) {
    discount = Math.min(discount, coupon.maximumDiscount);
  }

  discount = Math.min(discount, subtotal);

  return { discount: Math.round(discount * 100) / 100, couponId: coupon._id };
};

const resolveBookingServices = async (serviceRequests, workshopId) => {
  const serviceIds = serviceRequests.map((s) => s.serviceId);
  const services = await Service.find({
    _id: { $in: serviceIds },
    workshopId,
    isActive: true,
  });

  if (services.length !== serviceRequests.length) {
    throw new ApiError(400, "One or more services are invalid or not available at this workshop");
  }

  const serviceMap = new Map(services.map((s) => [s._id.toString(), s]));

  return {
    items: serviceRequests.map((req) => {
      const service = serviceMap.get(req.serviceId.toString());
      const quantity = req.quantity;
      const unitPrice = service.basePrice;

      return {
        serviceId: service._id,
        serviceName: service.name,
        quantity,
        unitPrice,
        estimatedPrice: Math.round(unitPrice * quantity * 100) / 100,
        durationMinutes: service.estimatedDurationMinutes * quantity,
      };
    }),
    serviceIds: serviceIds.map((id) => id.toString()),
  };
};

const checkSlotCapacity = async (workshopId, appointment) => {
  const workshop = await Workshop.findById(workshopId);

  const { date, startTime } = appointment;
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedCount = await Booking.countDocuments({
    workshopId,
    status: { $nin: ["CANCELLED", "NO_SHOW"] },
    "appointment.date": { $gte: startOfDay, $lte: endOfDay },
    "appointment.startTime": startTime,
  });

  if (bookedCount >= workshop.maxBookingsPerSlot) {
    throw new ApiError(
      400,
      "This time slot is full. Please choose a different time slot",
    );
  }
};

const createBookingService = async (userId, bookingData) => {
  const { vehicleId, workshopId, appointment, services, couponCode, customerNotes } = bookingData;

  const vehicle = await Vehicle.findOne({ _id: vehicleId, ownerId: userId, status: "ACTIVE" });

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found or does not belong to you");
  }

  const workshop = await Workshop.findOne({ _id: workshopId, status: "ACTIVE" });

  if (!workshop) {
    throw new ApiError(404, "Workshop not found or not active");
  }

  await checkSlotCapacity(workshopId, appointment);

  const { items, serviceIds } = await resolveBookingServices(services, workshopId);

  const subtotal = Math.round(items.reduce((sum, item) => sum + item.estimatedPrice, 0) * 100) / 100;

  const { discount, couponId } = await validateCoupon(couponCode, subtotal, workshopId, serviceIds);

  const taxableAmount = subtotal - discount;
  const tax = Math.round(taxableAmount * (TAX_RATE_PERCENT / 100) * 100) / 100;
  const total = Math.round((taxableAmount + tax) * 100) / 100;

  const booking = await Booking.create({
    bookingNumber: generateBookingNumber(),
    customerId: userId,
    vehicleId,
    workshopId,
    appointment,
    services: items,
    couponId,
    pricing: {
      subtotal,
      discount,
      tax,
      total,
    },
    customerNotes,
    status: "PENDING",
    paymentStatus: "PENDING",
  });

  if (couponId) {
    await Coupon.updateOne({ _id: couponId }, { $inc: { usageCount: 1 } });
  }

  logger.info(`Booking created: ${booking.bookingNumber}`);

  return booking;
};

const getBookingByIdService = async (bookingId, user) => {
  const booking = await Booking.findById(bookingId)
    .populate("customerId", "name email phone")
    .populate("vehicleId", "registrationNumber make model color images")
    .populate("workshopId", "name code address")
    .populate("services.serviceId", "name slug")
    .populate("couponId", "code description discountType discountValue maximumDiscount minimumOrderValue")
    .populate("cancellation.cancelledBy", "name email role");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const isStaff = user.role !== "CUSTOMER";

  if (!isStaff && booking.customerId.toString() !== user._id.toString()) {
    throw new ApiError(403, "You don't have permission to access this booking");
  }

  return booking;
};

const listBookingsService = async (user, query, workshopId) => {
  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    fromDate,
    toDate,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (user.role === "CUSTOMER") {
    filter.customerId = user._id;
  }

  if (workshopId) {
    filter.workshopId = workshopId;
  }

  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  if (fromDate || toDate) {
    const dateFilter = {};
    if (fromDate) dateFilter.$gte = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
    if (toDate) dateFilter.$lte = new Date(new Date(toDate).setHours(23, 59, 59, 999));
    filter["appointment.date"] = dateFilter;
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("customerId", "name email phone")
      .populate("vehicleId", "registrationNumber make model")
      .populate("workshopId", "name code")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateBookingStatusService = async (bookingId, status, reason, user) => {
  const booking = await getBookingByIdService(bookingId, user);

  validateStatusTransition(booking.status, status);

  if (status === "CANCELLED" || status === "NO_SHOW") {
    booking.cancellation = {
      cancelledBy: user._id,
      reason: reason || "Cancelled",
      cancelledAt: new Date(),
    };
  }

  booking.status = status;

  await booking.save();

  logger.info(`Booking ${booking.bookingNumber} status -> ${status}`);

  return booking;
};

const updatePaymentStatusService = async (bookingId, paymentStatus, user) => {
  const booking = await getBookingByIdService(bookingId, user);

  booking.paymentStatus = paymentStatus;

  await booking.save();

  logger.info(`Booking ${booking.bookingNumber} paymentStatus -> ${paymentStatus}`);

  return booking;
};

const cancelBookingService = async (bookingId, reason, user) => {
  return updateBookingStatusService(bookingId, "CANCELLED", reason || "Cancelled by user", user);
};

module.exports = {
  createBookingService,
  getBookingByIdService,
  listBookingsService,
  updateBookingStatusService,
  updatePaymentStatusService,
  cancelBookingService,
};