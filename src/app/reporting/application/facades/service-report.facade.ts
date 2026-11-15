import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { ReportFormat } from '@reporting/domain/value-objects/report-format';
import { RequestServiceReportUseCase } from '@reporting/application/use-cases/request-service-report.use-case';
import type { ServiceReportPort } from '@service/application/ports/service-report.port';

/**
 * ServiceReportFacade implements the ServiceReportPort of Service Request Management with the Reporting
 * request flow: it requests the PDF `SERVICE_INTERVENTION` document of a completed service request and
 * exposes only the identifier of the accepted report, which Reporting then follows and serves.
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceReportFacade implements ServiceReportPort {
  private readonly requestServiceReportUseCase = inject(RequestServiceReportUseCase);

  requestServiceReport(serviceRequestId: number, name: string): Observable<number> {
    return this.requestServiceReportUseCase
      .execute({ name, format: ReportFormat.PDF, serviceRequestId })
      .pipe(map((report) => report.id));
  }
}
