# Reporting - request and response contracts

Generated from the REST resource records under `src/main/java/pe/edu/upc/ice/track/platform/reporting/interfaces/rest/resources`. Property names are the **serialized** names: Jackson runs with `SNAKE_CASE` (`JacksonConfiguration`, `spring.jackson.property-naming-strategy`), so the Java component `fullName` is the JSON property `full_name`.

Legend: **Required** = enforced by Bean Validation (`@NotNull` / `@NotBlank`). Optional properties may be omitted or `null`. A resource marked `@JsonInclude(NON_NULL)` **omits** null properties; every other resource writes them as `null`.

## `CreateReportResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/reporting/interfaces/rest/resources/CreateReportResource.java`
- Example: [`requests/CreateReportResource.json`](requests/CreateReportResource.json) | JSON Schema: [`schemas/reporting/CreateReportResource.schema.json`](../../schemas/reporting/CreateReportResource.schema.json)
- Used by: `POST /api/v1/reports`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `name` | string | yes | not blank; max length 150 | Display name of the report |
| `type` | string | yes | not blank | documented values: `MAINTENANCE_COMPLIANCE`, `EQUIPMENT_UPTIME`, `TECHNICIAN_PERFORMANCE`, `TEMPERATURE_EXCURSION`; Report type, by its enum name |
| `format` | string | yes | not blank | documented values: `PDF`, `XLSX`, `CSV`; Output format |
| `filters` | object (`ReportFiltersResource`) | yes | validated recursively | Scope and period of the report |

## `ReportFiltersResource` (nested object)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/reporting/interfaces/rest/resources/ReportFiltersResource.java`
- Example: [`nested/ReportFiltersResource.json`](nested/ReportFiltersResource.json) | JSON Schema: [`schemas/reporting/ReportFiltersResource.schema.json`](../../schemas/reporting/ReportFiltersResource.schema.json)
- Embedded in: `CreateReportResource`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `site_id` | integer | no |  | Site to report on; must belong to the caller; nullable |
| `equipment_id` | integer | no |  | Single unit to report on; must belong to the caller; nullable |
| `technician_id` | integer | no |  | Technician to report on; nullable |
| `from` | string (date-time, UTC with Z) | yes |  | Inclusive start of the period |
| `to` | string (date-time, UTC with Z) | yes |  | Inclusive end of the period |

## `ReportResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/reporting/interfaces/rest/resources/ReportResource.java`
- Example: [`responses/ReportResource.json`](responses/ReportResource.json) | JSON Schema: [`schemas/reporting/ReportResource.schema.json`](../../schemas/reporting/ReportResource.schema.json)
- Used by: `POST /api/v1/reports`, `GET /api/v1/reports/{reportId}`, `GET /api/v1/reports`
- Embedded in: `PagedReportResource`
- Serialization: `@JsonInclude(NON_NULL)` - null properties are **omitted**.
- Summary: the items of `PagedReportResource`, and of the plain listing with `include=summary`, omit `result_payload`, `kpis` and `download_url`.

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Report unique identifier |
| `name` | string | no |  | Display name of the report |
| `type` | string | no |  | documented values: `MAINTENANCE_COMPLIANCE`, `EQUIPMENT_UPTIME`, `TECHNICIAN_PERFORMANCE`, `TEMPERATURE_EXCURSION`; Report type's enum name |
| `format` | string | no |  | documented values: `PDF`, `XLSX`, `CSV`; Output format's enum name |
| `status` | string | no |  | documented values: `PENDING`, `GENERATING`, `COMPLETED`, `FAILED`; Current generation status |
| `failure_reason` | string | no |  | Why the report failed; present only when FAILED; nullable |
| `result_payload` | string | no |  | JSON array of the KPIs once completed; null otherwise; nullable |
| `user_id` | integer | no |  | Identifier of the user who requested the report |
| `site_id` | integer | no |  | Site the report covers; nullable |
| `equipment_id` | integer | no |  | Unit the report covers; nullable |
| `technician_id` | integer | no |  | Technician the report covers; nullable |
| `from` | string (date-time, UTC with Z) | no |  | Inclusive start of the period |
| `to` | string (date-time, UTC with Z) | no |  | Inclusive end of the period |
| `requested_at` | string (date-time, UTC with Z) | no |  | When the report was requested |
| `completed_at` | string (date-time, UTC with Z) | no |  | When the report reached COMPLETED or FAILED; null while in progress; nullable |
| `download_url` | string | no |  | Signed download URL valid for 15 minutes; only for a COMPLETED report read by id; nullable |
| `kpis` | array<object (`KpiResource`)> | no |  | The KPIs of a COMPLETED report, the same values as `result_payload` as a JSON array; omitted when not COMPLETED and in summaries; nullable |

## `KpiResource` (nested object)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/reporting/interfaces/rest/resources/KpiResource.java`
- Example: [`nested/KpiResource.json`](nested/KpiResource.json) | JSON Schema: [`schemas/reporting/KpiResource.schema.json`](../../schemas/reporting/KpiResource.schema.json)
- Embedded in: `ReportResource`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `key` | string | no |  | Stable machine key, to translate the label on the client. Aggregate keys: `excursion_count`, `excursion_hours`, `average_uptime_pct`, `units_in_scope`, `compliant_units`, `compliance_rate_pct`, `completed_service_requests`, `average_rating`. Per-unit keys end in `.unit_<equipment_id>`: `excursion_count`, `excursion_hours`, `mean_kinetic_temperature`, `temperature_std_dev`, `degree_minutes_out_of_range`, `time_in_range_pct`, `uptime_pct`. A report generated before keys existed carries a key derived from its label (`Total excursions` becomes `total_excursions`) |
| `label` | string | no |  | English label |
| `value` | number | no |  | Always numeric |
| `unit` | string | no |  | `""` for a plain count; otherwise `%`, `h`, `°C`, `°C·min` or `stars` |

## `ReportDownloadLinkResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/reporting/interfaces/rest/resources/ReportDownloadLinkResource.java`
- Example: [`responses/ReportDownloadLinkResource.json`](responses/ReportDownloadLinkResource.json) | JSON Schema: [`schemas/reporting/ReportDownloadLinkResource.schema.json`](../../schemas/reporting/ReportDownloadLinkResource.schema.json)
- Used by: `GET /api/v1/reports/{reportId}/download-link`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `download_url` | string | no |  | Signed `https` URL; the browser saves the file as `file_name` |
| `expires_at` | string (date-time, UTC with Z) | no |  | When the signature expires |
| `file_name` | string | no |  | Suggested file name: the report name in lower case, accents dropped, other characters replaced by `-`, plus the extension of the stored file, e.g. `excursions-october-2026.pdf`; `report-<id>.<ext>` when the name leaves nothing |
| `content_type` | string | no |  | `application/pdf`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` or `text/csv` |
| `size_bytes` | integer | no |  | File size in bytes |

## `PagedReportResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/reporting/interfaces/rest/resources/PagedReportResource.java`
- Example: [`responses/PagedReportResource.json`](responses/PagedReportResource.json) | JSON Schema: [`schemas/reporting/PagedReportResource.schema.json`](../../schemas/reporting/PagedReportResource.schema.json)
- Used by: `GET /api/v1/reports` when both `page` and `size` are sent

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `content` | array<object (`ReportResource`)> | no |  | Reports of this page as summaries, most recently requested first |
| `page` | integer | no |  | Zero-based index of this page |
| `size` | integer | no |  | Page size after capping |
| `total_elements` | integer | no |  | Reports matching the filters, across every page |
| `total_pages` | integer | no |  | Number of pages; at least 1 |
