import { Report } from '@reporting/domain/model/report.entity';
import type { KpiValue } from '@reporting/domain/value-objects/kpi-value';
import { ReportFormat } from '@reporting/domain/value-objects/report-format';
import type { ReportFilters } from '@reporting/domain/value-objects/report-filters';
import { ReportStatus } from '@reporting/domain/value-objects/report-status';
import { ReportType } from '@reporting/domain/value-objects/report-type';

/**
 * Mocked reports of the signed-in owner.
 * TODO: Replace with the reporting store once the report use cases are implemented.
 */

/** The user the mocked reports were requested by. */
export const MOCK_USER_ID = 1;

/** A site or equipment item a report can be scoped to; the names come from Assets Management. */
export interface ReportScopeOption {
  readonly id: number;
  readonly name: string;
  /** The site of an equipment item; null for a site. */
  readonly siteId: number | null;
}

export const REPORT_SITES: readonly ReportScopeOption[] = [
  { id: 1, name: 'San Miguel Depot', siteId: null },
  { id: 2, name: 'Miraflores Market', siteId: null },
  { id: 3, name: 'Callao Logistics Hub', siteId: null },
  { id: 4, name: 'Surco Central Kitchen', siteId: null },
  { id: 5, name: 'Chorrillos Seafood Plant', siteId: null },
];

export const REPORT_EQUIPMENT: readonly ReportScopeOption[] = [
  { id: 1, name: 'Walk-In Freezer #02', siteId: 1 },
  { id: 2, name: 'Walk-In Freezer #04', siteId: 1 },
  { id: 3, name: 'Cold Room #02', siteId: 1 },
  { id: 4, name: 'Display Chiller #05', siteId: 2 },
  { id: 5, name: 'Ice Cream Freezer #09', siteId: 2 },
  { id: 6, name: 'Cold Room #01', siteId: 3 },
  { id: 7, name: 'Cold Room #03', siteId: 3 },
  { id: 8, name: 'Blast Freezer #07', siteId: 4 },
  { id: 9, name: 'Reach-In Refrigerator #11', siteId: 4 },
  { id: 10, name: 'Prep Line Refrigerator #12', siteId: 4 },
];

/**
 * The indicators of the completed reports, by report identifier. The class diagram stores them as the
 * report `result_payload`; its format is not documented, so the views read them from here.
 * TODO: Read the indicators from the report contract once the payload format is defined.
 */
export const REPORT_KPIS: Readonly<Record<number, readonly KpiValue[]>> = {
  1: [
    { label: 'Mean kinetic temperature', value: -17.8, unit: '°C' },
    { label: 'Time in safe range', value: 99.2, unit: '%' },
    { label: 'Excursion degree-minutes', value: 42.5, unit: '°C·min' },
    { label: 'Excursion events', value: 3, unit: '' },
  ],
  3: [
    { label: 'Services completed', value: 27, unit: '' },
    { label: 'Average rating', value: 4.7, unit: '/ 5' },
    { label: 'Average time to accept', value: 18, unit: 'min' },
  ],
  4: [
    { label: 'Preventive services on time', value: 92, unit: '%' },
    { label: 'Overdue maintenance', value: 1, unit: '' },
  ],
  6: [
    { label: 'Time in safe range', value: 98.9, unit: '%' },
    { label: 'Excursion events', value: 5, unit: '' },
  ],
  8: [
    { label: 'Preventive services on time', value: 88, unit: '%' },
    { label: 'Overdue maintenance', value: 3, unit: '' },
  ],
  10: [
    { label: 'Time in safe range', value: 99.6, unit: '%' },
    { label: 'Excursion events', value: 1, unit: '' },
  ],
};

const hoursAgo = (hours: number): Date => new Date(Date.now() - hours * 3_600_000);

/**
 * Creates the mocked reports of the owner, newest first. Each call returns new instances.
 * @returns The mocked reports.
 */
