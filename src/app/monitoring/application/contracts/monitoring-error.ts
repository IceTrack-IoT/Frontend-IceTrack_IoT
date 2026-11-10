/**
 * Machine-readable error codes with which the backend rejects Monitoring and Alerting requests.
 *
 * Every `404` is reported as `NOT_FOUND`, whatever its specific code (`ALERT_NOT_FOUND`,
 * `EQUIPMENT_NOT_FOUND`): the backend answers "not found" both for resources that do not exist and for
 * resources the caller may not reach, and the two must not be distinguished. `INVALID_STATUS_TRANSITION`
 * means the alert was already changed, by someone else or by the platform.
 */
export const MONITORING_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'ACCESS_DENIED',
  'NOT_FOUND',
  'INVALID_STATUS_TRANSITION',
  'CONCURRENT_MODIFICATION_CONFLICT',
  'TOO_MANY_REQUESTS',
] as const;

export type MonitoringErrorCode = (typeof MONITORING_ERROR_CODES)[number];

/**
 * Checks whether a value is a confirmed Monitoring and Alerting error code.
 * @param value - The value to check.
 * @returns True when the value is a MonitoringErrorCode.
 */
export function isMonitoringErrorCode(value: unknown): value is MonitoringErrorCode {
  return MONITORING_ERROR_CODES.some((code) => code === value);
}

/**
 * MonitoringError means the backend definitively rejected a Monitoring and Alerting request (any 4xx
 * answer). Errors of any other type (network failures, server errors) are transient.
 */
export class MonitoringError extends Error {
  override name = 'MonitoringError';

  /**
   * @param code - The confirmed error code, or null when the backend returned an unrecognized one.
   * @param message - A fixed technical description for diagnostics; it never contains backend text.
   */
  constructor(
    readonly code: MonitoringErrorCode | null,
    message: string,
  ) {
    super(message);
  }
}

/**
 * The outcome of a failed Monitoring and Alerting operation as the store exposes it: the confirmed error
 * code, or `UNEXPECTED` for transient failures and unrecognized rejections.
 */
export type MonitoringFailure = MonitoringErrorCode | 'UNEXPECTED';

/**
 * Resolves the failure of a Monitoring and Alerting operation from its error.
 * @param error - The error of the operation.
 * @returns The confirmed error code, or `UNEXPECTED`.
 */
export function toMonitoringFailure(error: unknown): MonitoringFailure {
  return error instanceof MonitoringError && error.code !== null ? error.code : 'UNEXPECTED';
}
