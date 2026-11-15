import { DeviceConnectivityState } from '@device/domain/value-objects/device-connectivity';
import { DeviceStatus } from '@device/domain/value-objects/device-status';
import type { StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';

/** How each device lifecycle status is shown, together with its translated label. */
export const DEVICE_STATUS_APPEARANCE: Readonly<Record<DeviceStatus, StatusAppearance>> = {
  [DeviceStatus.UNPAIRED]: { tone: 'neutral', icon: 'unlink' },
  [DeviceStatus.PAIRED]: { tone: 'success', icon: 'link' },
  [DeviceStatus.REVOKED]: { tone: 'warning', icon: 'lock' },
};

/**
 * How each connectivity state the server reports for a board is shown, together with its translated label
 * `devices.connectivity.<state>`.
 */
export const DEVICE_CONNECTIVITY_APPEARANCE: Readonly<
  Record<DeviceConnectivityState, StatusAppearance>
> = {
  [DeviceConnectivityState.REPORTING]: { tone: 'success', icon: 'wifi' },
  [DeviceConnectivityState.SILENT]: { tone: 'critical', icon: 'wifi-off' },
  [DeviceConnectivityState.NEVER_REPORTED]: { tone: 'neutral', icon: 'clock' },
  [DeviceConnectivityState.KEY_REVOKED]: { tone: 'warning', icon: 'lock' },
  [DeviceConnectivityState.UNPAIRED]: { tone: 'neutral', icon: 'unlink' },
};
