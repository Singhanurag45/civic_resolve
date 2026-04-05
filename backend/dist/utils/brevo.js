"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendIssueSubmissionSuccessEmail = exports.sendCitizenWelcomeEmail = exports.sendCitizenSignupOtpEmail = exports.sendTransactionalEmail = void 0;
const https_1 = __importDefault(require("https"));
const brevoRequest = (body) => new Promise((resolve, reject) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        reject(new Error("BREVO_API_KEY is not configured"));
        return;
    }
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    if (!senderEmail) {
        reject(new Error("BREVO_SENDER_EMAIL is not configured"));
        return;
    }
    const request = https_1.default.request("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
            "api-key": apiKey,
            Accept: "application/json",
        },
    }, (response) => {
        let responseBody = "";
        response.on("data", (chunk) => {
            responseBody += chunk;
        });
        response.on("end", () => {
            if (response.statusCode &&
                response.statusCode >= 200 &&
                response.statusCode < 300) {
                resolve();
                return;
            }
            reject(new Error(`Brevo email request failed with status ${response.statusCode}: ${responseBody}`));
        });
    });
    request.on("error", reject);
    request.write(body);
    request.end();
});
const sendTransactionalEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ recipientEmail, recipientName, subject, htmlContent, }) {
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || "CivicResolve";
    const payload = JSON.stringify({
        sender: {
            email: senderEmail,
            name: senderName,
        },
        to: [
            {
                email: recipientEmail,
                name: recipientName,
            },
        ],
        subject,
        htmlContent,
    });
    yield brevoRequest(payload);
});
exports.sendTransactionalEmail = sendTransactionalEmail;
const sendCitizenSignupOtpEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ otp, recipientEmail, recipientName, }) {
    const otpExpiryMinutes = Number(process.env.CITIZEN_SIGNUP_OTP_EXPIRY_MINUTES || "10");
    yield (0, exports.sendTransactionalEmail)({
        recipientEmail,
        recipientName,
        subject: "Your CivicResolve signup OTP",
        htmlContent: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Verify your email</h2>
        <p>Hello ${recipientName},</p>
        <p>Your CivicResolve one-time password is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${otp}</p>
        <p>This OTP expires in ${otpExpiryMinutes} minutes.</p>
        <p>If you did not request this signup, you can safely ignore this email.</p>
      </div>
    `,
    });
});
exports.sendCitizenSignupOtpEmail = sendCitizenSignupOtpEmail;
const sendCitizenWelcomeEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ recipientEmail, recipientName, }) {
    yield (0, exports.sendTransactionalEmail)({
        recipientEmail,
        recipientName,
        subject: "Welcome to CivicResolve",
        htmlContent: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Registration successful</h2>
        <p>Hello ${recipientName},</p>
        <p>Your CivicResolve account has been created successfully.</p>
        <p>You can now sign in and start reporting civic issues in your area.</p>
        <p>Thanks for helping build a better community.</p>
      </div>
    `,
    });
});
exports.sendCitizenWelcomeEmail = sendCitizenWelcomeEmail;
const sendIssueSubmissionSuccessEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ recipientEmail, recipientName, issueId, title, department, status, address, }) {
    yield (0, exports.sendTransactionalEmail)({
        recipientEmail,
        recipientName,
        subject: `Issue submitted successfully: ${issueId}`,
        htmlContent: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Issue submitted successfully</h2>
        <p>Hello ${recipientName},</p>
        <p>Your issue has been recorded in CivicResolve.</p>
        <p><strong>Issue ID:</strong> ${issueId}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Department:</strong> ${department}</p>
        <p><strong>Status:</strong> ${status}</p>
        ${address
            ? `<p><strong>Location:</strong> ${address}</p>`
            : ""}
        <p>We will keep working on it through the platform.</p>
      </div>
    `,
    });
});
exports.sendIssueSubmissionSuccessEmail = sendIssueSubmissionSuccessEmail;
