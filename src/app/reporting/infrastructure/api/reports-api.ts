import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import type { Report } from '@reporting/domain/model/report.entity';
import type { ReportRequest } from '@reporting/application/contracts/report-request';
import type { ReportsPort } from '@reporting/application/ports/reports.port';
import { ReportAssembler } from '@reporting/infrastructure/api/report-assembler';
import { mapReportingErrors } from '@reporting/infrastructure/api/reporting-error-mapping';
import { ReportsApiEndpoint } from '@reporting/infrastructure/api/reports-api-endpoint';

/**
 * ReportsApi implements the ReportsPort against the owner endpoints of Reporting. Signed download links
 * are handed to the caller as read and never kept here.
 */
@Injectable({
  providedIn: 'root',
})
export class ReportsApi extends BaseApi implements ReportsPort {
  private readonly endpoint = new ReportsApiEndpoint(inject(HttpClient));
  private readonly assembler = new ReportAssembler();

  requestReport(request: ReportRequest): Observable<Report> {
    return this.endpoint.requestReport(this.assembler.toCreateReportRequest(request)).pipe(
      mapReportingErrors(),
      map((resource) => this.assembler.toReportFromResource(resource)),
    );
  }

  listReports(): Observable<Report[]> {
    return this.endpoint.listReports().pipe(
      mapReportingErrors(),
      map((resources) =>
        resources.map((resource) => this.assembler.toReportFromResource(resource)),
      ),
    );
  }

  getReport(reportId: number): Observable<Report> {
    return this.endpoint.getReport(reportId).pipe(
      mapReportingErrors(),
      map((resource) => this.assembler.toReportFromResource(resource)),
    );
  }

  getDownloadUrl(reportId: number): Observable<string | null> {
    return this.endpoint.getReport(reportId).pipe(
      mapReportingErrors(),
      map((resource) => toHttpsUrl(resource.download_url)),
    );
  }
}

/** Accepts only an absolute `https` link; anything else (such as a `file://` link) is not offered. */
function toHttpsUrl(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  try {
    return new URL(value).protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}
