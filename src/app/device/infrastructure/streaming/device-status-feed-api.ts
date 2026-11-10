import { inject, Injectable } from '@angular/core';
import { filter, map, type Observable } from 'rxjs';
import type {
  DeviceFeedEvent,
  DeviceFeedStatus,
} from '@device/application/contracts/device-feed-event';
import type { DeviceStatusFeedPort } from '@device/application/ports/device-status-feed.port';
import { OwnerStreamSourcePort } from '@device/application/ports/owner-stream-source.port';

/** The owner stream event sent when a board of the owner is paired, rotated, revoked or unpaired. */
const DEVICE_STATUS_CHANGED_EVENT = 'device-status-changed';

const DEVICE_FEED_STATUSES: readonly DeviceFeedStatus[] = ['UNPAIRED', 'PAIRED', 'REVOKED'];

/**
 * DeviceStatusChangedStreamResource is the data of a `device-status-changed` event. Only the properties
 * the web application reads are declared.
 */
interface DeviceStatusChangedStreamResource {
  device_id: number;
  status: DeviceFeedStatus;
}

function isDeviceStatusChanged(data: unknown): data is DeviceStatusChangedStreamResource {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const deviceId: unknown = 'device_id' in data ? data.device_id : null;
  const status: unknown = 'status' in data ? data.status : null;
  return (
    typeof deviceId === 'number' &&
    Number.isFinite(deviceId) &&
    DEVICE_FEED_STATUSES.some((value) => value === status)
  );
}

/**
 * DeviceStatusFeedApi implements the DeviceStatusFeedPort with the `device-status-changed` events of the
 * owner event stream, which Monitoring and Alerting relays on its single connection. Payloads that do not
 * match the documented resource, or carry an undocumented status, are ignored; a gap in the stream asks
 * for the inventory to be read again.
 */
@Injectable({
  providedIn: 'root',
})
export class DeviceStatusFeedApi implements DeviceStatusFeedPort {
  private readonly source = inject(OwnerStreamSourcePort);

  watch(): Observable<DeviceFeedEvent> {
    return this.source.watch(DEVICE_STATUS_CHANGED_EVENT).pipe(
      map((signal): DeviceFeedEvent | null => {
        switch (signal.kind) {
          case 'gap':
            return { kind: 'resync' };
          case 'event':
            return isDeviceStatusChanged(signal.data)
              ? {
                  kind: 'device-status',
                  deviceId: signal.data.device_id,
                  status: signal.data.status,
                }
              : null;
          default:
            // While the stream is down the inventory is refreshed by hand, as without a stream.
            return null;
        }
      }),
      filter((event): event is DeviceFeedEvent => event !== null),
    );
  }
}
