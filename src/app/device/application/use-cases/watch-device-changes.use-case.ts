import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { DeviceFeedEvent } from '@device/application/contracts/device-feed-event';
import { DeviceStatusFeedPort } from '@device/application/ports/device-status-feed.port';

/**
 * Starts the live feed of the owner's device lifecycle changes, made from this or any other session.
 */
@Injectable({
  providedIn: 'root',
})
export class WatchDeviceChangesUseCase {
  private readonly feed = inject(DeviceStatusFeedPort);

  /**
   * @returns An Observable of the feed events; unsubscribing stops the feed.
   */
  execute(): Observable<DeviceFeedEvent> {
    return this.feed.watch();
  }
}
