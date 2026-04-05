import { Schema, model } from "mongoose";

const PendingCitizenSignupSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    phonenumber: { type: String, required: true },
    password: { type: String, required: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const PendingCitizenSignupModel = model(
  "PendingCitizenSignup",
  PendingCitizenSignupSchema
);
