import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import type { Report } from '@reporting/domain/model/report.entity';
import type {
  ReportDownloadLink,
  ReportPage,
  ReportQuery,
} from '@reporting/application/contracts/report-page';
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

  listReports(query: ReportQuery): Observable<ReportPage> {
    return this.endpoint.listReports(query).pipe(
      mapReportingErrors(),
      map((resource) => this.assembler.toReportPageFromResource(resource)),
    );
  }

  getReport(reportId: number): Observable<Report> {
    return this.endpoint.getReport(reportId).pipe(
      mapReportingErrors(),
      map((resource) => this.assembler.toReportFromResource(resource)),
    );
  }

  getDownloadLink(reportId: number): Observable<ReportDownloadLink | null> {
    return this.endpoint.getDownloadLink(reportId).pipe(
      mapReportingErrors(),
      map((resource) => {
        const url = toHttpsUrl(resource.download_url);
        const expiresAt = new Date(resource.expires_at);
        return url === null || Number.isNaN(expiresAt.getTime())
          ? null
          : { url, expiresAt, fileName: resource.file_name };
      }),
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
