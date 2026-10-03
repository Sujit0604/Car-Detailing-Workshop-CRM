const nodemailer = require("nodemailer");
const { transporter, isSmtpConfigured } = require("../config/EmailConfig.js");
const env = require("../config/env.js");
const logger = require("./logger.js");

const APP_NAME = "KROM DETAIL";
const TAGLINE = "Premium Car Detailing Workshop.";

// Connection-level failures worth one more attempt; auth/address rejections are
// not, since retrying them just burns the timeouts again.
const TRANSIENT_CODES = new Set([
    "ETIMEDOUT",
    "ECONNRESET",
    "ECONNECTION",
    "ESOCKET",
    "EDNS",
    "EAI_AGAIN",
]);

const RETRY_DELAY_MS = 1000;

// Email must never take authentication down with it, so this never throws: it
// returns the nodemailer info on success and null when delivery failed.
// `attempts` exists because a caller sitting on the login critical path cannot
// afford two connection timeouts back to back.
const sendMail = async (options, attempts = 2) => {
    if (!isSmtpConfigured()) {
        logger.warn(
            `Email to ${options.to} skipped: SMTP is not configured.`
        );
        return null;
    }

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const info = await transporter.sendMail(options);

            logger.info(`Email sent to ${options.to} (${info.messageId}).`);

            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                logger.info(`Email preview URL: ${previewUrl}`);
            }

            return info;
        } catch (error) {
            logger.error(
                `Email to ${options.to} failed (attempt ${attempt}/${attempts}, ` +
                `${error.code || "UNKNOWN"}): ${error.message}`
            );

            if (attempt === attempts || !TRANSIENT_CODES.has(error.code)) {
                return null;
            }

            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }

    return null;
};

const baseHeader = () => `
    <tr>
        <td style="
            background: linear-gradient(135deg, #0f172a, #1e3a8a);
            padding: 35px 30px;
            text-align: center;
        ">
            <div style="
                display: inline-block;
                background-color: rgba(255,255,255,0.12);
                border: 1px solid rgba(255,255,255,0.18);
                padding: 10px 22px;
                border-radius: 30px;
            ">
                <span style="
                    color: #ffffff;
                    font-size: 22px;
                    font-weight: 700;
                    letter-spacing: 1px;
                ">
                    ${APP_NAME}
                </span>
            </div>

            <h1 style="
                color: #ffffff;
                font-size: 26px;
                margin: 25px 0 8px 0;
                font-weight: 700;
            ">
                {{>APP_TITLE}}
            </h1>

            <p style="
                color: #cbd5e1;
                font-size: 14px;
                margin: 0;
            ">
                {{>RESPOND_HEADER}}
            </p>
        </td>
    </tr>
`;

const baseFooter = () => `
    <tr>
        <td style="
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 25px 30px;
            text-align: center;
        ">
            <p style="
                margin: 0 0 8px 0;
                color: #334155;
                font-size: 14px;
                font-weight: 600;
            ">
                ${APP_NAME} Team
            </p>

            <p style="
                margin: 0 0 12px 0;
                color: #94a3b8;
                font-size: 12px;
            ">
                ${TAGLINE}
            </p>

            <p style="
                margin: 0;
                color: #cbd5e1;
                font-size: 11px;
            ">
                © ${new Date().getFullYear()} ${APP_NAME}.
                All rights reserved.
            </p>
        </td>
    </tr>
`;

