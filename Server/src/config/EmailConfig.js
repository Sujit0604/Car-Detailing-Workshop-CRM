const nodemailer = require("nodemailer");
const env = require("./env.js");
const logger = require("../utils/logger.js");

// Port 465 uses implicit TLS, 587 upgrades via STARTTLS.
const port = Number(env.SMTP_PORT) || 587;
const secure = env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465;

// Short timeouts on purpose: the default 120s connectionTimeout lets a dead SMTP
// host stall the request until the upstream proxy gives up first.
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure,
    requireTLS: port === 587,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
    family: 4,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
});

const isSmtpConfigured = () => Boolean(env.SMTP_USER && env.SMTP_PASS);

// Non-fatal startup probe so SMTP misconfiguration shows up in the logs at boot
// instead of on the first user login.
const verifySmtpConnection = async () => {
    if (!isSmtpConfigured()) {
        logger.warn(
            "SMTP_USER/SMTP_PASS are not set. Email delivery is disabled."
        );
        return false;
    }

    try {
        await transporter.verify();
        logger.info(`SMTP connection verified (${transporter.options.host}:${port}).`);
        return true;
    } catch (error) {
        logger.error(
            `SMTP verification failed (${error.code || "UNKNOWN"}): ${error.message}. ` +
            "Email delivery is degraded, the API stays up."
        );
        return false;
    }
};

module.exports = {
    transporter,
    isSmtpConfigured,
    verifySmtpConnection,
};
