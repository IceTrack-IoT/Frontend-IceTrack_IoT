/**
 * ReportType enum represents the kinds of report: the analytical reports over a period, and the
 * `SERVICE_INTERVENTION` document of one completed service request, which covers that request's own
 * period.
 */
export enum ReportType {
  MAINTENANCE_COMPLIANCE = 'MAINTENANCE_COMPLIANCE',
  EQUIPMENT_UPTIME = 'EQUIPMENT_UPTIME',
  TECHNICIAN_PERFORMANCE = 'TECHNICIAN_PERFORMANCE',
  TEMPERATURE_EXCURSION = 'TEMPERATURE_EXCURSION',
  SERVICE_INTERVENTION = 'SERVICE_INTERVENTION',
}

/** The report types requested for a period, as opposed to one service request. */
export const PERIOD_REPORT_TYPES: readonly ReportType[] = [
  ReportType.MAINTENANCE_COMPLIANCE,
  ReportType.EQUIPMENT_UPTIME,
  ReportType.TECHNICIAN_PERFORMANCE,
  ReportType.TEMPERATURE_EXCURSION,
];

/**
 * Checks whether a value is one of the confirmed values of report type.
 * @param value - The value to check.
 * @returns True when the value is a ReportType.
 */
export function isReportType(value: unknown): value is ReportType {
  return Object.values(ReportType).some((reportType) => reportType === value);
}
