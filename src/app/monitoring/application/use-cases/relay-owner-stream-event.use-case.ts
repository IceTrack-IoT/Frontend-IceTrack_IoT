import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { OwnerStreamSignal } from '@monitoring/application/contracts/owner-stream-signal';
import { MonitoringStreamPort } from '@monitoring/application/ports/monitoring-stream.port';

/**
 * Relays one named event of the owner event stream, uninterpreted, on the shared connection.
 */
@Injectable({
  providedIn: 'root',
})
export class RelayOwnerStreamEventUseCase {
  private readonly stream = inject(MonitoringStreamPort);

  /**
   * @param eventName - The event name, as the owning context's configuration names it.
   * @returns An Observable of the signals; unsubscribing stops relaying.
   */
  execute(eventName: string): Observable<OwnerStreamSignal> {
    return this.stream.watchEvent(eventName);
  }
}
