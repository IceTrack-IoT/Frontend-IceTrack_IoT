import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { Report } from '@reporting/domain/model/report.entity';
import { ReportingError } from '@reporting/application/contracts/reporting-error';
import {
  REPORT_NAME_MAX_LENGTH,
  type ServiceReportRequest,
} from '@reporting/application/contracts/report-request';
import { ReportsPort } from '@reporting/application/ports/reports.port';

/**
 * Requests the `SERVICE_INTERVENTION` document of a completed service request. The backend accepts it as
 * PENDING and generates it in the background, like any other report.
 */
@Injectable({
  providedIn: 'root',
})
export class RequestServiceReportUseCase {
  private readonly reports = inject(ReportsPort);

  /**
   * @param request - The service request to document, the report name and its format.
   * @returns An Observable of the accepted report.
   */
  execute(request: ServiceReportRequest): Observable<Report> {
    const name = request.name.trim().slice(0, REPORT_NAME_MAX_LENGTH);
    if (name === '') {
      return throwError(
        () => new ReportingError('VALIDATION_ERROR', 'A service report needs a name.'),
      );
    }
    return this.reports.requestServiceReport({ ...request, name });
  }
}
