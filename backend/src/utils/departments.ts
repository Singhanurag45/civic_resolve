/**
 * Valid departments for the Civic Issue Reporter system
 */
export const VALID_DEPARTMENTS = [
  "MCD",
  "PWD",
  "Traffic",
  "Water Supply",
  "Electricity",
] as const;

export type Department = (typeof VALID_DEPARTMENTS)[number];

/**
 * Validates if a string is a valid department
 * @param department - The department string to validate
 * @returns true if valid, false otherwise
 */
export const isValidDepartment = (
  department: string
): department is Department => {
  return VALID_DEPARTMENTS.includes(department as Department);
};

/**
 * Gets all valid departments as an array of strings
 * @returns Array of department names
 */
export const getDepartments = (): string[] => {
  return [...VALID_DEPARTMENTS];
};

