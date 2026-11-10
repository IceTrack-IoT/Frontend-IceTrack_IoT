import { HttpErrorResponse } from '@angular/common/http';
import { catchError, type MonoTypeOperatorFunction, throwError } from 'rxjs';
import { isErrorResource } from '@shared/infrastructure/api/error.response';
import {
  isReportingErrorCode,
  ReportingError,
  type ReportingErrorCode,
} from '@reporting/application/contracts/reporting-error';

/** The code of statuses whose body may be empty or non-standard. */
const STATUS_CODES: Readonly<Record<number, ReportingErrorCode>> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'ACCESS_DENIED',
  404: 'NOT_FOUND',
};

/**
 * Maps a definitive backend rejection (any 4xx answer) to ReportingError, keeping only the
 * machine-readable `code` of the error body. Every `404` becomes `NOT_FOUND`. Backend messages and
 * details are never carried over. Any other error (network failure, server error) is returned unchanged
 * as transient.
 * @param error - The error of a Reporting request.
 * @returns The ReportingError, or the original error.
 */
export function toReportingError(error: unknown): unknown {
  if (!(error instanceof HttpErrorResponse) || error.status < 400 || error.status >= 500) {
    return error;
  }
  const body: unknown = error.error;
  const bodyCode = isErrorResource(body) ? body.code : null;
  const code =
    error.status === 404
      ? 'NOT_FOUND'
      : isReportingErrorCode(bodyCode)
        ? bodyCode
        : (STATUS_CODES[error.status] ?? null);
  return new ReportingError(
    code,
    `The backend rejected the reporting operation (HTTP ${error.status}).`,
  );
}

/**
 * RxJS operator that rethrows the errors of a Reporting request mapped by `toReportingError`.
 * @returns The operator.
 */
export function mapReportingErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => throwError(() => toReportingError(error)));
}
