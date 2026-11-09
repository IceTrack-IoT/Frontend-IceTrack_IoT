# Reporting

Package `pe.edu.upc.ice.track.platform.reporting`. API: [../api/reporting/endpoints.md](../api/reporting/endpoints.md), contracts: [../api/reporting/contracts.md](../api/reporting/contracts.md). Storage: [../integrations/google-cloud-storage.md](../integrations/google-cloud-storage.md).

## Responsibilities

Asynchronous generation of owner reports (PDF, XLSX, CSV), persistence of the generated file in object storage, status tracking and signed-link delivery.

## Package organization (actual)

```text
reporting/
  application/commandservices   ReportCommandService      application/queryservices ReportQueryService
  application/internal/eventhandlers   ReportGenerationWorker (@Async("reportTaskExecutor"), after commit)
  application/internal/strategies      report strategies per type (e.g. EquipmentUptimeStrategy, MaintenanceComplianceStrategy)
  application/internal/renderers       PDF / XLSX / CSV renderers
  application/internal/outboundservices
      acl/ExternalAssetsServiceForReporting, ExternalMonitoringServiceForReporting, ExternalProfilesServiceForReporting, ExternalServiceRequestsServiceForReporting
      storage/ReportFileStorage
  domain/model/aggregates/Report ; valueobjects ReportType, ReportFormat, ReportStatus, ReportFilters, DateRange, KpiValue, ReportFile, ReportDownloadLink, TechnicianId
  infrastructure/rendering, infrastructure/async, infrastructure/storage/{gcs,local}, infrastructure/persistence/jpa
  interfaces/acl/ReportingContextFacade ; interfaces/rest/ReportsController
```

## Contract notes

- Types: `MAINTENANCE_COMPLIANCE`, `EQUIPMENT_UPTIME`, `TECHNICIAN_PERFORMANCE`, `TEMPERATURE_EXCURSION`. Formats: `PDF`, `XLSX`, `CSV`. Statuses: `PENDING`, `GENERATING`, `COMPLETED`, `FAILED`.
- `CreateReportResource`: `name` (<=150), `type`, `format`, and `filters { site_id?, equipment_id?, technician_id?, from, to }`. `from` and `to` are required ISO 8601 instants with `Z` or an explicit offset, `from` must not be after `to` (`400`). A site or unit filter must belong to the caller (`404`). The `type`/`format` strings are trimmed and upper-cased, then parsed into `ReportType` / `ReportFormat` by `RequestReportCommandFromResourceAssembler`; send the documented upper-case values. An unknown value is rejected with `400` (assembler `IllegalArgumentException`, shown by `GlobalExceptionHandler`).
- `result_payload` (when present) is a JSON string of KPIs (`[{"label","value","unit"}]`).
- Not found / not yours: `404 REPORT_NOT_FOUND` (`message`: `No report matches the supplied identifier`).

## Internal data flow, `POST /api/v1/reports`

`ReportsController.requestReport` (`OWNER_ROLE`, `202`) -> `RequestReportCommandFromResourceAssembler` -> `ReportCommandServiceImpl`: owner via `ExternalProfilesServiceForReporting` (iam + profiles), filter ownership via `ExternalAssetsServiceForReporting` (`AssetContextFacade.existsSiteForOwner/existsEquipmentForOwner`) -> `Report` saved as `PENDING` -> `ReportRequestedEvent` (published in the transaction) -> **after commit** `ReportGenerationWorker` runs on `reportTaskExecutor`: marks `GENERATING`, selects the strategy by type, gathers data through `ExternalMonitoringServiceForReporting`, `ExternalServiceRequestsServiceForReporting`, `ExternalAssetsServiceForReporting`, renders the file, stores it with `ReportFileStorage.store` under `reports/{ownerId}/{reportId}.{ext}`, and marks `COMPLETED` (or `FAILED` with a reason). `GET /api/v1/reports/{id}` then returns the status and, when `COMPLETED`, a fresh signed `download_url`.

## Known gaps

`EQUIPMENT_UPTIME` is derived from `DEVICE_OFFLINE` alert durations (verified locally: a unit offline for 60 min of a 6 h window reports 83.33 %). Those alerts are only raised once the offline detection is scheduled, which is pending (see [monitoring.md](monitoring.md#device-offline-detection)); until then uptime reads 100 %. `ReportingContextFacade` has no callers.

`result_payload` is stored as a database large object; the report queries read it inside a read-only transaction (listing reports used to fail with `500` on PostgreSQL).

## Dependencies

Outbound: assets, monitoring, profiles/iam, service.request (ExternalServices above), storage port (GCS or local). Inbound: none in use.
