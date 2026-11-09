import { DeviceStatus } from '@device/domain/value-objects/device-status';
import type { StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';

/** How each device lifecycle status is shown, together with its translated label. */
export const DEVICE_STATUS_APPEARANCE: Readonly<Record<DeviceStatus, StatusAppearance>> = {
  [DeviceStatus.UNPAIRED]: { tone: 'neutral', icon: 'unlink' },
  [DeviceStatus.PAIRED]: { tone: 'success', icon: 'link' },
  [DeviceStatus.REVOKED]: { tone: 'warning', icon: 'lock' },
};
