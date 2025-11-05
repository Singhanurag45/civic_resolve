import { model, Schema } from "mongoose";
import { VALID_DEPARTMENTS } from "../utils/departments";

const AdminSchema = new Schema(
  {
    fullName: { type: String, required: true },
    password: {
      type: String,
      required: [true],
      min: [8],
    },
    email: { type: String, required: true, lowercase: true },
    phonenumber: {
      type: String,
      required: [true],
    },
    department: {
      type: String,
      required: true,
      enum: [...VALID_DEPARTMENTS],
      message: "Department must be one of: MCD, PWD, Traffic, Water Supply, Electricity",
    },
    adminAccessCode: { type: Number, required: true, unique: true },
  },
  { timestamps: true }
);

export const AdminModel = model("Admin", AdminSchema);
