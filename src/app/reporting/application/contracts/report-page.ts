import type { Report } from '@reporting/domain/model/report.entity';
import type { ReportStatus } from '@reporting/domain/value-objects/report-status';
import type { ReportType } from '@reporting/domain/value-objects/report-type';

/**
 * The search, filters and paging the backend supports when listing the owner's reports, most recently
 * requested first. An empty list or a null bound does not filter.
 */
export interface ReportQuery {
  /** Part of the report name; blank searches nothing. Up to 150 characters. */
  readonly search: string;
  readonly types: readonly ReportType[];
  readonly statuses: readonly ReportStatus[];
  /** The earliest request time kept, inclusive. */
  readonly requestedFrom: Date | null;
  /** The latest request time kept, inclusive. */
  readonly requestedTo: Date | null;
  /** The zero-based page index. */
  readonly page: number;
  /** The number of reports per page, from 1 to 100. */
  readonly size: number;
}

/** One page of the owner's reports, as summaries without KPIs. */
export interface ReportPage {
  readonly items: readonly Report[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

/** A signed link to the file of a completed report. */
export interface ReportDownloadLink {
  /** The signed `https` link; the browser saves the file under `fileName`. */
  readonly url: string;
  /** When the signature expires. */
  readonly expiresAt: Date;
  readonly fileName: string;
}
