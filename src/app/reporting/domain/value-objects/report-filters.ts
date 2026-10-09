import { DateRange } from '@reporting/domain/value-objects/date-range';

/**
 * Represents the scope of a report generation. A null `site_id` or `equipment_id` covers every site or
 * equipment item of the owner.
 */
export interface ReportFilters {
  readonly site_id: number | null;
  readonly equipment_id: number | null;
  readonly date_range: DateRange;
}
