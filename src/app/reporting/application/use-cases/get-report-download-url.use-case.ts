import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { Report } from '@reporting/domain/model/report.entity';
import type { ReportDownloadLink } from '@reporting/application/contracts/report-page';
import { ReportingError } from '@reporting/application/contracts/reporting-error';
import { ReportsPort } from '@reporting/application/ports/reports.port';

/**
 * Obtains a fresh signed link to the file of a COMPLETED report. The link is valid until its `expiresAt`,
 * so it is read on demand and never stored.
 */
@Injectable({
  providedIn: 'root',
})
export class GetReportDownloadUrlUseCase {
  private readonly reports = inject(ReportsPort);

  /**
   * @param report - The report whose file is downloaded.
   * @returns An Observable of the link, or null when the backend offers no link this client can open.
   */
  execute(report: Report): Observable<ReportDownloadLink | null> {
    if (!report.isDownloadable()) {
      return throwError(
        () => new ReportingError('VALIDATION_ERROR', 'Only a COMPLETED report can be downloaded.'),
      );
    }
    return this.reports.getDownloadLink(report.id);
  }
}
