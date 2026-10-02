import { DestroyRef, DOCUMENT, inject, Injectable } from '@angular/core';
import { EMPTY, filter, fromEvent, map, type Observable } from 'rxjs';
import type { SessionSyncPort } from '@iam/application/ports/session-sync.port';
import {
  isSessionSyncEvent,
  type SessionSyncEvent,
} from '@iam/application/contracts/session-sync-event';
import { BrowserStorageKeys } from '@iam/infrastructure/storage/browser-storage-keys';

const SESSION_SYNC_CHANNEL_NAME = 'ice-track.iam.session-sync';

/**
 * BrowserSessionSync coordinates the client session across tabs with a BroadcastChannel.
 *
 * Messages carry only event names, never token values. When BroadcastChannel is unavailable, it falls
 * back to the `storage` event raised by writes to the canonical session key in other tabs.
 */
@Injectable({
  providedIn: 'root',
})
export class BrowserSessionSync implements SessionSyncPort {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly channel = this.createChannel();

  readonly events: Observable<SessionSyncEvent> =
    this.channel !== null ? this.channelEvents(this.channel) : this.storageEvents();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.channel?.close());
  }

  publish(event: SessionSyncEvent): void {
    // The storage-event fallback needs no explicit publish: other tabs observe the storage write itself.
    try {
      this.channel?.postMessage(event);
    } catch {
      // The channel is closed: there is no tab left to notify from this context.
    }
  }

  private createChannel(): BroadcastChannel | null {
    if (this.window === null || typeof this.window.BroadcastChannel !== 'function') {
      return null;
    }
    return new this.window.BroadcastChannel(SESSION_SYNC_CHANNEL_NAME);
  }

  private channelEvents(channel: BroadcastChannel): Observable<SessionSyncEvent> {
    return fromEvent<MessageEvent<unknown>>(channel, 'message').pipe(
      map((message) => message.data),
      filter(isSessionSyncEvent),
    );
  }

  private storageEvents(): Observable<SessionSyncEvent> {
    if (this.window === null) {
      return EMPTY;
    }
    return fromEvent<StorageEvent>(this.window, 'storage').pipe(
      filter((event) => event.key === BrowserStorageKeys.clientSession || event.key === null),
      map((event): SessionSyncEvent =>
        event.newValue === null ? 'session-cleared' : 'refresh-completed',
      ),
    );
  }
}