export function createReportsMock(): Report[] {
  const report = (
    id: number,
    title: string,
    type: ReportType,
    format: ReportFormat,
    status: ReportStatus,
    requestedHoursAgo: number,
  ): Report => {
    const completed = status === ReportStatus.COMPLETED;
    return new Report({
      id,
      title,
      type,
      format,
      status,
      result_payload: completed ? JSON.stringify(REPORT_KPIS[id] ?? []) : null,
      user_id: MOCK_USER_ID,
      requested_at: hoursAgo(requestedHoursAgo),
      completed_at: completed ? hoursAgo(requestedHoursAgo - 0.05) : null,
    });
  };

  const {
    MAINTENANCE_COMPLIANCE,
    EQUIPMENT_UPTIME,
    TECHNICIAN_PERFORMANCE,
    TEMPERATURE_EXCURSION,
  } = ReportType;
  const { PDF, EXCEL, CSV } = ReportFormat;
  const { PENDING, GENERATING, COMPLETED, FAILED } = ReportStatus;
  return [
    report(7, 'Equipment uptime · September 2026', EQUIPMENT_UPTIME, CSV, PENDING, 0.03),
    report(2, 'Equipment uptime · Q3 2026', EQUIPMENT_UPTIME, EXCEL, GENERATING, 0.2),
    report(1, 'Cold-chain compliance · October 2026', TEMPERATURE_EXCURSION, PDF, COMPLETED, 2),
    report(
      3,
      'Technician performance · September 2026',
      TECHNICIAN_PERFORMANCE,
      PDF,
      COMPLETED,
      190,
    ),
    report(
      4,
      'Maintenance compliance · San Miguel Depot · September 2026',
      MAINTENANCE_COMPLIANCE,
      CSV,
      COMPLETED,
      191,
    ),
    report(
      5,
      'Temperature excursions · Miraflores Market · August 2026',
      TEMPERATURE_EXCURSION,
      EXCEL,
      FAILED,
      900,
    ),
    report(
      6,
      'Cold-chain compliance · Callao Logistics Hub · August 2026',
      TEMPERATURE_EXCURSION,
      PDF,
      COMPLETED,
      901,
    ),
    report(9, 'Technician performance · Q2 2026', TECHNICIAN_PERFORMANCE, EXCEL, FAILED, 2_200),
    report(8, 'Maintenance compliance · Q2 2026', MAINTENANCE_COMPLIANCE, PDF, COMPLETED, 2_210),
    report(
      10,
      'Temperature excursions · Walk-In Freezer #04 · July 2026',
      TEMPERATURE_EXCURSION,
      PDF,
      COMPLETED,
      2_230,
    ),
  ];
}

/**
 * Simulates the backend accepting a report request: the report starts pending.
 * TODO: Replace with the report returned by the generate report use case, which receives the filters.
 * @param request - The title, type, format and scope of the report.
 * @returns The requested report.
 */
export function requestReportMock(request: {
  title: string;
  type: ReportType;
  format: ReportFormat;
  filters: ReportFilters;
}): Report {
  return new Report({
    id: Math.max(...createReportsMock().map((report) => report.id)) + 1,
    title: request.title,
    type: request.type,
    format: request.format,
    status: ReportStatus.PENDING,
    result_payload: null,
    user_id: MOCK_USER_ID,
    requested_at: new Date(),
    completed_at: null,
  });
}

/**
 * Simulates checking the status of a report being generated: each check advances it one step, from
 * pending to generating to completed. Returns a new instance.
 * TODO: Replace with the status returned by the report status use case.
 * @param report - The report being generated.
 * @returns The report with its current status.
 */
export function checkReportStatusMock(report: Report): Report {
  const next =
    report.status === ReportStatus.PENDING ? ReportStatus.GENERATING : ReportStatus.COMPLETED;
  const completed = next === ReportStatus.COMPLETED;
  return new Report({
    id: report.id,
    title: report.title,
    type: report.type,
    format: report.format,
    status: next,
    result_payload: completed ? JSON.stringify(REPORT_KPIS[report.id] ?? []) : null,
    user_id: report.user_id,
    requested_at: report.requested_at,
    completed_at: completed ? new Date() : null,
  });
}
