/**
 * Machine-readable error codes with which the backend rejects Profiles requests.
 */
export const PROFILES_ERROR_CODES = [
  'VALIDATION_ERROR',
  'ACCESS_DENIED',
  'OWNER_NOT_FOUND',
  'TECHNICIAN_NOT_FOUND',
  'DASHBOARD_CONFIG_NOT_FOUND',
  'DASHBOARD_CARD_NOT_FOUND',
  'DASHBOARD_CONFIG_CONFLICT',
] as const;

export type ProfilesErrorCode = (typeof PROFILES_ERROR_CODES)[number];

/**
 * Checks whether a value is a confirmed Profiles error code.
 * @param value - The value to check.
 * @returns True when the value is a ProfilesErrorCode.
 */
export function isProfilesErrorCode(value: unknown): value is ProfilesErrorCode {
  return PROFILES_ERROR_CODES.some((code) => code === value);
}

/**
 * ProfilesError means the backend definitively rejected a Profiles request (any 4xx answer). Errors of
 * any other type (network failures, server errors) are transient.
 */
export class ProfilesError extends Error {
  override name = 'ProfilesError';

  /**
   * @param code - The confirmed error code, or null when the backend returned an unrecognized one.
   * @param message - A fixed technical description for diagnostics; it never contains backend text.
   */
  constructor(
    readonly code: ProfilesErrorCode | null,
    message: string,
  ) {
    super(message);
  }
}

/**
 * The outcome of a failed Profiles operation as the stores expose it: the confirmed error code, or
 * `UNEXPECTED` for transient failures and unrecognized rejections.
 */
export type ProfilesFailure = ProfilesErrorCode | 'UNEXPECTED';

/**
 * Resolves the failure of a Profiles operation from its error.
 * @param error - The error of the operation.
 * @returns The confirmed error code, or `UNEXPECTED`.
 */
export function toProfilesFailure(error: unknown): ProfilesFailure {
  return error instanceof ProfilesError && error.code !== null ? error.code : 'UNEXPECTED';
}
