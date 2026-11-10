/**
 * ReportFiltersResource is the scope and period of a report request; `from` and `to` are UTC instants
 * (`Z`), both inclusive.
 */
export interface ReportFiltersRequest {
  site_id: number | null;
  equipment_id: number | null;
  technician_id: number | null;
  from: string;
  to: string;
}

/**
 * CreateReportResource is the body of `POST /reports`: a non-blank name of up to 150 characters, the
 * report type and format by their enum names, and the filters.
 */
export interface CreateReportRequest {
  name: string;
  type: string;
  format: string;
  filters: ReportFiltersRequest;
}
