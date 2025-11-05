/**
 * Valid departments for the Civic Issue Reporter system
 * This should match the backend VALID_DEPARTMENTS
 */
export const DEPARTMENTS = [
  "MCD",
  "PWD",
  "Traffic",
  "Water Supply",
  "Electricity",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

