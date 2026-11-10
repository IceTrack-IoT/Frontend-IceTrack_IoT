import type { AuthenticationErrorCode } from '@iam/application/contracts/authentication-error';

/**
 * Translation keys of the feedback shown when an authentication attempt fails. Backend messages are
 * never shown. Outcomes that continue elsewhere are not failures here: an unregistered Google account,
 * a Google account that must be linked, and an account that must use the mobile application are handled
 * by navigation instead (see `authentication-continuation.ts`).
 */

const TOO_MANY_ATTEMPTS_KEY = 'iam.errors.tooManyAttempts';

/**
 * Resolves the translation key shown when a local sign-in fails. Rejected credentials share a single
 * message so the user is never told whether the username or the password was wrong.
 * @param code - The error code of the failure, or null when it is not a confirmed code.
 * @returns The translation key of the feedback.
 */
export function localSignInErrorKey(code: AuthenticationErrorCode | null): string {
  return code === 'TOO_MANY_REQUESTS' ? TOO_MANY_ATTEMPTS_KEY : 'iam.errors.invalidCredentials';
}

/**
 * Resolves the translation key shown when a Google sign-in fails. Provider details are never shown.
 * @param code - The error code of the failure, or null when it is not a confirmed code.
 * @returns The translation key of the feedback.
 */
export function googleSignInErrorKey(code: AuthenticationErrorCode | null): string {
  return code === 'TOO_MANY_REQUESTS' ? TOO_MANY_ATTEMPTS_KEY : 'iam.errors.googleSignInFailed';
}

/**
 * Resolves the translation key shown when a local sign-up or a Google registration completion fails.
 * @param code - The error code of the failure, or null when it is not a confirmed code.
 * @returns The translation key of the feedback.
 */
export function registrationErrorKey(code: AuthenticationErrorCode | null): string {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 'iam.errors.invalidRegistration';
    case 'USER_CONFLICT':
    case 'PROFILE_CONFLICT':
      return 'iam.errors.accountAlreadyRegistered';
    default:
      return 'iam.errors.registrationRejected';
  }
}

/**
 * Resolves the translation key shown when linking a Google account to a password account fails. A
 * missing account and a wrong password share a single message.
 * @param code - The error code of the failure, or null when it is not a confirmed code.
 * @returns The translation key of the feedback.
 */
export function googleAccountLinkErrorKey(code: AuthenticationErrorCode | null): string {
  switch (code) {
    case 'BAD_CREDENTIALS':
      return 'iam.errors.invalidLinkPassword';
    case 'TOO_MANY_REQUESTS':
      return TOO_MANY_ATTEMPTS_KEY;
    default:
      return 'iam.errors.googleAccountLinkFailed';
  }
}
