import { DateRange } from '@reporting/domain/value-objects/date-range';

/**
 * The scope and period of a report. A null site, equipment or technician means the report covers all of
 * them; both ends of the period are inclusive. `service_request_id` names the service request a
 * `SERVICE_INTERVENTION` report documents and is null for every other type.
 */
export interface ReportFilters {
  readonly site_id: number | null;
  readonly equipment_id: number | null;
  readonly technician_id: number | null;
  readonly service_request_id: number | null;
  readonly date_range: DateRange;
}
