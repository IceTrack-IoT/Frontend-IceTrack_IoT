import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { Report } from '@reporting/domain/model/report.entity';
import { ReportingError } from '@reporting/application/contracts/reporting-error';
import { ReportsPort } from '@reporting/application/ports/reports.port';

/**
 * Deletes a report whose generation finished, together with its file. A report still waiting for or
 * undergoing generation belongs to the worker and is refused before any request is sent; the backend
 * remains the authority.
 */
@Injectable({
  providedIn: 'root',
})
export class DeleteReportUseCase {
  private readonly reports = inject(ReportsPort);

  /**
   * @param report - The report to delete.
   * @returns An Observable that completes once the report is deleted.
   */
  execute(report: Report): Observable<void> {
    if (!report.canBeDeleted()) {
      return throwError(
        () =>
          new ReportingError(
            'INVALID_STATUS_TRANSITION',
            'Only a COMPLETED or FAILED report can be deleted.',
          ),
      );
    }
    return this.reports.deleteReport(report.id);
  }
}
