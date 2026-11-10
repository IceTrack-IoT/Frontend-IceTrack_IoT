/**
 * Machine-readable error codes with which the backend rejects Notifications requests.
 *
 * Every `404` is reported as `NOT_FOUND`, whatever its body (`NOTIFICATION_NOT_FOUND`, or an empty body for
 * a notification addressed to someone else): "does not exist" and "is not yours" must not be
 * distinguished.
 */
export const NOTIFICATIONS_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'ACCESS_DENIED',
  'NOT_FOUND',
] as const;

export type NotificationsErrorCode = (typeof NOTIFICATIONS_ERROR_CODES)[number];

/**
 * Checks whether a value is a confirmed Notifications error code.
 * @param value - The value to check.
 * @returns True when the value is a NotificationsErrorCode.
 */
export function isNotificationsErrorCode(value: unknown): value is NotificationsErrorCode {
  return NOTIFICATIONS_ERROR_CODES.some((code) => code === value);
}

/**
 * NotificationsError means the backend definitively rejected a Notifications request (any 4xx answer), or
 * a use case refused an action the notification's state does not allow. Errors of any other type (network
 * failures, server errors) are transient.
 */
export class NotificationsError extends Error {
  override name = 'NotificationsError';

  /**
   * @param code - The confirmed error code, or null when the backend returned an unrecognized one.
   * @param message - A fixed technical description for diagnostics; it never contains backend text.
   */
  constructor(
    readonly code: NotificationsErrorCode | null,
    message: string,
  ) {
    super(message);
  }
}

/**
 * The outcome of a failed Notifications operation as the store exposes it: the confirmed error code, or
 * `UNEXPECTED` for transient failures and unrecognized rejections.
 */
export type NotificationsFailure = NotificationsErrorCode | 'UNEXPECTED';

/**
 * Resolves the failure of a Notifications operation from its error.
 * @param error - The error of the operation.
 * @returns The confirmed error code, or `UNEXPECTED`.
 */
export function toNotificationsFailure(error: unknown): NotificationsFailure {
  return error instanceof NotificationsError && error.code !== null ? error.code : 'UNEXPECTED';
}
