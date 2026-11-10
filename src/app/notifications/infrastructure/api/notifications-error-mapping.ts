import { HttpErrorResponse } from '@angular/common/http';
import { catchError, type MonoTypeOperatorFunction, throwError } from 'rxjs';
import { isErrorResource } from '@shared/infrastructure/api/error.response';
import {
  isNotificationsErrorCode,
  NotificationsError,
  type NotificationsErrorCode,
} from '@notifications/application/contracts/notifications-error';

/** The code of statuses whose body may be empty or non-standard. */
const STATUS_CODES: Readonly<Record<number, NotificationsErrorCode>> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'ACCESS_DENIED',
  404: 'NOT_FOUND',
};

/**
 * Maps a definitive backend rejection (any 4xx answer) to NotificationsError, keeping only the
 * machine-readable `code` of the error body. Every `404` becomes `NOT_FOUND`, including the empty-bodied
 * one answered for a notification addressed to someone else. Backend messages and details are never
 * carried over. Any other error (network failure, server error) is returned unchanged as transient.
 * @param error - The error of a Notifications request.
 * @returns The NotificationsError, or the original error.
 */
export function toNotificationsError(error: unknown): unknown {
  if (!(error instanceof HttpErrorResponse) || error.status < 400 || error.status >= 500) {
    return error;
  }
  const body: unknown = error.error;
  const bodyCode = isErrorResource(body) ? body.code : null;
  const code =
    error.status === 404
      ? 'NOT_FOUND'
      : isNotificationsErrorCode(bodyCode)
        ? bodyCode
        : (STATUS_CODES[error.status] ?? null);
  return new NotificationsError(
    code,
    `The backend rejected the notifications operation (HTTP ${error.status}).`,
  );
}

/**
 * RxJS operator that rethrows the errors of a Notifications request mapped by `toNotificationsError`.
 * @returns The operator.
 */
export function mapNotificationsErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => throwError(() => toNotificationsError(error)));
}
