"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentModel = void 0;
const mongoose_1 = require("mongoose");
const departments_1 = require("../utils/departments");
const DepartmentSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: [...departments_1.VALID_DEPARTMENTS],
        message: "Department must be one of: MCD, PWD, Traffic, Water Supply, Electricity",
    },
    accessCode: {
        type: String,
        required: true,
        unique: true,
        minlength: 8,
        maxlength: 8,
    },
}, { timestamps: true });
exports.DepartmentModel = (0, mongoose_1.model)("Department", DepartmentSchema);
