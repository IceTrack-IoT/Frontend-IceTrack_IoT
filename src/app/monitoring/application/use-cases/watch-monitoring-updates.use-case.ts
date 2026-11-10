import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { MonitoringUpdate } from '@monitoring/application/contracts/monitoring-update';
import { MonitoringStreamPort } from '@monitoring/application/ports/monitoring-stream.port';

/**
 * Opens the owner's live monitoring feed. A `connected` update that is not resumed means the loaded state
 * must be read again.
 */
@Injectable({
  providedIn: 'root',
})
export class WatchMonitoringUpdatesUseCase {
  private readonly stream = inject(MonitoringStreamPort);

  /**
   * @returns An Observable of the feed updates; unsubscribing closes the feed.
   */
  execute(): Observable<MonitoringUpdate> {
    return this.stream.watch();
  }
}
