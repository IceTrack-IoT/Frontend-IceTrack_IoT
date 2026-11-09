import { Report } from '@reporting/domain/model/report.entity';
import type { KpiValue } from '@reporting/domain/value-objects/kpi-value';
import { isReportFormat } from '@reporting/domain/value-objects/report-format';
import { isReportStatus } from '@reporting/domain/value-objects/report-status';
import { isReportType } from '@reporting/domain/value-objects/report-type';
import type { ReportRequest } from '@reporting/application/contracts/report-request';
import type { CreateReportRequest } from '@reporting/infrastructure/api/report.requests';
import type { ReportResource } from '@reporting/infrastructure/api/report.response';

/**
 * ReportAssembler converts the Reporting resources into domain entities, and application input into
 * request bodies.
 *
 * A report carrying a type, format or status outside the documented enumerations, or an unreadable
 * instant, is rejected with an error instead of being shown wrongly. A `result_payload` that cannot be
 * read leaves the report without indicators.
 */
export class ReportAssembler {
  /**
   * Converts a ReportResource to a Report entity.
   * @param resource - The resource to convert.
   * @returns The corresponding Report entity.
   */
  toReportFromResource(resource: ReportResource): Report {
    const { type, format, status } = resource;
    if (!isReportType(type) || !isReportFormat(format) || !isReportStatus(status)) {
      throw new Error('The report has an unknown type, format or status.');
    }
    return new Report({
      id: resource.id,
      name: resource.name,
      type,
      format,
      status,
      failure_reason: resource.failure_reason ?? null,
      kpis: toKpis(resource.result_payload),
      user_id: resource.user_id,
      filters: {
        site_id: resource.site_id ?? null,
        equipment_id: resource.equipment_id ?? null,
        technician_id: resource.technician_id ?? null,
        date_range: { from: toInstant(resource.from), to: toInstant(resource.to) },
      },
      requested_at: toInstant(resource.requested_at),
      completed_at:
        resource.completed_at === null || resource.completed_at === undefined
          ? null
          : toInstant(resource.completed_at),
    });
  }

  /**
   * Converts a report request to the create report request body, with the period as UTC instants.
   * @param request - What to report on.
   * @returns The request body.
   */
  toCreateReportRequest(request: ReportRequest): CreateReportRequest {
    return {
      name: request.name,
      type: request.type,
      format: request.format,
      filters: {
        site_id: request.siteId,
        equipment_id: request.equipmentId,
        technician_id: request.technicianId,
        from: request.from.toISOString(),
        to: request.to.toISOString(),
      },
    };
  }
}

function toInstant(value: string): Date {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) {
    throw new Error('The report resource has an unreadable instant.');
  }
  return instant;
}

/**
 * Reads the KPIs of `result_payload`, a JSON array encoded inside a string. Entries without a text label
 * are skipped; a payload that is not such an array yields null.
 */
export function toKpis(payload: string | null | undefined): KpiValue[] | null {
  if (payload === null || payload === undefined || payload.trim() === '') {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) {
    return null;
  }
  return parsed.flatMap((entry: unknown): KpiValue[] => {
    if (typeof entry !== 'object' || entry === null || !('label' in entry)) {
      return [];
    }
    const label: unknown = entry.label;
    const value: unknown = 'value' in entry ? entry.value : null;
    const unit: unknown = 'unit' in entry ? entry.unit : null;
    if (typeof label !== 'string' || (typeof value !== 'number' && typeof value !== 'string')) {
      return [];
    }
    return [{ label, value, unit: typeof unit === 'string' ? unit : '' }];
  });
}
