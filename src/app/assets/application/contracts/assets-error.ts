/**
 * Machine-readable error codes with which the backend rejects Assets Management requests.
 *
 * Every `404` is reported as `NOT_FOUND`, whatever its specific code: the backend answers "not found" for
 * resources that do not exist and for resources the caller may not reach, and the two must not be
 * distinguished. A reused equipment uid is reported as `EQUIPMENT_CONFLICT` or, on a race,
 * `DUPLICATE_RESOURCE_CONFLICT`. `IDEMPOTENCY_KEY_CONFLICT` means a registration is still being processed
 * under the same submission.
 */
export const ASSETS_ERROR_CODES = [
  'VALIDATION_ERROR',
  'ACCESS_DENIED',
  'NOT_FOUND',
  'INVALID_STATUS_TRANSITION',
  'EQUIPMENT_CONFLICT',
  'DUPLICATE_RESOURCE_CONFLICT',
  'CONCURRENT_MODIFICATION_CONFLICT',
  'ADDRESS_VALIDATION_REQUIRED',
  'PIN_OUT_OF_RANGE',
  'ADDRESS_NOT_VERIFIED',
  'ADDRESS_OUT_OF_COVERAGE',
  'TOO_MANY_REQUESTS',
  'GEOCODING_UNAVAILABLE',
  'IDEMPOTENCY_KEY_CONFLICT',
] as const;

export type AssetsErrorCode = (typeof ASSETS_ERROR_CODES)[number];

/**
 * Checks whether a value is a confirmed Assets Management error code.
 * @param value - The value to check.
 * @returns True when the value is an AssetsErrorCode.
 */
export function isAssetsErrorCode(value: unknown): value is AssetsErrorCode {
  return ASSETS_ERROR_CODES.some((code) => code === value);
}

/**
 * AssetsError means the backend definitively rejected an Assets Management request (any 4xx answer, or the
 * `503 GEOCODING_UNAVAILABLE` answer of address verification). Errors of any other type (network failures,
 * server errors) are transient.
 */
export class AssetsError extends Error {
  override name = 'AssetsError';

  /**
   * @param code - The confirmed error code, or null when the backend returned an unrecognized one.
   * @param message - A fixed technical description for diagnostics; it never contains backend text.
   * @param candidates - The addresses the owner may choose from when the address was not verified.
   */
  constructor(
    readonly code: AssetsErrorCode | null,
    message: string,
    readonly candidates: readonly string[] = [],
  ) {
    super(message);
  }
}

/**
 * The outcome of a failed Assets Management operation as the store exposes it: the confirmed error code, or
 * `UNEXPECTED` for transient failures and unrecognized rejections.
 */
export type AssetsFailure = AssetsErrorCode | 'UNEXPECTED';

/**
 * Resolves the failure of an Assets Management operation from its error.
 * @param error - The error of the operation.
 * @returns The confirmed error code, or `UNEXPECTED`.
 */
export function toAssetsFailure(error: unknown): AssetsFailure {
  return error instanceof AssetsError && error.code !== null ? error.code : 'UNEXPECTED';
}
