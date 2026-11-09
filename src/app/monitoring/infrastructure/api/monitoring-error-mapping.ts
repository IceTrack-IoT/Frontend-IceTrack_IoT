import { HttpErrorResponse } from '@angular/common/http';
import { catchError, type MonoTypeOperatorFunction, throwError } from 'rxjs';
import { isErrorResource } from '@shared/infrastructure/api/error.response';
import {
  isMonitoringErrorCode,
  type MonitoringErrorCode,
  MonitoringError,
} from '@monitoring/application/contracts/monitoring-error';

/** The code of statuses whose body may be empty or non-standard. */
const STATUS_CODES: Readonly<Record<number, MonitoringErrorCode>> = {
  401: 'UNAUTHORIZED',
  403: 'ACCESS_DENIED',
  404: 'NOT_FOUND',
  429: 'TOO_MANY_REQUESTS',
};

/**
 * Maps a definitive backend rejection (any 4xx answer) to MonitoringError, keeping only the
 * machine-readable `code` of the error body. Every `404` becomes `NOT_FOUND`, because "does not exist" and
 * "is not yours" must not be distinguished; `401`, `403` and `429` keep their meaning even without a body.
 * Backend messages and details are never carried over. Any other error (network failure, server error) is
 * returned unchanged as transient.
 * @param error - The error of a Monitoring and Alerting request.
 * @returns The MonitoringError, or the original error.
 */
export function toMonitoringError(error: unknown): unknown {
  if (!(error instanceof HttpErrorResponse) || error.status < 400 || error.status >= 500) {
    return error;
  }
  const body: unknown = error.error;
  const bodyCode = isErrorResource(body) ? body.code : null;
  const code =
    error.status === 404
      ? 'NOT_FOUND'
      : isMonitoringErrorCode(bodyCode)
        ? bodyCode
        : (STATUS_CODES[error.status] ?? null);
  return new MonitoringError(
    code,
    `The backend rejected the monitoring operation (HTTP ${error.status}).`,
  );
}

/**
 * RxJS operator that rethrows the errors of a Monitoring and Alerting request mapped by
 * `toMonitoringError`.
 * @returns The operator.
 */
export function mapMonitoringErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => throwError(() => toMonitoringError(error)));
}
