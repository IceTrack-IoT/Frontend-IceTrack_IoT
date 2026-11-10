import { HttpErrorResponse } from '@angular/common/http';
import { catchError, type MonoTypeOperatorFunction, throwError } from 'rxjs';
import { isErrorResource } from '@shared/infrastructure/api/error.response';
import {
  isServiceRequestsErrorCode,
  ServiceRequestsError,
} from '@service/application/contracts/service-requests-error';

/**
 * Maps a definitive backend rejection (any 4xx answer) to ServiceRequestsError, keeping only the
 * machine-readable `code` of the error body. Every `404` becomes `NOT_FOUND`, because "does not exist" and
 * "is not yours" must not be distinguished. Backend messages and details are never carried over. Any other
 * error (network failure, server error) is returned unchanged as transient.
 * @param error - The error of a Service Request Management request.
 * @returns The ServiceRequestsError, or the original error.
 */
export function toServiceRequestsError(error: unknown): unknown {
  if (!(error instanceof HttpErrorResponse) || error.status < 400 || error.status >= 500) {
    return error;
  }
  const body: unknown = error.error;
  const code = error.status === 404 ? 'NOT_FOUND' : isErrorResource(body) ? body.code : null;
  return new ServiceRequestsError(
    isServiceRequestsErrorCode(code) ? code : null,
    `The backend rejected the service request operation (HTTP ${error.status}).`,
  );
}

/**
 * RxJS operator that rethrows the errors of a Service Request Management request mapped by
 * `toServiceRequestsError`.
 * @returns The operator.
 */
export function mapServiceRequestsErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => throwError(() => toServiceRequestsError(error)));
}
