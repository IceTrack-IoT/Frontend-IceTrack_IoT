/**
 * Machine-readable error codes with which the backend rejects Service Request Management requests.
 *
 * Every `404` is reported as `NOT_FOUND`, whatever its specific code: the backend answers "not found" for
 * resources that do not exist and for resources the caller may not reach, and the two must not be
 * distinguished.
 */
export const SERVICE_REQUESTS_ERROR_CODES = [
  'VALIDATION_ERROR',
  'ACCESS_DENIED',
  'NOT_FOUND',
  'INVALID_STATUS_TRANSITION',
  'TECHNICIAN_NOT_ELIGIBLE',
  'REVIEW_NOT_ALLOWED',
  'DUPLICATE_RESOURCE_CONFLICT',
  'CONCURRENT_MODIFICATION_CONFLICT',
] as const;

export type ServiceRequestsErrorCode = (typeof SERVICE_REQUESTS_ERROR_CODES)[number];

/**
 * Checks whether a value is a confirmed Service Request Management error code.
 * @param value - The value to check.
 * @returns True when the value is a ServiceRequestsErrorCode.
 */
export function isServiceRequestsErrorCode(value: unknown): value is ServiceRequestsErrorCode {
  return SERVICE_REQUESTS_ERROR_CODES.some((code) => code === value);
}

/**
 * ServiceRequestsError means the backend definitively rejected a Service Request Management request (any
 * 4xx answer). Errors of any other type (network failures, server errors) are transient.
 */
export class ServiceRequestsError extends Error {
  override name = 'ServiceRequestsError';

  /**
   * @param code - The confirmed error code, or null when the backend returned an unrecognized one.
   * @param message - A fixed technical description for diagnostics; it never contains backend text.
   */
  constructor(
    readonly code: ServiceRequestsErrorCode | null,
    message: string,
  ) {
    super(message);
  }
}

/**
 * The outcome of a failed Service Request Management operation as the store exposes it: the confirmed
 * error code, or `UNEXPECTED` for transient failures and unrecognized rejections.
 */
export type ServiceRequestsFailure = ServiceRequestsErrorCode | 'UNEXPECTED';

/**
 * Resolves the failure of a Service Request Management operation from its error.
 * @param error - The error of the operation.
 * @returns The confirmed error code, or `UNEXPECTED`.
 */
export function toServiceRequestsFailure(error: unknown): ServiceRequestsFailure {
  return error instanceof ServiceRequestsError && error.code !== null ? error.code : 'UNEXPECTED';
}

/**
 * Failures meaning the local copy of the service request (or its review) is stale or the action is no
 * longer allowed in its current state, so the resource must be read again.
 */
const STALE_STATE_FAILURES: ReadonlySet<ServiceRequestsFailure> = new Set([
  'INVALID_STATUS_TRANSITION',
  'TECHNICIAN_NOT_ELIGIBLE',
  'REVIEW_NOT_ALLOWED',
  'DUPLICATE_RESOURCE_CONFLICT',
  'CONCURRENT_MODIFICATION_CONFLICT',
]);

/**
 * Checks whether a failure means the local state is stale and the resource must be reloaded.
 * @param failure - The failure of an operation.
 * @returns True when the resource must be read again.
 */
export function isStaleStateFailure(failure: ServiceRequestsFailure): boolean {
  return STALE_STATE_FAILURES.has(failure);
}
