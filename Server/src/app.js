const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const morgan = require("morgan");

const env = require("./config/env.js");
// const authRouter = require("./routes/auth.routes.js");
// const userRouter = require("./routes/user.routes.js");
// const { apiLimiter } = require("./middlewares/rateLimiter.js");
// const errorHandler = require("./middlewares/error.middleware.js");

const app = express();
app.use(helmet()); // security

app.use(
    cors({
        origin: env.CLIENT_URL,
        credentials: true,
    })
);

// app.use(apiLimiter);
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

// For example :- /api/v1/auth/register
// app.use("/api/v1/auth", authRouter);
// app.use("/api/v1/users", userRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    })
})

// app.use(errorHandler);

module.exports = app;
