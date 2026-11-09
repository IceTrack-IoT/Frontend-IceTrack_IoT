import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { Report } from '@reporting/domain/model/report.entity';
import { ReportingError } from '@reporting/application/contracts/reporting-error';
import {
  REPORT_NAME_MAX_LENGTH,
  type ReportRequest,
} from '@reporting/application/contracts/report-request';
import { ReportsPort } from '@reporting/application/ports/reports.port';

/**
 * Requests a report for a period, optionally scoped to a site, an equipment item or a technician. The
 * backend accepts it as PENDING and generates it in the background.
 */
@Injectable({
  providedIn: 'root',
})
export class RequestReportUseCase {
  private readonly reports = inject(ReportsPort);

  /**
   * @param request - What to report on.
   * @returns An Observable of the accepted report.
   */
  execute(request: ReportRequest): Observable<Report> {
    const name = request.name.trim();
    if (
      name === '' ||
      name.length > REPORT_NAME_MAX_LENGTH ||
      request.from.getTime() > request.to.getTime()
    ) {
      return throwError(
        () =>
          new ReportingError(
            'VALIDATION_ERROR',
            'A report needs a name and a period whose start is not after its end.',
          ),
      );
    }
    return this.reports.requestReport({ ...request, name });
  }
}
