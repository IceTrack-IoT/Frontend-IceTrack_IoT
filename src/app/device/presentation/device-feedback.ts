import type { DeviceAction } from '@device/application/devices-store';
import type { DeviceFailure } from '@device/application/contracts/device-error';

/**
 * Translation keys of the feedback shown for Device Management operations. Backend messages are never
 * shown.
 */

/** The confirmation announced when a device action succeeds. */
export const DEVICE_ACTION_SUCCESS_KEYS: Readonly<Record<DeviceAction, string>> = {
  pair: 'devices.feedback.paired',
  unpair: 'devices.feedback.unpaired',
  rotate: 'devices.feedback.rotated',
  revoke: 'devices.feedback.revoked',
};

/**
 * Resolves the translation key shown when a device action fails.
 * @param action - The action that failed.
 * @param failure - Why it failed.
 * @returns The translation key.
 */
export function deviceActionErrorKey(action: DeviceAction, failure: DeviceFailure | null): string {
  switch (failure) {
    case 'DEVICE_CONFLICT':
    case 'DUPLICATE_RESOURCE_CONFLICT':
      return action === 'pair' ? 'devices.errors.pairingConflict' : 'devices.errors.deviceChanged';
    case 'INVALID_STATUS_TRANSITION':
    case 'CONCURRENT_MODIFICATION_CONFLICT':
      return 'devices.errors.deviceChanged';
    case 'NOT_FOUND':
      return action === 'pair'
        ? 'devices.errors.equipmentNotFound'
        : 'devices.errors.deviceNotFound';
    case 'VALIDATION_ERROR':
      return 'devices.errors.invalidPairing';
    case 'ACCESS_DENIED':
      return 'devices.errors.accessDenied';
    default:
      return 'devices.errors.unexpected';
  }
}
