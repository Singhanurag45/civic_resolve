import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { CitizenModel } from "../../models/citizen.model";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { PendingCitizenSignupModel } from "../../models/pendingCitizenSignup.model";
import {
  sendCitizenSignupOtpEmail,
  sendCitizenWelcomeEmail,
} from "../../utils/brevo";

const signupSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required" }).trim(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      {
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      }
    )
    .trim(),
  email: z.string().email({ message: "Invalid email format" }).trim(),
  phonenumber: z
    .string()
    .length(10, { message: "Phone number must be exactly 10 digits" }),
});

const verifyOtpSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }).trim(),
  otp: z.string().regex(/^\d{6}$/, { message: "OTP must be a 6-digit code" }),
});

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const otpExpiryMinutes = Number(
  process.env.CITIZEN_SIGNUP_OTP_EXPIRY_MINUTES || "10"
);

export const requestCitizenSignupOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parsedData = signupSchema.parse(req.body);
    const { fullName, password, email, phonenumber } = parsedData;

    const existingCitizen = await CitizenModel.findOne({ email });
    if (existingCitizen) {
      res.status(400).json({ message: "Citizen already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + otpExpiryMinutes * 60 * 1000);

    await PendingCitizenSignupModel.findOneAndUpdate(
      { email },
      {
        fullName,
        email,
        phonenumber,
        password: hashedPassword,
        otpHash,
        otpExpiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendCitizenSignupOtpEmail({
      otp,
      recipientEmail: email,
      recipientName: fullName,
    });

    res.status(200).json({
      message: `OTP sent to ${email}`,
      expiresInMinutes: otpExpiryMinutes,
    });
  } catch (err: any) {
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
};

export const verifyCitizenSignupOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);

    const pendingSignup = await PendingCitizenSignupModel.findOne({ email });
    if (!pendingSignup) {
      res.status(400).json({
        message: "No pending signup found for this email. Request a new OTP.",
      });
      return;
    }

    if (pendingSignup.otpExpiresAt.getTime() < Date.now()) {
      await PendingCitizenSignupModel.deleteOne({ _id: pendingSignup._id });
      res.status(400).json({
        message: "OTP has expired. Please request a new one.",
      });
      return;
    }

    const isOtpValid = await bcrypt.compare(otp, pendingSignup.otpHash);
    if (!isOtpValid) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }

    const existingCitizen = await CitizenModel.findOne({ email });
    if (existingCitizen) {
      await PendingCitizenSignupModel.deleteOne({ _id: pendingSignup._id });
      res.status(400).json({ message: "Citizen already exists" });
      return;
    }

    await CitizenModel.create({
      fullName: pendingSignup.fullName,
      password: pendingSignup.password,
      email: pendingSignup.email,
      phonenumber: pendingSignup.phonenumber,
    });

    await PendingCitizenSignupModel.deleteOne({ _id: pendingSignup._id });

    try {
      await sendCitizenWelcomeEmail({
        recipientEmail: pendingSignup.email,
        recipientName: pendingSignup.fullName,
      });
    } catch (emailError) {
      console.error("Failed to send citizen welcome email:", emailError);
    }

    console.log("Citizen created after OTP verification");
    res.status(201).json({ message: "Citizen signed up successfully" });
  } catch (err: any) {
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
};

export const citizenSignup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);
    req.body = { email, otp };
    await verifyCitizenSignupOtp(req, res);
  } catch (err: any) {
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
};

export const citizenSignin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const existingCitizen = await CitizenModel.findOne({ email });

    if (!existingCitizen) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingCitizen.password as string
    );
    if (!isPasswordValid) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }
    console.log("My JWT Secret is:", process.env.JWT_PASSWORD);
    
    const token = jwt.sign(
      {
        id: existingCitizen._id,
        role: "citizen",
      },
      process.env.JWT_PASSWORD!,
      { expiresIn: "1d" }
    );
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
  } catch (error) {
    console.error("Error during citizen signin:", error);
    res.status(500).json({
      message: "Internal Server Error during signin",
    });
  }
};
