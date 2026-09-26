const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const morgan = require("morgan");
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const env = require("./config/env.js");
const authRouter = require("./routes/auth.routes.js");
const vehicleRouter = require("./routes/vehicle.routes.js");
const bookingRouter = require("./routes/booking.routes.js");
const jobRouter = require("./routes/job.routes.js");
const workshopRouter = require("./routes/workshop.routes.js");
const serviceRouter = require("./routes/service.routes.js");
const serviceCategoryRouter = require("./routes/serviceCategory.routes.js");
const adminRouter = require("./routes/admin.routes.js");
const { mediaRouter } = require("./routes/media.routes.js");
const inventoryRouter = require("./routes/inventory.routes.js");
const mechanicRouter = require("./routes/mechanic.routes.js");
const inspectionRouter = require("./routes/inspection.routes.js");
const jobTaskRouter = require("./routes/jobTask.routes.js");
const jobPartRouter = require("./routes/jobPart.routes.js");
const notificationRouter = require("./routes/notification.routes.js");
const invoiceRouter = require("./routes/invoice.routes.js");
const { paymentRouter, paymentWebhookRouter } = require("./routes/payment.routes.js");
const reviewRouter = require("./routes/review.routes.js");
const auditRouter = require("./routes/audit.routes.js");
const { apiLimiter } = require("./middleware/rateLimiter.js");
const errorHandler = require("./middleware/error.middleware.js");

const app = express();

app.use(helmet()); // security

app.use((req, res, next) => {
  Object.defineProperty(req, 'query', {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});   
app.use(mongoSanitize());
app.use(hpp());

app.use(
    // cors({
    //     origin: env.CLIENT_URL,
    //     credentials: true,
    // })
    cors()
);

app.use(apiLimiter);

// Razorpay signs the untouched request payload, so its webhook router must run
// before express.json() consumes the body.
app.use("/api/v1/payments", paymentWebhookRouter);

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(compression());

if(env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.get("/", (req, res) => {
    res.send("Authentication API running");
});

/* For example :- /api/v1/auth/register */

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/vehicles", vehicleRouter);
app.use("/api/v1/bookings", bookingRouter);
// Job-scoped sub-resources must be registered before the job router so that
// /jobs/:jobId/tasks and /jobs/:jobId/parts are not swallowed by /jobs/:id.
app.use("/api/v1/jobs/:jobId/tasks", jobTaskRouter);
app.use("/api/v1/jobs/:jobId/parts", jobPartRouter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/inspections", inspectionRouter);
app.use("/api/v1/workshops", workshopRouter);
app.use("/api/v1/services", serviceRouter);
app.use("/api/v1/service-categories", serviceCategoryRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/media", mediaRouter);
app.use("/api/v1/inventory", inventoryRouter);
app.use("/api/v1/mechanics", mechanicRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/audit-logs", auditRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    })
})

app.use(errorHandler);

module.exports = app;
