import { inject, Injectable } from '@angular/core';
import {
  concat,
  defer,
  EMPTY,
  filter,
  type Observable,
  of,
  switchMap,
  take,
  takeWhile,
  timer,
} from 'rxjs';
import type { Report } from '@reporting/domain/model/report.entity';
import { ReportStatusFeedPort } from '@reporting/application/ports/report-status-feed.port';
import { ReportsPort } from '@reporting/application/ports/reports.port';

/** How often a report in progress is read again while live status changes are unavailable. */
export const REPORT_POLL_INTERVAL_MS = 4_000;

/** The most periodic reads made for one report before giving up; about five minutes. */
export const REPORT_POLL_MAX_READS = 75;

/**
 * Reads a report and, while it is being generated, reads it again whenever the live feed reports a status
 * change of it (or may have missed one), until it is COMPLETED or FAILED. While the live feed is down and
 * reconnecting, and when live changes are unavailable in this session, the report is read periodically
 * instead, for about five minutes; the last state read is then the final emission, and the caller may
 * read the report again later.
 */
@Injectable({
  providedIn: 'root',
})
export class WatchReportUseCase {
  private readonly reports = inject(ReportsPort);
  private readonly feed = inject(ReportStatusFeedPort);

  /**
   * @param reportId - The identifier of the report.
   * @returns An Observable of the report each time it is read; it completes once the report is finished
   *   or polling gives up, and fails when a read fails.
   */
  execute(reportId: number): Observable<Report> {
    const polling = defer(() => timer(REPORT_POLL_INTERVAL_MS, REPORT_POLL_INTERVAL_MS)).pipe(
      take(REPORT_POLL_MAX_READS),
    );
    const changes = this.feed.watch().pipe(
      filter((event) => event.kind !== 'report-status' || event.reportId === reportId),
      // Reading periodically covers an interruption; a restored feed delivers what was missed.
      switchMap((event) => {
        switch (event.kind) {
          case 'interrupted':
            return polling;
          case 'restored':
            return EMPTY;
          default:
            return of(null);
        }
      }),
    );
    // The feed completes only when it can never deliver changes; reading periodically takes over.
    return concat(of(null), changes, polling).pipe(
      // A newer trigger supersedes a read still in flight, so the latest state always wins.
      switchMap(() => this.reports.getReport(reportId)),
      takeWhile((report) => report.isInProgress(), true),
    );
  }
}
