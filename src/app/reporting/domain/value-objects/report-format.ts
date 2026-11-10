/**
 * ReportFormat enum represents the file format a report is rendered in.
 */
export enum ReportFormat {
  PDF = 'PDF',
  XLSX = 'XLSX',
  CSV = 'CSV',
}

/**
 * Checks whether a value is one of the confirmed report formats.
 * @param value - The value to check.
 * @returns True when the value is a ReportFormat.
 */
export function isReportFormat(value: unknown): value is ReportFormat {
  return Object.values(ReportFormat).some((reportFormat) => reportFormat === value);
}
