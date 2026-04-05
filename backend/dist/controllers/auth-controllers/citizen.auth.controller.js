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
exports.citizenSignin = exports.citizenSignup = exports.verifyCitizenSignupOtp = exports.requestCitizenSignupOtp = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const citizen_model_1 = require("../../models/citizen.model");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const pendingCitizenSignup_model_1 = require("../../models/pendingCitizenSignup.model");
const brevo_1 = require("../../utils/brevo");
const signupSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, { message: "Full name is required" }).trim(),
    password: zod_1.z
        .string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    })
        .trim(),
    email: zod_1.z.string().email({ message: "Invalid email format" }).trim(),
    phonenumber: zod_1.z
        .string()
        .length(10, { message: "Phone number must be exactly 10 digits" }),
});
const verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Invalid email format" }).trim(),
    otp: zod_1.z.string().regex(/^\d{6}$/, { message: "OTP must be a 6-digit code" }),
});
const generateOtp = () => crypto_1.default.randomInt(100000, 1000000).toString();
const otpExpiryMinutes = Number(process.env.CITIZEN_SIGNUP_OTP_EXPIRY_MINUTES || "10");
const requestCitizenSignupOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedData = signupSchema.parse(req.body);
        const { fullName, password, email, phonenumber } = parsedData;
        const existingCitizen = yield citizen_model_1.CitizenModel.findOne({ email });
        if (existingCitizen) {
            res.status(400).json({ message: "Citizen already exists" });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const otp = generateOtp();
        const otpHash = yield bcryptjs_1.default.hash(otp, 10);
        const otpExpiresAt = new Date(Date.now() + otpExpiryMinutes * 60 * 1000);
        yield pendingCitizenSignup_model_1.PendingCitizenSignupModel.findOneAndUpdate({ email }, {
            fullName,
            email,
            phonenumber,
            password: hashedPassword,
            otpHash,
            otpExpiresAt,
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
        yield (0, brevo_1.sendCitizenSignupOtpEmail)({
            otp,
            recipientEmail: email,
            recipientName: fullName,
        });
        res.status(200).json({
            message: `OTP sent to ${email}`,
            expiresInMinutes: otpExpiryMinutes,
        });
    }
    catch (err) {
        if (err.name === "ZodError") {
            res.status(400).json({
                message: "Validation failed",
                errors: err.errors,
            });
            return;
        }
        console.error("Error sending citizen signup OTP:", err);
        res.status(500).json({
            message: "Unable to send OTP right now. Please try again.",
        });
    }
});
exports.requestCitizenSignupOtp = requestCitizenSignupOtp;
const verifyCitizenSignupOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = verifyOtpSchema.parse(req.body);
        const pendingSignup = yield pendingCitizenSignup_model_1.PendingCitizenSignupModel.findOne({ email });
        if (!pendingSignup) {
            res.status(400).json({
                message: "No pending signup found for this email. Request a new OTP.",
            });
            return;
        }
        if (pendingSignup.otpExpiresAt.getTime() < Date.now()) {
            yield pendingCitizenSignup_model_1.PendingCitizenSignupModel.deleteOne({ _id: pendingSignup._id });
            res.status(400).json({
                message: "OTP has expired. Please request a new one.",
            });
            return;
        }
        const isOtpValid = yield bcryptjs_1.default.compare(otp, pendingSignup.otpHash);
        if (!isOtpValid) {
            res.status(400).json({ message: "Invalid OTP" });
            return;
        }
        const existingCitizen = yield citizen_model_1.CitizenModel.findOne({ email });
        if (existingCitizen) {
            yield pendingCitizenSignup_model_1.PendingCitizenSignupModel.deleteOne({ _id: pendingSignup._id });
            res.status(400).json({ message: "Citizen already exists" });
            return;
        }
        yield citizen_model_1.CitizenModel.create({
            fullName: pendingSignup.fullName,
            password: pendingSignup.password,
            email: pendingSignup.email,
            phonenumber: pendingSignup.phonenumber,
        });
        yield pendingCitizenSignup_model_1.PendingCitizenSignupModel.deleteOne({ _id: pendingSignup._id });
        try {
            yield (0, brevo_1.sendCitizenWelcomeEmail)({
                recipientEmail: pendingSignup.email,
                recipientName: pendingSignup.fullName,
            });
        }
        catch (emailError) {
            console.error("Failed to send citizen welcome email:", emailError);
        }
        console.log("Citizen created after OTP verification");
        res.status(201).json({ message: "Citizen signed up successfully" });
    }
    catch (err) {
        if (err.name === "ZodError") {
            res.status(400).json({
                message: "Validation failed",
                errors: err.errors,
            });
            return;
        }
        console.error("Error verifying citizen signup OTP:", err);
        res.status(500).json({
            message: "Unable to verify OTP right now. Please try again.",
        });
    }
});
exports.verifyCitizenSignupOtp = verifyCitizenSignupOtp;
const citizenSignup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = verifyOtpSchema.parse(req.body);
        req.body = { email, otp };
        yield (0, exports.verifyCitizenSignupOtp)(req, res);
    }
    catch (err) {
        if (err.name === "ZodError") {
            res.status(400).json({
                message: "Validation failed",
                errors: err.errors,
            });
            return;
        }
        console.error("Error in citizen signup:", err);
        res.status(500).json({
            message: "Unable to complete signup right now. Please try again.",
        });
    }
});
exports.citizenSignup = citizenSignup;
const citizenSignin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const existingCitizen = yield citizen_model_1.CitizenModel.findOne({ email });
        if (!existingCitizen) {
            res.status(400).json({ message: "Invalid email or password" });
            return;
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, existingCitizen.password);
        if (!isPasswordValid) {
            res.status(400).json({ message: "Invalid email or password" });
            return;
        }
        console.log("My JWT Secret is:", process.env.JWT_PASSWORD);
        const token = jsonwebtoken_1.default.sign({
            id: existingCitizen._id,
            role: "citizen",
        }, process.env.JWT_PASSWORD, { expiresIn: "1d" });
        res.json({
            token,
            user: {
                id: existingCitizen._id,
                fullName: existingCitizen.fullName,
                email: existingCitizen.email,
                phonenumber: existingCitizen.phonenumber,
                role: "citizen",
            },
        });
        console.log("Citizen signed in!");
    }
    catch (error) {
        console.error("Error during citizen signin:", error);
        res.status(500).json({
            message: "Internal Server Error during signin",
        });
    }
});
exports.citizenSignin = citizenSignin;
