import { DeviceStatus } from '@device/domain/value-objects/device-status';
import type { StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';

/** How each device state is shown, together with its translated label. */
export const DEVICE_STATUS_APPEARANCE: Readonly<Record<DeviceStatus, StatusAppearance>> = {
  [DeviceStatus.UNPAIRED]: { tone: 'neutral', icon: 'unlink' },
  [DeviceStatus.PAIRED]: { tone: 'info', icon: 'link' },
  [DeviceStatus.ONLINE]: { tone: 'success', icon: 'wifi' },
  [DeviceStatus.OFFLINE]: { tone: 'warning', icon: 'wifi-off' },
};

/**
 * The last characters of a credential hash, enough for the owner to recognize it without exposing it.
 * @param hash - The credential hash.
 * @returns The masked hash, such as `••••3a9f`.
 */
export function maskedHash(hash: string): string {
  return `••••${hash.slice(-4)}`;
}
