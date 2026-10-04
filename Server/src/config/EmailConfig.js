const nodemailer = require("nodemailer");
const env = require("./env.js");
const logger = require("../utils/logger.js");

// Mail leaves through one of two transports, and the choice is not a detail:
// SMTP needs a raw TCP connection to port 25/465/587, which many hosts refuse.
// Render's free web services drop all three, so an SMTP-only setup fails there
// with a bare ETIMEDOUT before any SMTP dialogue even starts. Resend rides on
// 443 and works everywhere, so it is the production path; SMTP stays because it
// is the only one that needs no third-party account locally.
// MAIL_PROVIDER pins one; "auto" prefers Resend when its key is set.
const PROVIDER = {
    RESEND: "resend",
    SMTP: "smtp",
};

// Port 465 uses implicit TLS, 587 upgrades via STARTTLS.
const port = Number(env.SMTP_PORT) || 587;
const secure = env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465;
const smtpHost = env.SMTP_HOST || "smtp.gmail.com";

const fromAddress = env.MAIL_FROM || env.SMTP_USER || "";
const fromName = env.MAIL_FROM_NAME || "";
const fromHeader = fromName ? `"${fromName}" <${fromAddress}>` : fromAddress;

const resendReady = Boolean(env.RESEND_API_KEY);
const smtpReady = Boolean(env.SMTP_USER && env.SMTP_PASS);

// Resend delivers from an address on a domain verified inside the Resend
// dashboard, so the sender domain is not a cosmetic choice and cannot be worked
// around: the one exception is the shared onboarding sender, which Resend
// restricts to the account's own inbox. These constants exist to turn that
// constraint into a log line the reader can act on.
const RESEND_TEST_FROM = "onboarding@resend.dev";
const RESEND_DOMAIN_HINT =
    `Either verify a domain at resend.com/domains and set MAIL_FROM to an address on ` +
    `it, or set MAIL_FROM=${RESEND_TEST_FROM} to test delivery to the Resend ` +
    "account's own inbox only.";
const PLACEHOLDER_DOMAINS = ["example.com", "example.org", "example.net"];

const resolveProvider = () => {
    const requested = String(env.MAIL_PROVIDER || "auto").trim().toLowerCase();

    if (requested === PROVIDER.SMTP) return PROVIDER.SMTP;

    return resendReady ? PROVIDER.RESEND : PROVIDER.SMTP;
};

const provider = resolveProvider();

// Short timeouts on purpose: the nodemailer default of 120s connectionTimeout
// lets a dead host stall the request until the upstream proxy gives up first.
const smtpTransport = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure,
    requireTLS: port === 587,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
});

const HTTP_TIMEOUT_MS = 10000;
const RETRY_DELAY_MS = 1000;

// After one unreachable transport there is no point paying another timeout per
// login for the same blocked route, so the provider is parked for a cooldown and
// every later send fails fast with a single warning instead.
const EGRESS_COOLDOWN_MS = 10 * 60 * 1000;
let egressBlockedUntil = 0;

const TRANSIENT_CODES = new Set([
    "ETIMEDOUT",
    "ECONNRESET",
    "ECONNREFUSED",
    "ECONNECTION",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "ESOCKET",
    "EPIPE",
    "EDNS",
    "EAI_AGAIN",
]);

// No HTTP response at all means the route itself is gone (blocked port, DNS,
// firewall). An HTTP error status is the provider talking back, so it must not
// park the transport.
const isNetworkError = (error) =>
    TRANSIENT_CODES.has(error.code) || Boolean(error.code === undefined && error.cause);

const isRetryable = (error) =>
    typeof error.retryable === "boolean"
        ? error.retryable
        : TRANSIENT_CODES.has(error.code);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const httpError = (message, { code, retryable, status }) => {
    const error = new Error(message);
    error.code = code;
    error.retryable = retryable;
    if (status) error.status = status;
    return error;
};

const postJson = async (url, headers, body) => {
    let response;

    try {
        response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
        });
    } catch (error) {
        throw httpError(
            `${url} unreachable: ${error.message}`,
            { code: error.code || "EHOSTUNREACH", retryable: true }
        );
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw httpError(
            payload.message || payload.error || `HTTP ${response.status} from ${url}`,
            {
                code: "EHTTPSEND",
                // 4xx is a bad key or a bad sender address, which retrying cannot
                // fix; 5xx is the provider having a bad minute.
                retryable: response.status >= 500,
                status: response.status,
            }
        );
    }

    return payload;
};

