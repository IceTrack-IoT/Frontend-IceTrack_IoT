# Reporting - REST endpoints

Every endpoint below was discovered from the controllers named in its entry. "Declared statuses" are the `@ApiResponse` codes the controller documents. Statuses produced by shared handlers apply to every endpoint (see [../../errors/error-contract.md](../../errors/error-contract.md)): `400` for unreadable bodies, failed validation and bad parameter types; `401` for a missing or invalid bearer token; `403` for method-security denials; `500` for unexpected errors.

Base URL: see [../../README.md](../../README.md#5-base-url). All paths are relative to it. JSON bodies use `snake_case`.

| # | Method | Path | Auth | Summary |
|---|---|---|---|---|
| 1 | `POST` | `/api/v1/reports` | OWNER_ROLE | Request a new report |
| 2 | `GET` | `/api/v1/reports/{reportId}` | OWNER_ROLE | Get a report by id |
| 3 | `GET` | `/api/v1/reports` | OWNER_ROLE | List my reports |

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

**Get a report by id** - Returns the caller's report with its status. A COMPLETED report also carries a download_url, a signed link valid for 15 minutes; a FAILED report carries its failure_reason.

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
| Application flow | controller -> `reportQueryService` |

## `GET /api/v1/reports`

**List my reports** - Retrieves every report the authenticated caller has requested, most recent first.

| Field | Value |
|---|---|
| Bounded context | Reporting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/reporting/interfaces/rest/ReportsController.java` - method `getReportsByUser` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `ReportResource` ([`responses/ReportResource.json`](responses/ReportResource.json)) - Reports retrieved<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the caller is not an owner |
| Application flow | controller -> `reportQueryService` |
