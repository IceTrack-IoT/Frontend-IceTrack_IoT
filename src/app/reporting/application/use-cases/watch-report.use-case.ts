import { inject, Injectable } from '@angular/core';
import { exhaustMap, type Observable, take, takeWhile, timer } from 'rxjs';
import type { Report } from '@reporting/domain/model/report.entity';
import { ReportsPort } from '@reporting/application/ports/reports.port';

/** How often a report in progress is read again. */
export const REPORT_POLL_INTERVAL_MS = 4_000;

/** The most reads made for one report before giving up; about five minutes. */
export const REPORT_POLL_MAX_READS = 75;

/**
 * Reads a report and, while it is being generated, keeps reading it at a fixed interval until it is
 * COMPLETED or FAILED. Polling stops after about five minutes; the last state read is then the final
 * emission, and the caller may read the report again later.
 */
@Injectable({
  providedIn: 'root',
})
export class WatchReportUseCase {
  private readonly reports = inject(ReportsPort);

  /**
   * @param reportId - The identifier of the report.
   * @returns An Observable of the report each time it is read; it completes once the report is finished
   *   or polling gives up, and fails when a read fails.
   */
  execute(reportId: number): Observable<Report> {
    return timer(0, REPORT_POLL_INTERVAL_MS).pipe(
      take(REPORT_POLL_MAX_READS),
      exhaustMap(() => this.reports.getReport(reportId)),
      takeWhile((report) => report.isInProgress(), true),
    );
  }
}
