"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDepartments = exports.isValidDepartment = exports.VALID_DEPARTMENTS = void 0;
/**
 * Valid departments for the Civic Issue Reporter system
 */
exports.VALID_DEPARTMENTS = [
    "MCD",
    "PWD",
    "Traffic",
    "Water Supply",
    "Electricity",
];
/**
 * Validates if a string is a valid department
 * @param department - The department string to validate
 * @returns true if valid, false otherwise
 */
const isValidDepartment = (department) => {
    return exports.VALID_DEPARTMENTS.includes(department);
};
exports.isValidDepartment = isValidDepartment;
/**
 * Gets all valid departments as an array of strings
 * @returns Array of department names
 */
const getDepartments = () => {
    return [...exports.VALID_DEPARTMENTS];
};
exports.getDepartments = getDepartments;
