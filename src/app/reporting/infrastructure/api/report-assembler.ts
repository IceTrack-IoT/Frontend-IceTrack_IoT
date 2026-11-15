import { Report } from '@reporting/domain/model/report.entity';
import type { KpiValue } from '@reporting/domain/value-objects/kpi-value';
import { isReportFormat } from '@reporting/domain/value-objects/report-format';
import { isReportStatus } from '@reporting/domain/value-objects/report-status';
import { isReportType, ReportType } from '@reporting/domain/value-objects/report-type';
import type { ReportPage } from '@reporting/application/contracts/report-page';
import type {
  ReportRequest,
  ServiceReportRequest,
} from '@reporting/application/contracts/report-request';
import type { CreateReportRequest } from '@reporting/infrastructure/api/report.requests';
import type {
  KpiResource,
  PagedReportResource,
  ReportResource,
} from '@reporting/infrastructure/api/report.response';

/**
 * ReportAssembler converts the Reporting resources into domain entities, and application input into
 * request bodies.
 *
 * A report carrying a type, format or status outside the documented enumerations, or an unreadable
 * instant, is rejected with an error instead of being shown wrongly. KPI entries that do not match the
 * documented shape are left out.
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
      kpis: toKpis(resource.kpis),
      user_id: resource.user_id,
      filters: {
        site_id: resource.site_id ?? null,
        equipment_id: resource.equipment_id ?? null,
        technician_id: resource.technician_id ?? null,
        service_request_id: resource.service_request_id ?? null,
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
   * Converts a PagedReportResource to a ReportPage.
   * @param resource - The resource to convert.
   * @returns The corresponding page.
   */
  toReportPageFromResource(resource: PagedReportResource): ReportPage {
    return {
      items: resource.content.map((item) => this.toReportFromResource(item)),
      page: resource.page,
      size: resource.size,
      totalElements: resource.total_elements,
      totalPages: resource.total_pages,
    };
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

  /**
   * Converts a service report request to the create report request body of a `SERVICE_INTERVENTION`
   * report, which names only the service request and covers its own period.
   * @param request - The service request to document.
   * @returns The request body.
   */
  toCreateServiceReportRequest(request: ServiceReportRequest): CreateReportRequest {
    return {
      name: request.name,
      type: ReportType.SERVICE_INTERVENTION,
      format: request.format,
      filters: { service_request_id: request.serviceRequestId },
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
 * Reads the `kpis` array of a COMPLETED report. Entries without a text key and label or a finite numeric
 * value are skipped; a report without the array has no indicators.
 */
function toKpis(kpis: readonly KpiResource[] | null | undefined): KpiValue[] | null {
  if (kpis === null || kpis === undefined) {
    return null;
  }
  return kpis.flatMap((entry: unknown): KpiValue[] => {
    if (typeof entry !== 'object' || entry === null) {
      return [];
    }
    const key: unknown = 'key' in entry ? entry.key : null;
    const label: unknown = 'label' in entry ? entry.label : null;
    const value: unknown = 'value' in entry ? entry.value : null;
    const unit: unknown = 'unit' in entry ? entry.unit : null;
    if (
      typeof key !== 'string' ||
      typeof label !== 'string' ||
      typeof value !== 'number' ||
      !Number.isFinite(value)
    ) {
      return [];
    }
    return [{ key, label, value, unit: typeof unit === 'string' ? unit : '' }];
  });
}
