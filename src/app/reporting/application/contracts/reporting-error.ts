/**
 * Machine-readable error codes with which the backend rejects Reporting requests.
 *
 * Every `404` is reported as `NOT_FOUND`, whatever its code (`REPORT_NOT_FOUND`, or a site or equipment
 * filter not reachable by the caller): "does not exist" and "is not yours" must not be distinguished.
 */
export const REPORTING_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'ACCESS_DENIED',
  'NOT_FOUND',
] as const;

export type ReportingErrorCode = (typeof REPORTING_ERROR_CODES)[number];

/**
 * Checks whether a value is a confirmed Reporting error code.
 * @param value - The value to check.
 * @returns True when the value is a ReportingErrorCode.
 */
export function isReportingErrorCode(value: unknown): value is ReportingErrorCode {
  return REPORTING_ERROR_CODES.some((code) => code === value);
}

/**
 * ReportingError means the backend definitively rejected a Reporting request (any 4xx answer), or a use
 * case refused a request it knows the backend would reject. Errors of any other type (network failures,
 * server errors) are transient.
 */
export class ReportingError extends Error {
  override name = 'ReportingError';

  /**
   * @param code - The confirmed error code, or null when the backend returned an unrecognized one.
   * @param message - A fixed technical description for diagnostics; it never contains backend text.
   */
  constructor(
    readonly code: ReportingErrorCode | null,
    message: string,
  ) {
    super(message);
  }
}

/**
 * The outcome of a failed Reporting operation as the store exposes it: the confirmed error code, or
 * `UNEXPECTED` for transient failures and unrecognized rejections.
 */
export type ReportingFailure = ReportingErrorCode | 'UNEXPECTED';

/**
 * Resolves the failure of a Reporting operation from its error.
 * @param error - The error of the operation.
 * @returns The confirmed error code, or `UNEXPECTED`.
 */
export function toReportingFailure(error: unknown): ReportingFailure {
  return error instanceof ReportingError && error.code !== null ? error.code : 'UNEXPECTED';
}
