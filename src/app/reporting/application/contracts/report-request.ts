import type { ReportFormat } from '@reporting/domain/value-objects/report-format';
import type { ReportType } from '@reporting/domain/value-objects/report-type';

/** The longest report name the backend accepts. */
export const REPORT_NAME_MAX_LENGTH = 150;

/**
 * What the owner asks to report on. A null site, equipment or technician leaves the report unscoped by
 * it; both ends of the period are inclusive and `from` must not be after `to`.
 */
export interface ReportRequest {
  /** The display name; not blank, up to 150 characters. */
  readonly name: string;
  readonly type: ReportType;
  readonly format: ReportFormat;
  readonly siteId: number | null;
  readonly equipmentId: number | null;
  readonly technicianId: number | null;
  readonly from: Date;
  readonly to: Date;
}
