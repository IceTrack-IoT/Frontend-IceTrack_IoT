import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ReportFeedEvent } from '@reporting/application/contracts/report-feed-event';
import { ReportStatusFeedPort } from '@reporting/application/ports/report-status-feed.port';

/**
 * Starts the live feed of the owner's report generation status changes.
 */
@Injectable({
  providedIn: 'root',
})
export class WatchReportChangesUseCase {
  private readonly feed = inject(ReportStatusFeedPort);

  /**
   * @returns An Observable of the feed events; unsubscribing stops the feed.
   */
  execute(): Observable<ReportFeedEvent> {
    return this.feed.watch();
  }
}
