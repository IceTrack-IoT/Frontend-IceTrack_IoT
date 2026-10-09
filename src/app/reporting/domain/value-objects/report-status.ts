/**
 * ReportStatus enum represents the states of the asynchronous generation of a report.
 */
export enum ReportStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Checks whether a value is one of the confirmed values of report status.
 * @param value - The value to check.
 * @returns True when the value is a ReportStatus.
 */
export function isReportStatus(value: unknown): value is ReportStatus {
  return Object.values(ReportStatus).some((reportStatus) => reportStatus === value);
}
