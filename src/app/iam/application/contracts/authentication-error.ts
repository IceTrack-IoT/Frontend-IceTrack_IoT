/**
 * Machine-readable authentication error codes confirmed by the backend contract.
 */
export const AUTHENTICATION_ERROR_CODES = [
  'GOOGLE_ACCOUNT_NOT_FOUND',
  'REFRESH_TOKEN_RECENTLY_ROTATED',
  'REFRESH_TOKEN_REPLAY_DETECTED',
  'REFRESH_TOKEN_EXPIRED',
  'REFRESH_TOKEN_REVOKED',
  'REFRESH_TOKEN_INVALID',
] as const;

export type AuthenticationErrorCode = (typeof AUTHENTICATION_ERROR_CODES)[number];

/**
 * Checks whether a value is a confirmed authentication error code.
 * @param value - The value to check.
 * @returns True when the value is an AuthenticationErrorCode.
 */
export function isAuthenticationErrorCode(value: unknown): value is AuthenticationErrorCode {
  return AUTHENTICATION_ERROR_CODES.some((code) => code === value);
}

/**
 * AuthenticationError means the backend definitively rejected an authentication operation, such as
 * an unknown Google account or an unusable refresh token.
 *
 * Errors of any other type (network failures, server errors) are transient and must not end the session.
 */
export class AuthenticationError extends Error {
  override name = 'AuthenticationError';

  /**
   * @param code - The confirmed error code, or null when the backend returned an unrecognized one.
   * @param message - A developer-facing description; never used to branch on the error condition.
   */
  constructor(
    readonly code: AuthenticationErrorCode | null,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Checks whether an error is an AuthenticationError, optionally with a specific code.
 * @param error - The error to check.
 * @param code - The expected code, if any.
 * @returns True when the error matches.
 */
export function isAuthenticationError(
  error: unknown,
  code?: AuthenticationErrorCode,
): error is AuthenticationError {
  return error instanceof AuthenticationError && (code === undefined || error.code === code);
}
