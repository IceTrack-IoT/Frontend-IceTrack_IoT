# Mobile application guide (`TECHNICIAN_ROLE`)

Audience: the mobile frontend for field technicians. Contracts are in `api/<context>/contracts.md`; this guide shows how the calls fit together. "Backend" = implemented in this repository; "Frontend" = you must implement it.

## 1. Authentication and token storage

- Sign in with `POST /api/v1/authentication/sign-in/local` (`channel: "MOBILE"`; username **or email** accepted) or the Google flow with `channel: "MOBILE"` ([../integrations/google-oauth.md](../integrations/google-oauth.md)). Owners are refused with `403 ROLE_CHANNEL_MISMATCH`.
- Store `refresh_token` in the OS secure store (Keychain / Keystore) and keep `token` in memory. The refresh token is bound to the `MOBILE` channel and lives 7 days (default); every refresh returns a **new** refresh token that must replace the stored one atomically.
- Refresh on `401` with a serialized single-flight refresh, replay the failed request once ([../security/authentication.md](../security/authentication.md#4-refresh-flow)). On `REFRESH_TOKEN_REPLAY_DETECTED`, `REVOKED`, `EXPIRED`, `INVALID`: sign out locally and require sign-in.
- Bootstrap: `GET /authentication/me` (user id) -> `GET /profiles/technicians/user/{id}` (technician profile id; needed to recognize "mine" in results).

## 2. Push notification token registration

After sign-in and on every app start, call `PUT /api/v1/notifications/device-tokens` `{ token, platform: "ANDROID" | "IOS" }` with the current FCM token (idempotent; also whenever FCM rotates it). On sign-out call `DELETE /api/v1/notifications/device-tokens?token=...` before discarding tokens. Pushes carry `notification_id`, `type`, `severity` and optional `equipment_id`, `alert_id` ([../integrations/firebase-cloud-messaging.md](../integrations/firebase-cloud-messaging.md)). Technicians are pushed assignment changes and cancellations; thermal alert pushes go to owners only. Use `GET /notifications` as the source of truth.

## 3. Assignment retrieval

`GET /api/v1/service-requests?assigned_to=me&status=PENDING,ACCEPTED,IN_PROGRESS&page=0&size=20` returns `PagedServiceRequestResource` (`content[]`, newest first). Technicians always see only requests assigned to them, with or without `assigned_to=me`. `GET /service-requests/{id}` gives the full request (history, maintenance windows, intervention, and `edge_grant` only in the `accept`/regenerate responses).

## 4. State changes

| Action | Call | Notes |
|---|---|---|
| Accept | `PUT /service-requests/{id}/accept` | Returns `edge_grant.token` once; store it securely with the request |
| Reject | `PUT /service-requests/{id}/reject` `{ reason }` | The request returns to the owner unassigned |
| Start | `PUT /service-requests/{id}/start` with optional `{ started_at }` | `started_at` is the device instant (UTC `Z`), not in the future; repeat with the same value is a no-op |
| Complete | `POST /interventions` | Completes the request ([section 6](#6-intervention-submission)) |
| Lost edge grant | `POST /service-requests/{id}/edge-grant` | Revokes the previous token, returns a new one once |

`accept`, `reject` and `start` are **not** safe to replay blindly: repeating `accept` on an already accepted request is `409 INVALID_STATUS_TRANSITION`. After a lost response, re-read the request (`GET /service-requests/{id}`) and continue from its `status`.

## 5. Equipment, telemetry, location and navigation

- Equipment detail while assigned: `GET /assets/equipments/{equipmentId}` (a unit with no active assignment is `404`). The ids come from `ServiceRequestResource.equipment_id` and `site_id`.
- Site and location: `GET /assets/sites/{siteId}` -> `address`, `contact_name`, `phone`, `location {latitude, longitude, place_id}` and `navigation_url` (a ready Google Maps directions URL; open it with the platform's URL launcher). Technicians can read only the site of an active assignment. The backend does not geocode for the mobile app; maps rendering is the app's job.
- Current thresholds and policy: `GET /alert-policies/equipment/{id}` (read allowed).
- History: `GET /telemetry/equipment/{id}?from=2026-09-29T05:00:00Z&to=2026-09-30T04:59:59Z` for the local day of a user at UTC-5 (UTC instants with `Z`).
- Open alerts: `GET /alerts/equipment/{id}/open`.
- The technician cannot change equipment status, thresholds, alerts or devices, and has no stream endpoint.
- On-site gateway operations (maintenance mode, buzzer, local status) use the edge grant against the gateway's own local API, which is outside this backend.

## 6. Intervention submission

`POST /api/v1/interventions` (technician, request must be `IN_PROGRESS` and assigned to the caller):

```json
{
  "service_request_id": 42,
  "client_generated_id": "3f2b8c1e-6a4d-4e0b-9a51-2c7d8e9f0a1b",
  "diagnosis": "Compressor relay burnt",
  "actions_taken": "Replaced the start relay and tested the cycle",
  "spare_parts": ["Start relay 4TM"],
  "photo_evidence": ["https://cdn.example.com/photos/42-1.jpg"],
  "completed_at": "2026-10-23T16:30:00Z"
}
```

`diagnosis`, `actions_taken` max 2000, `spare_parts` max 50 items of max 100 chars, `photo_evidence` max 20 items of max 2048 chars. `completed_at` is optional; sent earlier than the start it is `400`. `201` on first registration (request becomes `COMPLETED`); `200` with the stored intervention on replay of the same `client_generated_id` for the same request; `409 DUPLICATE_RESOURCE_CONFLICT` when that id belongs to another request.

**File upload:** the backend has **no endpoint to upload photos**. `photo_evidence` accepts URL strings only. The app must upload images somewhere it controls (for example its own storage) and send the resulting URLs; the backend neither validates nor hosts them.

## 7. Offline operation

- Backend: supports idempotent replay of `POST /interventions` (`client_generated_id`) and of `start` (same `started_at`), and accepts a device-supplied `completed_at`/`started_at`. It stores no offline queue.
- Frontend: persist pending interventions locally with a UUID generated once per intervention; replay oldest-first when connectivity returns; on `200` or `201` mark as synced; on `409 INVALID_STATUS_TRANSITION` re-read the request (it may have been canceled or reassigned); on `404` the request is no longer assigned to you, ask the user before discarding. Keep `accept`/`reject`/`start` online-only or reconcile by re-reading.
- Reads (assignments, equipment, site) are cacheable on the client; the backend sends no cache headers except `no-store` on stream tickets and `ETag` on the edge config.

## 8. Profile

`PUT /profiles/technicians/{technicianId}` (own profile): `full_name`, `phone`, `street`, `number?`, `city`, `postal_code`, `country`, `speciality`, `certification_number` (3 to 50 letters, digits, `-`, `.`, `/`). `GET /service-requests/{id}/review` lets a technician read the review about them.

## 9. Backend behavior vs frontend responsibility

| Backend | Frontend (mobile) |
|---|---|
| Channel checks, assignment scoping, state machine, idempotent intervention registration, edge grant issue/revoke, push delivery | Secure storage, token refresh queue, FCM registration lifecycle, offline queue and replay, image upload to its own storage, opening maps/navigation, language of the UI (notification text is English only) |
