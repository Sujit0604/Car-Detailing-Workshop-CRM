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
app.use("/api/v1/jobs", jobRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    })
})

app.use(errorHandler);

module.exports = app;
