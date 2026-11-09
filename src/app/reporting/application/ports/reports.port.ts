import type { Observable } from 'rxjs';
import type { Report } from '@reporting/domain/model/report.entity';
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
   * Lists every report the owner requested, most recent first.
   * @returns An Observable of the reports.
   */
  abstract listReports(): Observable<Report[]>;

  /**
   * Retrieves one report of the owner with its current status.
   * Fails with `NOT_FOUND`.
   * @param reportId - The identifier of the report.
   * @returns An Observable of the report.
   */
  abstract getReport(reportId: number): Observable<Report>;

  /**
   * Obtains a fresh signed link to the file of a COMPLETED report, valid for 15 minutes.
   * Fails with `NOT_FOUND`.
   * @param reportId - The identifier of the report.
   * @returns An Observable of the link, or null when the report has no file to download.
   */
  abstract getDownloadUrl(reportId: number): Observable<string | null>;
}