const template = ({ title, respondHeader, content }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #f4f7fb;
    font-family: Arial, Helvetica, sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color: #f4f7fb; padding: 40px 15px;">

    <tr>
        <td align="center">

            <!-- Main Container -->
            <table width="600" cellpadding="0" cellspacing="0" border="0"
                style="
                    max-width: 600px;
                    width: 100%;
                    background-color: #ffffff;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
                ">

                ${baseHeader().replace("{{>APP_TITLE}}", title).replace("{{>RESPOND_HEADER}}", respondHeader)}

                <!-- Content -->
                <tr>
                    <td style="padding: 40px 35px;">
                        ${content}
                    </td>
                </tr>

                ${baseFooter()}

            </table>

        </td>
    </tr>

</table>

</body>
</html>
`;

const sendVerificationCode = async (email, verificationCode) => {
    return sendMail({
        from: `"${APP_NAME}" <${env.SMTP_USER}>`,
        to: email,
        subject: `Your ${APP_NAME} Verification Code`,

        text: `
Hello,

Welcome to ${APP_NAME}!

To complete your account verification, please use the verification code below:

${verificationCode}

This code is valid for ${env.OTP_EXPIRY_MINUTES} minutes.

If you did not create a ${APP_NAME} account, you can safely ignore this email.

Regards,
${APP_NAME} Team

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            `,

        html: template({
            title: `Verify Your ${APP_NAME} Account`,
            respondHeader: "One step away from getting started",
                content: `
                        <p style="
                            margin: 0 0 18px 0;
                            color: #334155;
                            font-size: 16px;
                        ">
                            Hello,
                        </p>

                        <p style="
                            margin: 0 0 25px 0;
                            color: #64748b;
                            font-size: 15px;
                            line-height: 1.7;
                        ">
                            Thank you for creating an account with
                            <strong style="color: #0f172a;">${APP_NAME}</strong>.
                            To verify your account, enter the verification code
                            below in the application.
                        </p>

                        <p style="
                            text-align: center;
                            color: #64748b;
                            font-size: 13px;
                            margin: 0 0 10px 0;
                            text-transform: uppercase;
                            letter-spacing: 1.5px;
                            font-weight: 600;
                        ">
                            Your Verification Code
                        </p>

                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td align="center">
                                    <div style="
                                        background-color: #f1f5f9;
                                        border: 1px solid #e2e8f0;
                                        border-radius: 12px;
                                        padding: 20px;
                                        margin: 5px 0 20px 0;
                                    ">
                                        <span style="
                                            font-size: 34px;
                                            font-weight: 700;
                                            letter-spacing: 10px;
                                            color: #1e3a8a;
                                            margin-left: 10px;
                                        ">
                                            ${verificationCode}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <table width="100%" cellpadding="0" cellspacing="0"
                            style="
                                background-color: #fff7ed;
                                border: 1px solid #fed7aa;
                                border-radius: 10px;
                                margin-bottom: 25px;
                            ">

                            <tr>
                                <td style="padding: 14px 16px;">
                                    <p style="
                                        margin: 0;
                                        color: #9a3412;
                                        font-size: 13px;
                                        line-height: 1.6;
                                    ">
                                        <strong>This code expires in
                                        ${env.OTP_EXPIRY_MINUTES} minutes.</strong>
                                        Please complete your verification before it expires.
                                    </p>
                                </td>
                            </tr>

                        </table>

                        <p style="
                            color: #64748b;
                            font-size: 13px;
                            line-height: 1.7;
                            margin: 0;
                        ">
                            <strong style="color: #334155;">
                                Didn't request this?
                            </strong>
                            <br>
                            If you did not create a ${APP_NAME} account, you can
                            safely ignore this email. Never share your verification
                            code with anyone.
                        </p>
                `,
        })
        // Single attempt: this mail is awaited on the login request, so it must
        // fail fast and let the caller return a clean 503.
    }, 1);
};

const sendWelcomeEmail = async (email, name) => {
    return sendMail({
        from: `"${APP_NAME}" <${env.SMTP_USER}>`,
        to: email,
        subject: `Welcome to ${APP_NAME}!`,

        text: `
Hello ${name},

Welcome to ${APP_NAME} - Premium Car Detailing Workshop.

Your account has been successfully verified. You can now book detailing
services and track your appointments.

Regards,
${APP_NAME} Team

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            `,

        html: template({
            title: `Welcome to ${APP_NAME}!`,
            respondHeader: "Your account is ready",
                content: `
                        <p style="
                            margin: 0 0 18px 0;
                            color: #334155;
                            font-size: 16px;
                        ">
                            Hello ${name},
                        </p>

                        <p style="
                            margin: 0 0 25px 0;
                            color: #64748b;
                            font-size: 15px;
                            line-height: 1.7;
                        ">
                            Welcome to
                            <strong style="color: #0f172a;">${APP_NAME}</strong>.
                            Your account has been successfully verified. You can
                            now book our premium car detailing services and track
                            your appointments all in one place.
                        </p>

                        <p style="
                            color: #64748b;
                            font-size: 13px;
                            line-height: 1.7;
                            margin: 0;
                        ">
                            Thank you for choosing
                            <strong style="color: #334155;">${APP_NAME}</strong>.
                        </p>
                `,
        })
    });
};

module.exports = {
    sendVerificationCode,
    sendWelcomeEmail,
};
