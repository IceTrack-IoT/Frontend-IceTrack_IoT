import { ReportStatus } from '@reporting/domain/value-objects/report-status';
import type { ReportingFailure } from '@reporting/application/contracts/reporting-error';
import type { StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';

/** How each report generation status is shown, together with its translated label. */
export const REPORT_STATUS_APPEARANCE: Readonly<Record<ReportStatus, StatusAppearance>> = {
  [ReportStatus.PENDING]: { tone: 'neutral', icon: 'clock' },
  [ReportStatus.GENERATING]: { tone: 'info', icon: 'refresh' },
  [ReportStatus.COMPLETED]: { tone: 'success', icon: 'circle-check' },
  [ReportStatus.FAILED]: { tone: 'critical', icon: 'circle-x' },
};

/**
 * Resolves the translation key shown when a report request fails. Backend messages are never shown.
 * @param failure - Why it failed.
 * @returns The translation key.
 */
export function reportRequestErrorKey(failure: ReportingFailure | null): string {
  switch (failure) {
    case 'VALIDATION_ERROR':
      return 'reporting.errors.invalidRequest';
    case 'NOT_FOUND':
      return 'reporting.errors.scopeNotFound';
    case 'ACCESS_DENIED':
      return 'reporting.errors.accessDenied';
    default:
      return 'reporting.errors.unexpected';
  }
}

/**
 * Resolves the translation key shown when the download link of a report cannot be obtained.
 * @param failure - Why it failed.
 * @returns The translation key.
 */
export function reportDownloadErrorKey(failure: ReportingFailure | null): string {
  switch (failure) {
    case 'NOT_FOUND':
      return 'reporting.errors.reportNotFound';
    case 'ACCESS_DENIED':
      return 'reporting.errors.accessDenied';
    default:
      return 'reporting.errors.downloadUnavailable';
  }
}
