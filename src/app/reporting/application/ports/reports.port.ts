import type { Observable } from 'rxjs';
import type { Report } from '@reporting/domain/model/report.entity';
import type {
  ReportDownloadLink,
  ReportPage,
  ReportQuery,
} from '@reporting/application/contracts/report-page';
import type { ReportRequest } from '@reporting/application/contracts/report-request';

/**
 * ReportsPort is the outbound port used by Reporting use cases to request reports, follow their generation
 * and obtain the download link of their files. The backend scopes every request to the signed-in owner.
 *
 * Definitive backend rejections are reported as ReportingError; any other error is transient. Declared as
 * an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class ReportsPort {
  /**
   * Requests a report; it is accepted as PENDING and generated in the background.
   * Fails with `VALIDATION_ERROR`, or `NOT_FOUND` when the site or equipment is not the owner's.
   * @param request - What to report on.
   * @returns An Observable of the accepted report.
   */
  abstract requestReport(request: ReportRequest): Observable<Report>;

  /**
   * Lists one page of the reports the owner requested, most recent first, as summaries without KPIs.
   * Fails with `VALIDATION_ERROR` for an invalid search, filter or page.
   * @param query - The search, filters and paging.
   * @returns An Observable of the page.
   */
  abstract listReports(query: ReportQuery): Observable<ReportPage>;

  /**
   * Retrieves one report of the owner with its current status.
   * Fails with `NOT_FOUND`.
   * @param reportId - The identifier of the report.
   * @returns An Observable of the report.
   */
  abstract getReport(reportId: number): Observable<Report>;

  /**
   * Obtains a fresh signed link to the file of a COMPLETED report, with the instant it expires.
   * Fails with `NOT_FOUND`, or `INVALID_STATUS_TRANSITION` when the report is not COMPLETED.
   * @param reportId - The identifier of the report.
   * @returns An Observable of the link, or null when the backend offers no link this client can open.
   */
  abstract getDownloadLink(reportId: number): Observable<ReportDownloadLink | null>;
}
