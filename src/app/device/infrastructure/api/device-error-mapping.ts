import { HttpErrorResponse } from '@angular/common/http';
import { catchError, type MonoTypeOperatorFunction, throwError } from 'rxjs';
import { isErrorResource } from '@shared/infrastructure/api/error.response';
import {
  DeviceError,
  type DeviceErrorCode,
  isDeviceErrorCode,
} from '@device/application/contracts/device-error';

/** The code of statuses whose body may be empty or non-standard. */
const STATUS_CODES: Readonly<Record<number, DeviceErrorCode>> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'ACCESS_DENIED',
  404: 'NOT_FOUND',
};

/**
 * Maps a definitive backend rejection (any 4xx answer) to DeviceError, keeping only the machine-readable
 * `code` of the error body. Every `404` becomes `NOT_FOUND`, because "does not exist" and "is not yours"
 * must not be distinguished; `400`, `401` and `403` keep their meaning even without a body. Backend
 * messages and details are never carried over. Any other error (network failure, server error) is
 * returned unchanged as transient.
 * @param error - The error of a Device Management request.
 * @returns The DeviceError, or the original error.
 */
export function toDeviceError(error: unknown): unknown {
  if (!(error instanceof HttpErrorResponse) || error.status < 400 || error.status >= 500) {
    return error;
  }
  const body: unknown = error.error;
  const bodyCode = isErrorResource(body) ? body.code : null;
  const code =
    error.status === 404
      ? 'NOT_FOUND'
      : isDeviceErrorCode(bodyCode)
        ? bodyCode
        : (STATUS_CODES[error.status] ?? null);
  return new DeviceError(code, `The backend rejected the device operation (HTTP ${error.status}).`);
}

/**
 * RxJS operator that rethrows the errors of a Device Management request mapped by `toDeviceError`.
 * @returns The operator.
 */
export function mapDeviceErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => throwError(() => toDeviceError(error)));
}
