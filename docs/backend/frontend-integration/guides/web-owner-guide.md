# Web application guide (`OWNER_ROLE`)

Audience: the web frontend for business owners. Endpoints referenced here are all in [../api/endpoint-inventory.md](../api/endpoint-inventory.md); contracts in `api/<context>/contracts.md`. "Backend" means implemented in this repository; "Frontend" means you must implement it.

## 1. Session

1. Sign in: `POST /api/v1/authentication/sign-in/local` with `channel: "WEB"`, or the Google flow ([../integrations/google-oauth.md](../integrations/google-oauth.md)) with `channel: "WEB"`. Technicians are refused with `403 ROLE_CHANNEL_MISMATCH`.
2. Keep `token` in memory, `refresh_token` in protected storage. Add `Authorization: Bearer` to every call. Refresh with a single-flight interceptor on `401` ([../security/authentication.md](../security/authentication.md#4-refresh-flow)).
3. Bootstrap data after sign-in (Frontend orchestration):
   - `GET /api/v1/authentication/me` -> `id` (user id), `email`, `role`.
   - `GET /api/v1/profiles/owners/user/{id}` -> owner profile id (`id`), RUC, contact.
   - `GET /api/v1/profiles/dashboard-configs/user/{id}`; on `404 DASHBOARD_CONFIG_NOT_FOUND` create the default with `POST /api/v1/profiles/dashboard-configs` `{ user_id, default_site_id, default_temperature_range }` (needs an existing site id > 0, so create the first site before; until then skip the dashboard config).
   - `GET /api/v1/assets/sites`, `GET /api/v1/assets/equipments`.
4. Sign out: `POST /api/v1/authentication/logout` with the refresh token, then clear all client state.

## 2. Sites and equipment

| Task | Calls |
|---|---|
| Register a site | `POST /assets/sites/validate-address` -> show normalized address/pin -> `POST /assets/sites` with the returned `validation_token` ([../integrations/google-maps.md](../integrations/google-maps.md)). Tokens last 15 min |
| Edit site data | `PUT /assets/sites/{id}` (`name`, `contact_name`, `phone`) |
| Change address | validate again, then `PUT /assets/sites/{id}/address` |
| Register equipment | `POST /assets/equipments` (threshold 0 to 30 degrees C, min < max; `uid` unique, 30 chars max) |
| List / filter equipment | `GET /assets/equipments?search&status&equipment_type&site_id` (add `page` and `size` together for a paged result) |
| Equipment detail | `GET /assets/equipments/{id}`; open alerts `GET /alerts/equipment/{id}/open`; policy `GET /alert-policies/equipment/{id}`; history `GET /telemetry/equipment/{id}?from=&to=` (UTC instants with `Z`; see [frontend-conventions](frontend-conventions.md#3-dates-and-times)) |
| Change threshold / status | `PUT .../threshold`, `PUT .../status` (`409` on forbidden transitions: see the matrix in [../bounded-contexts/assets.md](../bounded-contexts/assets.md)) |
| Interventions of a unit | `GET /assets/equipments/{id}/interventions` |

`EquipmentResource.online`, `last_reading_at` and `last_known_temperature` follow the unit's telemetry: every reading batch sets `online: true` and moves the last reading forward (a batch delivered late never moves it backwards). `online` only returns to `false` when the unit is deactivated or when offline detection runs, and that detection is not scheduled yet (see [../bounded-contexts/monitoring.md](../bounded-contexts/monitoring.md#device-offline-detection)). For a reliable freshness indicator, compare `last_reading_at` with the current time (the policy's offline window is `60 s × missed_sync_windows_for_offline`) and refresh it from the stream.

## 3. Devices

1. Pair: `POST /devices` `{ equipment_id, device_uid, board_model, firmware_version? }` -> `201` with `device` and **`api_key` (only time shown)**. Display it with a copy action and warn the owner.
2. List devices of a unit: `GET /devices?equipment_id=...`.
3. Revoke: `PUT /devices/{id}/status` `{ new_status: "REVOKED" }`; re-enable by `POST /devices/{id}/rotate-api-key`; remove with `POST /devices/{id}/unpair`.
4. `device.last_seen_at` is the arrival time of the device's latest reading batch (`null` until its first one); it can back a "last seen" indicator.

## 4. Live telemetry and alerts

- Open the stream with a ticket ([../integrations/telemetry-sse.md](../integrations/telemetry-sse.md)). Re-synchronize with REST on every connect.
- Alert lifecycle buttons: acknowledge (`PUT /alerts/{id}/acknowledge`), resolve (`PUT /alerts/{id}/resolve`), dismiss (`PUT /alerts/{id}/dismiss` with mandatory `reason`, optional `evidence`). Show `409 INVALID_STATUS_TRANSITION` as "someone already changed this alert" and reload.
- Policy: `PUT /alert-policies` `{ equipment_id, sustained_excursion_minutes, hysteresis_margin_celsius (1.0 to 5.0), missed_sync_windows_for_offline }`.
- Maintenance windows: `GET /maintenance-windows?equipment_id=&from=&to=` (instants).
- Aggregated dashboard metrics (counts of open alerts, active orders, ...) have **no dedicated endpoint**: the dashboard cards (`MONITORED_EQUIPMENT`, `OPEN_ALERTS`, `ACTIVE_ORDERS`, `EQUIPMENT_STATUS`) are layout configuration only. Compute totals from the list endpoints.

## 5. Service requests and reviews

| Task | Calls |
|---|---|
| Request service | `POST /service-requests` `{ equipment_id, type, priority, description }` |
| List / filter | `GET /service-requests?status=PENDING,ACCEPTED&page=0&size=20` (`assigned_to=me` is for technicians; an owner sending it gets `400`) |
| Detail with history and maintenance windows | `GET /service-requests/{id}` |
| Choose a technician | `GET /profiles/technicians` (directory, contact data masked), `GET /profiles/technicians/{id}/public` (specialty, certification, `completed_services`, `average_rating`, `rating_available`) |
| Assign / reassign | `PUT /service-requests/{id}/assign` `{ technician_profile_id }` |
| Cancel | `PUT /service-requests/{id}/cancel` `{ reason }` (only `PENDING` or `ACCEPTED`) |
| Review | `POST /reviews` `{ service_request_id, communication, efficacy, performance, comment? }` for a `COMPLETED` request; edit with `PUT /reviews/{id}` while `now < editable_until` (48 h); read with `GET /service-requests/{id}/review` |

The request status flow and which role performs each step is in [../bounded-contexts/service-request.md](../bounded-contexts/service-request.md). Notifications about assignment and rejection reach the owner/technician through the inbox (`/notifications`); refresh the request on `SERVICE_REQUEST_UPDATE` notifications.

## 6. Reports and file access

`POST /reports` -> `202`; poll `GET /reports/{id}` until `COMPLETED`/`FAILED`; open `download_url` immediately (signed, 15 min). `GET /reports` lists history. See [../integrations/google-cloud-storage.md](../integrations/google-cloud-storage.md). Other file access: none (the backend has no upload or download endpoint for site/equipment/intervention files).

## 7. Notifications

`GET /notifications` (+ `unread-count` for the badge), `PUT /notifications/{id}/read`, `PUT /notifications/{id}/dismiss`. Notification `message` text is English only. Web push is possible only through FCM (`platform: WEB` is accepted by `PUT /notifications/device-tokens`).

## 8. Profile

`PUT /profiles/owners/{ownerId}` (own profile): `full_name`, `phone`, `street`, `number?`, `city`, `postal_code`, `country`, `ruc` (11 digits). Email is not editable.

## 9. Backend behavior vs frontend responsibility

| Backend | Frontend |
|---|---|
| Role/channel checks, ownership scoping, state machines, validation, token issuing | Role-aware navigation, hiding actions the role cannot do, mapping error codes to UI, token storage and refresh, SSE reconnection and resynchronization, time-zone display of no-zone timestamps, language of the UI |
