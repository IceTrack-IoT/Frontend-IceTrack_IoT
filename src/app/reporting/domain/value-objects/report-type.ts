/**
 * ReportType enum represents the kinds of analytical report.
 */
export enum ReportType {
  MAINTENANCE_COMPLIANCE = 'MAINTENANCE_COMPLIANCE',
  EQUIPMENT_UPTIME = 'EQUIPMENT_UPTIME',
  TECHNICIAN_PERFORMANCE = 'TECHNICIAN_PERFORMANCE',
  TEMPERATURE_EXCURSION = 'TEMPERATURE_EXCURSION',
}

/**
 * Checks whether a value is one of the confirmed values of report type.
 * @param value - The value to check.
 * @returns True when the value is a ReportType.
 */
export function isReportType(value: unknown): value is ReportType {
  return Object.values(ReportType).some((reportType) => reportType === value);
}
