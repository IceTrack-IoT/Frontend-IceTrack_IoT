# Reporting - REST endpoints

Every endpoint below was discovered from the controllers named in its entry. "Declared statuses" are the `@ApiResponse` codes the controller documents. Statuses produced by shared handlers apply to every endpoint (see [../../errors/error-contract.md](../../errors/error-contract.md)): `400` for unreadable bodies, failed validation and bad parameter types; `401` for a missing or invalid bearer token; `403` for method-security denials; `500` for unexpected errors.

Base URL: see [../../README.md](../../README.md#5-base-url). All paths are relative to it. JSON bodies use `snake_case`.

| # | Method | Path | Auth | Summary |
|---|---|---|---|---|
| 1 | `POST` | `/api/v1/reports` | OWNER_ROLE | Request a new report |
| 2 | `GET` | `/api/v1/reports/{reportId}` | OWNER_ROLE | Get a report by id |
| 3 | `GET` | `/api/v1/reports/{reportId}/download-link` | OWNER_ROLE | Get a download link for a report |
| 4 | `GET` | `/api/v1/reports` | OWNER_ROLE | List my reports |
| 5 | `DELETE` | `/api/v1/reports/{reportId}` | OWNER_ROLE | Delete a report |

**`DELETE /api/v1/reports/{reportId}`** (controller `ReportsController.deleteReport`). Deletes the caller's `COMPLETED` or `FAILED` report and answers `204` with no body; its stored file is removed once the deletion commits, and a link issued before stops working. `404 REPORT_NOT_FOUND` for a report of another owner or one already deleted; `409 INVALID_STATUS_TRANSITION` while it is `PENDING` or `GENERATING` (`details` names its status).

**`SERVICE_INTERVENTION` reports.** `POST /api/v1/reports` with `type: SERVICE_INTERVENTION` documents one `COMPLETED` service request of the caller, named by `filters.service_request_id`; `from` and `to` may be left out to cover the request's own period. Additional errors: `400` when `service_request_id` is missing for this type or sent for another one, or when another type lacks `from`/`to`; `404 SERVICE_REQUEST_NOT_FOUND`; `409 INVALID_STATUS_TRANSITION` when the request is not completed. The file holds the request, its status history, the intervention and the review.

**Retries.** `POST /api/v1/reports` accepts an optional `Idempotency-Key` header (a UUID); see the README's API conventions.

## `POST /api/v1/reports`

**Request a new report** - Saves a report request for the authenticated owner in PENDING status and answers at once. The report is generated in the background: poll GET /api/v1/reports/{id} until it is COMPLETED or FAILED. A site or unit filter must belong to the caller.

| Field | Value |
|---|---|
| Bounded context | Reporting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/reporting/interfaces/rest/ReportsController.java` - method `requestReport` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `CreateReportResource` - [`requests/CreateReportResource.json`](requests/CreateReportResource.json), schema [`CreateReportResource.schema.json`](../../schemas/reporting/CreateReportResource.schema.json) |
| Declared statuses / responses | `202` - `ReportResource` ([`responses/ReportResource.json`](responses/ReportResource.json)) - Report accepted and queued for generation<br>`400` - error body - Invalid report request<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the caller is not an owner<br>`404` - error body - The requested site or unit is not reachable by the caller |
| Application flow | controller -> `reportCommandService` |

## `GET /api/v1/reports/{reportId}`

**Get a report by id** - Returns the caller's report with its status. A COMPLETED report also carries a download_url, a signed link valid for 15 minutes, and its KPIs as the `kpis` array; a FAILED report carries its failure_reason.

| Field | Value |
|---|---|
| Bounded context | Reporting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/reporting/interfaces/rest/ReportsController.java` - method `getReportById` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `reportId` (Long; Java `reportId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `ReportResource` ([`responses/ReportResource.json`](responses/ReportResource.json)) - Report found<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the caller is not an owner<br>`404` - error body - REPORT_NOT_FOUND - no such report belongs to the caller |
| Application flow | controller -> `reportQueryService`, `kpiPayloadReader` |

## `GET /api/v1/reports/{reportId}/download-link`

**Get a download link for a report** - Signs a link to download the file of the caller's COMPLETED report, valid for 15 minutes. `expires_at` is read back from the signature, so it is the exact instant the link stops working; schedule the link's expiry from it. The link is signed with `response-content-disposition=attachment; filename="<file_name>"`, so the browser saves the file instead of opening it in place. The answer carries `Cache-Control: no-store`.

| Field | Value |
|---|---|
| Bounded context | Reporting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/reporting/interfaces/rest/ReportsController.java` - method `getReportDownloadLink` |
| Authentication / authorization | OWNER_ROLE; the caller's reports only |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `reportId` (Long; Java `reportId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `ReportDownloadLinkResource` ([`responses/ReportDownloadLinkResource.json`](responses/ReportDownloadLinkResource.json)) - Download link issued; header `Cache-Control: no-store`<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - ACCESS_DENIED - the caller is not an owner<br>`404` - error body - REPORT_NOT_FOUND - no such report belongs to the caller<br>`409` - error body - INVALID_STATUS_TRANSITION - the report is not COMPLETED; `details` names its status (`Report 8 is GENERATING; a download link is only issued for a COMPLETED report`) |
| Application flow | controller -> `reportQueryService` -> `ReportFileStorage.generateDownloadUrl` |

With the local storage adapter (`reporting.storage.provider=local`, the default for development) `download_url` is the `file:` URI of the stored file, `expires_at` is the requested lifetime and `file_name` is not applied to the download.

## `GET /api/v1/reports`

**List my reports** - Lists the reports the authenticated caller has requested, most recent first, optionally filtered by name, type, status and request date; every filter combines with the others. Without paging the answer is a plain array of reports, as before; `include=summary` leaves `result_payload` and `kpis` out of each item. When **both** `page` and `size` are sent the answer is the paged envelope (`PagedReportResource`), whose items are always summaries. No item carries a `download_url`: read the report by id, or ask for its download link.

| Field | Value |
|---|---|
| Bounded context | Reporting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/reporting/interfaces/rest/ReportsController.java` - method `getReportsByUser` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | `search` (String; optional; at most 150 characters; case-insensitive fragment of `name`, `%` and `_` matched literally)<br>`type` (comma-separated `ReportType`; optional)<br>`status` (comma-separated `ReportStatus`; optional)<br>`requested_from`, `requested_to` (instants, ISO 8601 with `Z` or an offset; optional; inclusive; `requested_from` must not be after `requested_to`)<br>`include` (String; optional; only `summary`)<br>`page` (int; optional; `0` or more)<br>`size` (int; optional; `1` or more, capped at 100) |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `ReportResource` ([`responses/ReportResource.json`](responses/ReportResource.json)), or `PagedReportResource` ([`responses/PagedReportResource.json`](responses/PagedReportResource.json)) when `page` and `size` are both sent - Reports retrieved<br>`400` - `ErrorResource` - VALIDATION_ERROR - unknown type, status or include value, search longer than 150 characters, requested_from after requested_to, negative page or size below 1<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the caller is not an owner |
| Application flow | controller -> `reportQueryService`, `kpiPayloadReader` (plain listing without `include=summary` only) |
