# Cloud storage for report files (Google Cloud Storage)

Sources: `reporting/application/internal/outboundservices/storage/ReportFileStorage`, `reporting/infrastructure/storage/gcs/GcsReportFileStorage`, `GcsStorageConfiguration`, `reporting/infrastructure/storage/local/LocalReportFileStorage`, `reporting/application/internal/queryservices/ReportQueryServiceImpl`, `reporting/application/internal/eventhandlers/ReportGenerationWorker`, `ReportsController`, `application.properties` (`reporting.storage.*`).

## Naming clarification

The only storage integration in the code is **Google Cloud Storage** through the `com.google.cloud:google-cloud-storage` client (bucket `icetrack-reports` in `application.properties`). It is **not Firebase Cloud Storage** and does not use the Firebase SDK. Firebase appears only for push messaging; see [firebase-cloud-messaging.md](firebase-cloud-messaging.md).

## What is stored and who touches it

| Question | Answer |
|---|---|
| Which context uses storage | Reporting only |
| Which port | `ReportFileStorage` (`store`, `generateDownloadUrl`, `delete`) |
| Adapters | `GcsReportFileStorage` (`reporting.storage.provider=gcs`) and `LocalReportFileStorage` (`local`, the fallback when the property is missing) |
| What is stored | Generated report files (PDF, XLSX or CSV), written by the backend after rendering |
| Who uploads | **Only the backend**, in the background report worker. There is no file upload endpoint and the frontend never writes to the bucket |
| Who downloads | The frontend, directly from Google, through a time-limited signed URL |
| Access control | The bucket objects are private. A V4 **signed URL** (`Storage.signUrl` with `withV4Signature`) valid for **15 minutes** (`ReportQueryServiceImpl.SIGNED_URL_TTL`) is generated each time a `COMPLETED` report is read |
| Ownership | `GET /api/v1/reports/{id}` and the list only return the caller's reports, so only the owner obtains a link |

## Frontend flow

1. `POST /api/v1/reports` (`CreateReportResource`) answers `202` with a `ReportResource` in `PENDING` status.
2. Poll `GET /api/v1/reports/{reportId}` (for example every 2 to 5 seconds, with a timeout) until `status` is `COMPLETED` or `FAILED`. Statuses: `PENDING`, `GENERATING`, `COMPLETED`, `FAILED`.
3. `COMPLETED`: the response carries `download_url` (a signed Google URL, valid 15 minutes) and `completed_at`. Open or fetch it immediately. Do not store the URL; call `GET /api/v1/reports/{id}` again for a new one.
4. `FAILED`: `failure_reason` explains why (for example insufficient telemetry for the period).
5. `GET /api/v1/reports` lists every report of the caller, most recent first. Entries that are `COMPLETED` carry fresh signed links too.

`ReportResource` is `NON_NULL`: `failure_reason`, `result_payload`, `site_id`, `equipment_id`, `technician_id`, `completed_at`, `download_url` are **omitted** when absent. `result_payload` is a **string containing JSON** (an array of `{label, value, unit}` KPIs), so parse it a second time.

## File metadata

The API exposes no file name, size or content-type property. The format is `format` (`PDF`, `XLSX`, `CSV`); the object key is `reports/{ownerId}/{reportId}.{ext}` (`ReportGenerationWorker`) and is embedded in the signed URL. The storage content type is set by the backend when storing.

## Error handling

| Case | Behavior |
|---|---|
| Report not found or not yours | `404 REPORT_NOT_FOUND`, `message`: `No report matches the supplied identifier` |
| Generation failed | `200` with `status: FAILED` and `failure_reason`; there is no error status |
| Signed URL expired | Google answers `4xx`; fetch the report again to get a new URL |
| Not an owner | `403 ACCESS_DENIED` |

## Environment notes

`reporting.storage.provider` is fixed to `gcs` in `application.properties` (no environment override); the credentials path comes from `GCS_CREDENTIALS_PATH` (default `/icetrack-sa.json`). With the `local` provider `download_url` would be a `file://` URL that is not usable by a remote client.

## Verification against the provider

Exercised locally with the development bucket and service account (`GCS_CREDENTIALS_PATH`):

| Check | Result |
|---|---|
| Upload by the backend | `CSV`, `PDF` and `XLSX` reports stored as `reports/{ownerId}/{reportId}.{ext}` with the matching content type |
| Signed download URL | V4 (`GOOG4-RSA-SHA256`), `X-Goog-Expires=900` (15 minutes), host `storage.googleapis.com` |
| Download through the signed URL | `200` with valid file content (`%PDF` header, XLSX zip container, CSV text) |
| Tampered signature, or another object under the same signature | `403` from Google (`SignatureDoesNotMatch`) |
| The same URL after 15 minutes | `400` from Google (`ExpiredToken`); request `GET /api/v1/reports/{id}` again for a fresh link |
| `GET /api/v1/reports` (list) | `200`; it answered `500` before the report queries were moved into a read-only transaction (`result_payload` is a database large object) |

The test objects were deleted afterwards.

