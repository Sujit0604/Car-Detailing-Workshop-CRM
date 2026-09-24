const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const authorize = require("../middleware/role.middleware.js");
const validate = require("../middleware/validation.middleware.js");
const logger = require("../utils/logger.js");
const {
  getStats,
  listUsers,
  createStaffUser,
  updateUserStatus,
  updateUserRole,
  updateUserWorkshop,
  listAllBookings,
  listAllJobs,
} = require("../controllers/admin.controller.js");
const {
  listUsersQuerySchema,
  userIdParamSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  updateUserWorkshopSchema,
  createStaffUserSchema,
} = require("../validators/admin.validator.js");
const {
  listBookingsQuerySchema,
} = require("../validators/booking.validator.js");
const {
  listJobsQuerySchema,
} = require("../validators/job.validator.js");

const adminRouter = express.Router();

adminRouter.use(authMiddleware, authorize("ADMIN"));

const logRoute = (routeName) => (req, res, next) => {
  logger.info(`[Admin Router] ${req.method} ${req.originalUrl} - Executing ${routeName}`);
  next();
};

adminRouter.get(
  "/stats",
  logRoute("Stats"),
  getStats
);

adminRouter.get(
  "/users",
  validate(listUsersQuerySchema),
  logRoute("ListUsers"),
  listUsers
);

adminRouter.post(
  "/users",
  validate(createStaffUserSchema),
  logRoute("CreateStaff"),
  createStaffUser
);

adminRouter.patch(
  "/users/:id/status",
  validate(updateUserStatusSchema),
  logRoute("UpdateUserStatus"),
  updateUserStatus
);

adminRouter.patch(
  "/users/:id/role",
  validate(updateUserRoleSchema),
  logRoute("UpdateUserRole"),
  updateUserRole
);

adminRouter.patch(
  "/users/:id/workshop",
  validate(updateUserWorkshopSchema),
  logRoute("UpdateUserWorkshop"),
  updateUserWorkshop
);

adminRouter.get(
  "/bookings",
  validate(listBookingsQuerySchema),
  logRoute("ListAllBookings"),
  listAllBookings
);

adminRouter.get(
  "/jobs",
  validate(listJobsQuerySchema),
  logRoute("ListAllJobs"),
  listAllJobs
);

module.exports = adminRouter;