const sendViaSmtp = async (mail) => {
    const info = await smtpTransport.sendMail({
        from: fromHeader,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
    });

    return { messageId: info.messageId };
};

const sendViaResend = async (mail) => {
    let payload;

    try {
        payload = await postJson(
            "https://api.resend.com/emails",
            { Authorization: `Bearer ${env.RESEND_API_KEY}` },
            {
                from: fromHeader,
                to: [mail.to],
                subject: mail.subject,
                text: mail.text,
                html: mail.html,
            }
        );
    } catch (error) {
        // Resend reports both a missing domain and an unverified one as a bare
        // 403, so the API text alone leaves the reader guessing which it is.
        if (error.status === 403) {
            error.message = `${error.message}. ${RESEND_DOMAIN_HINT}`;
        }

        throw error;
    }

    return { messageId: payload.id || "unknown" };
};

const senders = {
    [PROVIDER.RESEND]: sendViaResend,
    [PROVIDER.SMTP]: sendViaSmtp,
};

const isMailConfigured = () =>
    provider === PROVIDER.SMTP ? smtpReady : resendReady;

// Email must never take authentication down with it, so this never throws: it
// returns the provider's info on success and null when delivery failed.
// `attempts` exists because a caller sitting on the login critical path cannot
// afford two connection timeouts back to back.
const deliver = async (mail, attempts = 2) => {
    if (!isMailConfigured()) {
        logger.warn(
            `Email to ${mail.to} skipped: ${provider} is not configured. ` +
            "Set RESEND_API_KEY for resend, or SMTP_USER/SMTP_PASS for smtp."
        );
        return null;
    }

    if (Date.now() < egressBlockedUntil) {
        logger.warn(
            `Email to ${mail.to} skipped: no route to ${provider}. ` +
            "Free Render instances block outbound SMTP, so use MAIL_PROVIDER=resend " +
            "with RESEND_API_KEY there."
        );
        return null;
    }

    const send = senders[provider];

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const info = await send(mail);

            logger.info(`Email sent to ${mail.to} via ${provider} (${info.messageId}).`);

            return info;
        } catch (error) {
            logger.error(
                `Email to ${mail.to} failed (attempt ${attempt}/${attempts}, ` +
                `${error.code || "UNKNOWN"}): ${error.message}`
            );

            if (isNetworkError(error)) {
                egressBlockedUntil = Date.now() + EGRESS_COOLDOWN_MS;

                logger.error(
                    `No route to ${provider}, pausing mail for ${EGRESS_COOLDOWN_MS / 60000} minutes. ` +
                    "A blocked egress port looks exactly like this."
                );
            }

            if (attempt === attempts || !isRetryable(error)) {
                return null;
            }

            await sleep(RETRY_DELAY_MS);
        }
    }

    return null;
};

// Non-fatal startup probe so a misconfigured transport shows up in the logs at
// boot instead of on the first user login. SMTP gets a real handshake; Resend is
// only checked for a usable sender, because its auth probes need broader API
// scopes than a sending key has.
const verifyMailDelivery = async () => {
    if (!isMailConfigured()) {
        logger.warn(
            `${provider} is not configured. Email delivery is disabled.`
        );
        return false;
    }

    if (!fromAddress) {
        logger.warn("MAIL_FROM is not set. Email delivery is disabled.");
        return false;
    }

    if (provider === PROVIDER.RESEND) {
        // example.com is the documentation placeholder, not a deliverable
        // sender, and Resend has no way to verify it.
        if (PLACEHOLDER_DOMAINS.some((domain) => fromAddress.endsWith(`@${domain}`))) {
            logger.error(
                `MAIL_FROM is still the placeholder ${fromAddress}, which Resend cannot ` +
                `verify. ${RESEND_DOMAIN_HINT}`
            );
            return false;
        }

        logger.info(
            `Mail transport configured (Resend over HTTPS, sender ${fromHeader}). ` +
            "The key and the domain are only exercised on the first send."
        );
        return true;
    }

    try {
        await smtpTransport.verify();
        logger.info(`SMTP connection verified (${smtpHost}:${port}).`);
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
    deliver,
    isMailConfigured,
    verifyMailDelivery,
    PROVIDER,
    provider,
};