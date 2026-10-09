/**
 * ReportFormat enum represents the file formats a report can be exported to.
 */
export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
}

/**
 * Checks whether a value is one of the confirmed values of report format.
 * @param value - The value to check.
 * @returns True when the value is a ReportFormat.
 */
export function isReportFormat(value: unknown): value is ReportFormat {
  return Object.values(ReportFormat).some((reportFormat) => reportFormat === value);
}
