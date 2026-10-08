import type { AuthenticationErrorCode } from '@iam/application/contracts/authentication-error';

/**
 * Translation key shown when a Google sign-in fails for any reason other than an unregistered account,
 * which is handled by navigating to the Google registration instead. Provider details are never shown.
 */
export const GOOGLE_SIGN_IN_ERROR_KEY = 'iam.errors.googleSignInFailed';

/**
 * Resolves the translation key shown when a local sign-in fails. Rejected credentials share a single
 * message so the user is never told whether the username or the password was wrong.
 * @param code - The error code of the failure, or null when it is not a confirmed code.
 * @returns The translation key of the feedback.
 */
export function localSignInErrorKey(code: AuthenticationErrorCode | null): string {
  return code === 'BUSINESS_RULE_VIOLATION'
    ? 'iam.errors.federatedAccount'
    : 'iam.errors.invalidCredentials';
}

/**
 * Resolves the translation key shown when a local sign-up or a Google registration completion fails.
 * @param code - The error code of the failure, or null when it is not a confirmed code.
 * @returns The translation key of the feedback.
 */
export function registrationErrorKey(code: AuthenticationErrorCode | null): string {
  return code === 'VALIDATION_ERROR'
    ? 'iam.errors.invalidRegistration'
    : 'iam.errors.registrationRejected';
}
