import { model, Schema } from "mongoose";
import { VALID_DEPARTMENTS } from "../utils/departments";

const DepartmentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: [...VALID_DEPARTMENTS],
      message: "Department must be one of: MCD, PWD, Traffic, Water Supply, Electricity",
    },
    accessCode: {
      type: String,
      required: true,
      unique: true,
      minlength: 8,
      maxlength: 8,
    },
  },
  { timestamps: true }
);

export const DepartmentModel = model("Department", DepartmentSchema);
