/**
 * Role enum represents the different roles that a user can have in the system.
 */
export enum Role {
  OWNER_ROLE = 'OWNER_ROLE',
  TECHNICIAN_ROLE = 'TECHNICIAN_ROLE',
}

/**
 * Checks whether a value is one of the confirmed roles.
 * @param value - The value to check.
 * @returns True when the value is a Role.
 */
export function isRole(value: unknown): value is Role {
  return Object.values(Role).some((role) => role === value);
}
