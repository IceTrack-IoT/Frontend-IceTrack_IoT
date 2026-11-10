/**
 * Machine-readable error codes with which the backend rejects Device Management requests.
 *
 * Every `404` is reported as `NOT_FOUND`, whatever its specific code (`DEVICE_NOT_FOUND`,
 * `EQUIPMENT_NOT_FOUND`): the backend answers "not found" both for resources that do not exist and for
 * resources the caller may not reach, and the two must not be distinguished. `DEVICE_CONFLICT` means the
 * board is already paired or the equipment already has a paired device; `INVALID_STATUS_TRANSITION` means
 * the device is no longer in a status that allows the action.
 */
export const DEVICE_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'ACCESS_DENIED',
  'NOT_FOUND',
  'DEVICE_CONFLICT',
  'DUPLICATE_RESOURCE_CONFLICT',
  'INVALID_STATUS_TRANSITION',
  'CONCURRENT_MODIFICATION_CONFLICT',
] as const;

export type DeviceErrorCode = (typeof DEVICE_ERROR_CODES)[number];

/**
 * Checks whether a value is a confirmed Device Management error code.
 * @param value - The value to check.
 * @returns True when the value is a DeviceErrorCode.
 */
export function isDeviceErrorCode(value: unknown): value is DeviceErrorCode {
  return DEVICE_ERROR_CODES.some((code) => code === value);
}

/**
 * DeviceError means the backend definitively rejected a Device Management request (any 4xx answer), or a
 * use case refused an action the device's status does not allow. Errors of any other type (network
 * failures, server errors) are transient.
 */
export class DeviceError extends Error {
  override name = 'DeviceError';

  /**
   * @param code - The confirmed error code, or null when the backend returned an unrecognized one.
   * @param message - A fixed technical description for diagnostics; it never contains backend text.
   */
  constructor(
    readonly code: DeviceErrorCode | null,
    message: string,
  ) {
    super(message);
  }
}

/**
 * The outcome of a failed Device Management operation as the store exposes it: the confirmed error code,
 * or `UNEXPECTED` for transient failures and unrecognized rejections.
 */
export type DeviceFailure = DeviceErrorCode | 'UNEXPECTED';

/**
 * Resolves the failure of a Device Management operation from its error.
 * @param error - The error of the operation.
 * @returns The confirmed error code, or `UNEXPECTED`.
 */
export function toDeviceFailure(error: unknown): DeviceFailure {
  return error instanceof DeviceError && error.code !== null ? error.code : 'UNEXPECTED';
}
