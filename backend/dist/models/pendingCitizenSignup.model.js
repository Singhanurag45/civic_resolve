"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendingCitizenSignupModel = void 0;
const mongoose_1 = require("mongoose");
const PendingCitizenSignupSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    phonenumber: { type: String, required: true },
    password: { type: String, required: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
}, { timestamps: true });
exports.PendingCitizenSignupModel = (0, mongoose_1.model)("PendingCitizenSignup", PendingCitizenSignupSchema);
