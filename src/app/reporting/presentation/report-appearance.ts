import { ReportStatus } from '@reporting/domain/value-objects/report-status';
import type { StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';

/** How each report generation status is shown, together with its translated label. */
export const REPORT_STATUS_APPEARANCE: Readonly<Record<ReportStatus, StatusAppearance>> = {
  [ReportStatus.PENDING]: { tone: 'neutral', icon: 'clock' },
  [ReportStatus.GENERATING]: { tone: 'info', icon: 'refresh' },
  [ReportStatus.COMPLETED]: { tone: 'success', icon: 'circle-check' },
  [ReportStatus.FAILED]: { tone: 'critical', icon: 'circle-x' },
};

/** The statuses of a report whose generation has not finished yet. */
export const IN_PROGRESS_REPORT_STATUSES: ReadonlySet<ReportStatus> = new Set([
  ReportStatus.PENDING,
  ReportStatus.GENERATING,
]);
