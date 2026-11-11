# Frontend conventions and reusable contracts

Framework-neutral. Everything here is derived from the backend code; "Backend" vs "Frontend responsibility" is called out where it matters.

## 1. HTTP basics

| Item | Rule |
|---|---|
| Base URL | One configurable value (see [../README.md](../README.md#5-base-url)); all paths start with `/api/v1` |
| Methods | `GET`, `POST`, `PUT`, `PATCH` (only `PATCH /profiles/dashboard-configs/user/{userId}/cards/{cardId}/visibility`), `DELETE` (only `DELETE /notifications/device-tokens`) |
| Request headers | `Content-Type: application/json` on every request with a body; `Accept: application/json`; `Authorization: Bearer <token>` on protected calls; `Accept-Language: en` or `es` to localize error messages |
| Bodies | UTF-8 JSON, `snake_case`. Send only the properties listed in the contract (the backend does not configure unknown-property handling itself, so do not depend on either behavior) |
| Empty bodies | `204` (`logout`, device token register/unregister), `304` (edge config), and several empty `404`/`403` (see [../errors/error-contract.md](../errors/error-contract.md)) |
| Path parameters | Numeric ids. A non-numeric id is `400 VALIDATION_ERROR` |
| Query parameters | `snake_case` names (`equipment_id`, `site_id`, `equipment_type`, `unread_only`, `assigned_to`) except plain ones (`page`, `size`, `status`, `search`, `from`, `to`, `ticket`, `token`) |

## 2. Identifiers

All resource ids are `int64`. Never parse them as 32-bit integers. Two id spaces coexist and are not interchangeable:

| Id | Meaning | Example property |
|---|---|---|
| User account id | `AuthenticatedUserResource.id`, `UserResource.id`, `CurrentUserResource.id`, `OwnerProfileResource.user_id`, notification `recipient_user_id`, `DashboardConfigResource.user_id` | used in `/profiles/dashboard-configs/user/{userId}` and `/profiles/*/user/{userId}` |
| Profile id (owner / technician) | `OwnerProfileResource.id` (referenced as `owner_id`), `TechnicianProfileResource.id` (referenced as `technician_id`, `technician_profile_id`) | `AssignTechnicianResource.technician_profile_id`, `ServiceRequestResource.owner_id/technician_id` |

Resolve a profile from the signed-in account with `GET /api/v1/profiles/owners/user/{userId}` (owner) or `GET /api/v1/profiles/technicians/user/{userId}` (technician). Client-generated UUIDs: `reading_uid`, `event_uid`, `client_generated_id`, `start_event_uid`.

## 3. Dates and times

Every moment in the API is an **instant**: a point on the UTC timeline, written in ISO 8601 with a trailing `Z`, for example `2026-11-07T13:05:00Z`. There are no calendar dates and no zone-less date-times.

| Direction | Rule |
|---|---|
| Responses | Always UTC with `Z`. Fractional seconds appear when the stored value has them (`2026-10-23T13:00:00.123456Z`); do not match a fixed-length pattern |
| Request bodies | Must carry `Z` or an explicit offset: `2026-11-08T08:30:00-05:00` is the same moment as `2026-11-08T13:30:00Z`. A value without offset is refused with `400 VALIDATION_ERROR`, and so is a number (epoch seconds or milliseconds) |
| Query parameters | Same rule as bodies. Percent-encode a `+` of an offset (`%2B`) |
| Display | Convert to the user's time zone in the frontend, only for presentation |

Fields carrying a moment, by context (all UTC with `Z`):

| Context | Fields |
|---|---|
| service-request | `created_at`, `assigned_at`, `started_at`, `completed_at`, `canceled_at`; history `occurred_at`; interventions `started_at`, `completed_at`; reviews `created_at`, `editable_until`; edge grants `issued_at`, `expires_at` |
| monitoring | telemetry `recorded_at`, `received_at`; edge event `occurred_at`; alerts `triggering_recorded_at`, `opened_at`, `acknowledged_at`, `resolved_at`, `dismissed_at`; maintenance windows `started_at`, `expires_at`, `ended_at`; stream events `recorded_at`, `received_at`, `changed_at` |
| assets / device | equipment `last_reading_at`; device `last_seen_at` |
| notifications | `read_at`, `dismissed_at` |
| reporting | report `from`, `to`, `requested_at`, `completed_at` |
| iam | token error `timestamp` (refresh-token 401 only) |

Request bodies that carry a moment: `RecordReadingBatchResource.recorded_at`, `RecordEdgeEventResource.occurred_at`, `StartServiceRequestResource.started_at` (optional), `RegisterInterventionResource.completed_at` (optional), `CreateReportResource.filters.from`/`to`.

Query parameters that carry a moment:

| Endpoint | Parameters | Example |
|---|---|---|
| `GET /telemetry/equipment/{id}` | `from`, `to` (both required, inclusive today) | `from=2026-11-08T05:00:00Z&to=2026-11-09T05:00:00Z` |
| `GET /maintenance-windows` | `from`, `to` (optional, bound the window start) | `from=2026-11-01T00:00:00Z` |

**Date ranges.** The frontend turns the calendar range the user picked into instants, using the user's configured time zone, and sends those instants. For a user in America/Lima choosing 8 November 2026, the range is `from=2026-11-08T05:00:00Z`, `to=2026-11-09T05:00:00Z`. Lima has no daylight saving, so the offset is a constant -05:00; for a zone that observes daylight saving, compute each boundary from that zone's rules for that date, because the offset of the same wall-clock time can differ between days.

Interval semantics, as implemented today: `from` and `to` are both inclusive, so two adjacent ranges share their boundary instant. The approved target is half-open intervals `[from, to)`, where `to` is excluded; that change is not in the backend yet. Report filters follow the same current rule.

**Parsing responses.** Parse with a standard ISO 8601 instant parser that accepts fractional seconds of any length. Compare instants by value, never by string.

**Edge gateway.** The gateway must send `recorded_at` and `occurred_at` with `Z` or an explicit offset. The platform has no transition period: a zone-less value is rejected with `400` and the batch is not stored.

## 4. Pagination

| Endpoint | Paging |
|---|---|
| `GET /assets/equipments` | Optional. Send **both** `page` (0-based) and `size` (1 to 100) to receive `PagedEquipmentResource` `{content, page, size, total_elements, total_pages}`; otherwise a plain JSON array |
| `GET /service-requests` | Always paged: `PagedServiceRequestResource` `{content, page, size, total_elements, total_pages}`; `size` max 100; ordered by creation date, newest first |
| `GET /notifications` | Always paged: `PagedNotificationResource` `{items, page, size, total_elements, total_pages}`; default `size` 20, max 100 |
| everything else | Plain arrays, unpaged |

## 5. Frontend model organization (language-neutral)

Keep one model per backend resource, named like the backend record, grouped by context:

```text
models/
  iam/        SignInWithLocalRequest, SignInWithGoogleRequest, RefreshTokenRequest, AuthenticatedUser, CurrentUser, ...
  profiles/   OwnerProfile, TechnicianProfile, TechnicianPublicProfile, DashboardConfig, DashboardCard, TemperatureRange, ...
  assets/     Site, Equipment, PagedEquipment, RegisterSiteRequest, AddressValidation, GeoLocation, Pin, ...
  device/     Device, DeviceCredential, RegisterDeviceRequest, ChangeDeviceStatusRequest
  monitoring/ Alert, AlertPolicy, SensorReading, MaintenanceWindow, ReadingRecordedUpdate, AlertStatusChangedUpdate, StreamTicket
  notifications/ Notification, PagedNotification, UnreadNotificationCount, RegisterDeviceTokenRequest
  reporting/  Report, CreateReportRequest, ReportFilters
  service-request/ ServiceRequest, StatusTransition, Intervention, IssuedEdgeGrant, Review, MaintenanceWindowLink, requests...
  shared/     ErrorBody, AuthErrorBody, AddressNotVerifiedBody
enums/        one file per enum in api/enums.md; keep an "unknown" fallback when decoding so a new backend value does not crash the client
```

Use the JSON Schemas in [../schemas/](../schemas/) to generate or validate models with whatever tooling your platform offers. Each `schemas/<context>/<Resource>.schema.json` has an `x-source` property naming the Java record. Nested schemas are referenced by relative `$ref`.

Per-context service definitions should mirror the controllers one-to-one (see `api/<context>/endpoints.md`). A neutral declaration looks like:

```text
service Assets {
  registerEquipment(RegisterEquipmentRequest)   POST   /api/v1/assets/equipments                 -> Equipment
  listEquipment(filter?, page?)                 GET    /api/v1/assets/equipments?search&status&equipment_type&site_id&page&size -> Equipment[] | PagedEquipment
  changeThreshold(id, ChangeThresholdRequest)   PUT    /api/v1/assets/equipments/{id}/threshold  -> Equipment
}
```

Nullable handling: properties of resources annotated `NON_NULL` (`ErrorResource`, `ReportResource`, `SiteResource.location`/`navigation_url`, `ServiceRequestResource.edge_grant`) are **absent** when empty. All other nullable properties are present as `null`. Decode both as "optional".

## 6. Error model (union)

```text
ErrorBody        { code: string, message?: string, details?: string }
AuthErrorBody    { timestamp, status, error, code (REFRESH_TOKEN_*), message }       // refresh-token 401 only
AddressNotVerifiedBody { code, message, candidates: string[] }                         // 422 on validate-address only
(no body)        401 on edge routes, empty 404s, empty 403s on device tokens, 204, 304
```

Decode by HTTP status first, then by content type; if the body is empty, use only the status. See [../errors/error-contract.md](../errors/error-contract.md) for the full guide.

## 7. Idempotency and retries

| Operation | Safe to retry? |
|---|---|
| All `GET` | yes |
| `PUT`s that replace state (`/threshold`, `/status`, `/layout`, `/defaults`, profile updates) | yes, same result |
| `PUT /service-requests/{id}/start` with the same `started_at` | yes (idempotent no-op) |
| `POST /interventions` with the same `client_generated_id` | yes (`200` with the stored record); the id must be generated once per intervention and stored with the offline queue entry |
| `PUT /notifications/device-tokens`, `DELETE ...device-tokens`, `POST /logout`, `PUT .../read`, `PUT .../dismiss` | yes |
| `POST /authentication/refresh-token` | **no**: the refresh token is single use; serialize and store the new one |
| `POST /service-requests`, `/reviews`, `/devices`, `/assets/equipments`, `/assets/sites`, `/reports` | yes, when the request carries an `Idempotency-Key` header (a UUID generated once per submission and reused only for its retries). The same key with the same body answers the first result again with `Idempotent-Replayed: true`; the same key with another body, or while the first request still runs, answers `409 IDEMPOTENCY_KEY_CONFLICT`. A key is remembered for 24 hours per caller and endpoint. Without the header, a retry after an unknown outcome can create a duplicate (equipment `uid` and device `device_uid` are unique so those answer `409`) |
| `POST /devices/{id}/rotate-api-key`, `/service-requests/{id}/edge-grant` | each call issues a new secret and invalidates the previous one |
| `POST /assets/sites/{siteId}/geocoding/retry` | yes in effect: a retry on a `RESOLVED` site answers `409 INVALID_STATUS_TRANSITION`; a retry while `PENDING` is refused by the shared quota (`429`) when sent too often |

**Idempotency-Key replay (creating endpoints).** A replay repeats the stored status and body of the first answer. The body of a replayed `201` from `POST /devices` has no `api_key`, because the plaintext key is never stored. Only a 2xx answer is remembered; a first request that failed frees its key, so the corrected request can reuse it. A key that is not a UUID answers `400 VALIDATION_ERROR`. Generate a new key for each new submission, never for a different body.

## 7.1 Concurrent edits (`If-Match`)

Every resource that can be edited by two clients at once carries an integer `version`: `SiteResource`, `EquipmentResource`, `OwnerProfileResource`, `DashboardConfigResource`. The version grows on every change of what the owner edits; for an equipment, telemetry (readings, `online`, maintenance coverage) does not move it.

| Endpoint | Accepts `If-Match` |
|---|---|
| `PUT /assets/sites/{siteId}`, `PUT /assets/sites/{siteId}/address` | yes |
| `PUT /assets/equipments/{id}`, `PUT /assets/equipments/{id}/threshold`, `PUT /assets/equipments/{id}/status` | yes |
| `PUT /profiles/owners/{ownerId}` | yes |
| `PUT .../dashboard-configs/user/{userId}/layout`, `PATCH .../cards/{cardId}/visibility`, `PUT .../defaults` | yes |

Send the `version` you read, quoted or bare (`If-Match: "3"` or `If-Match: 3`). A stale version answers `409 CONCURRENT_MODIFICATION_CONFLICT` with `details` naming the current version and changes nothing: reload, show the change, and let the owner retry. A malformed `If-Match` answers `400`. Without the header, only writes that overlap in time are refused.

## 7.2 Session bootstrap

`GET /api/v1/me/context` answers the signed-in account, its owner profile (with the address parts), its dashboard configuration (`null` while not set up), the owner's site and unit counts, and the server time, in one request. Use it instead of chaining `/authentication/me`, the owner profile and the dashboard reads after sign-in. Keep `/authentication/me` for session restoration. `server_time` lets the client compute its clock skew once. The answer is never cached.

| Helper | Owner | Technician |
|---|---|---|
| `GET /api/v1/profiles/owners/me` | yes | `403` |
| `GET /api/v1/profiles/dashboard-configs/me` | yes | yes |

Both `/me` reads answer `404` (`OWNER_NOT_FOUND`, `DASHBOARD_CONFIG_NOT_FOUND`) when there is nothing to show yet.

## 8. Secrets that appear exactly once

| Secret | Property | Endpoint |
|---|---|---|
| Device API key | `api_key` | `POST /devices`, `POST /devices/{id}/rotate-api-key` |
| Edge grant token | `edge_grant.token` | `PUT /service-requests/{id}/accept`, `POST /service-requests/{id}/edge-grant` |
| Stream ticket | `ticket` | `POST /telemetry/stream-ticket` |
| Refresh token | `refresh_token` | every sign-in and refresh |

Show these to the user (or hand them to the target component) immediately and never log them. The backend stores only digests, so they cannot be shown again.
