# Web application guide (`OWNER_ROLE`)

Audience: the web frontend for business owners. Endpoints referenced here are all in [../api/endpoint-inventory.md](../api/endpoint-inventory.md); contracts in `api/<context>/contracts.md`. "Backend" means implemented in this repository; "Frontend" means you must implement it.

## 1. Session

1. Sign in: `POST /api/v1/authentication/sign-in/local` with `channel: "WEB"`, or the Google flow ([../integrations/google-oauth.md](../integrations/google-oauth.md)) with `channel: "WEB"`. Technicians are refused with `403 ROLE_CHANNEL_MISMATCH`.
2. Keep `token` in memory, `refresh_token` in protected storage. Add `Authorization: Bearer` to every call. Refresh with a single-flight interceptor on `401` ([../security/authentication.md](../security/authentication.md#4-refresh-flow)).
3. Bootstrap data after sign-in (Frontend orchestration):
   - `GET /api/v1/authentication/me` -> `id` (user id), `email`, `role`.
   - `GET /api/v1/profiles/owners/user/{id}` -> owner profile id (`id`), RUC, contact.
   - `GET /api/v1/profiles/dashboard-configs/user/{id}`; on `404 DASHBOARD_CONFIG_NOT_FOUND` create the default with `POST /api/v1/profiles/dashboard-configs` `{ user_id, default_site_id, default_temperature_range }` (needs an existing site id > 0, so create the first site before; until then skip the dashboard config).
   - `GET /api/v1/assets/sites`, `GET /api/v1/assets/equipments`. Screens that only need to name units (devices, notifications, reports, service requests) read `GET /api/v1/assets/equipments/directory` instead: one conditional request with the site name of each unit.
   - `GET /api/v1/dashboard/summary` for the totals of the dashboard cards.
4. Sign out: `POST /api/v1/authentication/logout` with the refresh token, then clear all client state.

## 2. Sites and equipment

| Task | Calls |
|---|---|
| Register a site | `POST /assets/sites/validate-address` -> show normalized address/pin -> `POST /assets/sites` with the returned `validation_token` ([../integrations/google-maps.md](../integrations/google-maps.md)). Tokens last 15 min |
| Edit site data | `PUT /assets/sites/{id}` (`name`, `contact_name`, `phone`) |
| Change address | validate again, then `PUT /assets/sites/{id}/address` |
| Register equipment | `POST /assets/equipments` (threshold 0 to 30 degrees C, min < max; `uid` unique, 30 chars max) |
| List / filter equipment | `GET /assets/equipments?search&status&equipment_type&site_id` (add `page` and `size` together for a paged result). Every `EquipmentResource` carries `site_name`, so the site list is not needed to show where a unit is |
| Equipment directory | `GET /assets/equipments/directory?site_id&status=ACTIVE,MAINTENANCE`: id, uid, name, type, status, `site_id` and `site_name` of every unit, sorted by name. Keep the `ETag` and send it back in `If-None-Match`; `304` means the copy you hold is current |
| Equipment detail | `GET /assets/equipments/{id}`; open alerts `GET /alerts/equipment/{id}/open`; policy `GET /alert-policies/equipment/{id}`; history `GET /telemetry/equipment/{id}?from=&to=` (UTC instants with `Z`; see [frontend-conventions](frontend-conventions.md#3-dates-and-times)) |
| Change threshold / status | `PUT .../threshold`, `PUT .../status` (`409` on forbidden transitions: see the matrix in [../bounded-contexts/assets.md](../bounded-contexts/assets.md)) |
| Interventions of a unit | `GET /assets/equipments/{id}/interventions` |

`EquipmentResource.last_reading_at` and `last_known_temperature` follow the unit's telemetry: every reading batch moves them forward (a batch delivered late never moves them backwards). Show connectivity from `connectivity`, evaluated by the server on every read from the arrival time of the latest batch: `state` is `REPORTING`, `SILENT`, `NEVER_REPORTED` or `NOT_MONITORED`, with `last_received_at`, `silent_after_seconds`, `silent_since`, `under_maintenance` and `evaluated_at`. Between reads, keep it current without trusting the browser clock: compute `skew = evaluated_at - Date.now()` on receipt and compare `last_received_at + silent_after_seconds` with `Date.now() + skew`; `READING_RECORDED` stream events carry `received_at`, which moves `last_received_at` forward, and `connectivity-changed` events carry every state change. `online` is deprecated and kept for compatibility (see [../bounded-contexts/monitoring.md](../bounded-contexts/monitoring.md#device-offline-detection)).

## 3. Devices

1. Pair: `POST /devices` `{ equipment_id, device_uid, board_model, firmware_version? }` -> `201` with `device` and **`api_key` (only time shown)**. Display it with a copy action and warn the owner.
2. List the whole inventory with one call: `GET /devices`. Optional filters: `equipment_id`, `site_id`, `status=PAIRED,REVOKED`, `search` (device uid or board model); add `page` and `size` together for a paged result. Each device carries `paired_equipment_name` and `paired_site_id`. A `site_id` or `equipment_id` that is not the caller's answers `404`.
3. Revoke: `PUT /devices/{id}/status` `{ new_status: "REVOKED" }`; re-enable by `POST /devices/{id}/rotate-api-key`; remove with `POST /devices/{id}/unpair`.
4. `device.last_seen_at` is the arrival time of the device's latest reading batch (`null` until its first one); it can back a "last seen" indicator.

## 4. Live telemetry and alerts

- Open the stream with a ticket ([../integrations/telemetry-sse.md](../integrations/telemetry-sse.md)). Re-synchronize with REST on every connect.
- Alert lifecycle buttons: acknowledge (`PUT /alerts/{id}/acknowledge`), resolve (`PUT /alerts/{id}/resolve`), dismiss (`PUT /alerts/{id}/dismiss` with mandatory `reason`, optional `evidence`). Show `409 INVALID_STATUS_TRANSITION` as "someone already changed this alert" and reload.
- Policy: `PUT /alert-policies` `{ equipment_id, sustained_excursion_minutes, hysteresis_margin_celsius (1.0 to 5.0), missed_sync_windows_for_offline }`.
- Maintenance windows: `GET /maintenance-windows?equipment_id=&from=&to=` (instants).
- Alert list and history: `GET /alerts?status=OPEN,ACKNOWLEDGED&page=0&size=50` lists the alerts of every unit of the owner in one paged call, newest first. Filters: `status`, `equipment_id`, `site_id`, `type`, `severity`, `opened_from`, `opened_to`. Omit `status` to include resolved and dismissed alerts.
- Policies of every unit: `GET /alert-policies` (optionally `?equipment_id=10,11`, at most 100 ids) returns `{ equipment_id, source, policy }` per unit, with an `ETag`.
- Dashboard totals: `GET /dashboard/summary` (optionally `?site_id=`) returns the figures of the dashboard cards (`MONITORED_EQUIPMENT`, `OPEN_ALERTS`, `ACTIVE_ORDERS`, `EQUIPMENT_STATUS`) in one call: sites, units per status, units reporting / silent / never heard from, active alerts per status and severity, service requests per status and linked devices. The cards themselves remain layout configuration.

## 5. Service requests and reviews

| Task | Calls |
|---|---|
| Request service | `POST /service-requests` `{ equipment_id, type, priority, description }` |
| List / filter | `GET /service-requests?status=PENDING,ACCEPTED&page=0&size=20` (`assigned_to=me` is for technicians; an owner sending it gets `400`) |
| Detail with history and maintenance windows | `GET /service-requests/{id}` |
| Choose a technician | `GET /profiles/technicians/public?search&speciality&min_rating&sort=rating&page=0&size=20`: one paged call with specialty, certification, `completed_services`, `average_rating` and `rating_available` of every technician, and no personal data. `GET /profiles/technicians` (directory, contact data masked) and `GET /profiles/technicians/{id}/public` remain available |
| Assign / reassign | `PUT /service-requests/{id}/assign` `{ technician_profile_id }` |
| Cancel | `PUT /service-requests/{id}/cancel` `{ reason }` (only `PENDING` or `ACCEPTED`) |
| Review | `POST /reviews` `{ service_request_id, communication, efficacy, performance, comment? }` for a `COMPLETED` request; edit with `PUT /reviews/{id}` while `now < editable_until` (48 h); read with `GET /service-requests/{id}/review` |

The request status flow and which role performs each step is in [../bounded-contexts/service-request.md](../bounded-contexts/service-request.md). Notifications about assignment and rejection reach the owner/technician through the inbox (`/notifications`); refresh the request on `SERVICE_REQUEST_UPDATE` notifications.

## 6. Reports and file access

`POST /reports` -> `202`; poll `GET /reports/{id}` until `COMPLETED`/`FAILED`; open `download_url` immediately (signed, 15 min). `GET /reports` lists history. See [../integrations/google-cloud-storage.md](../integrations/google-cloud-storage.md). Other file access: none (the backend has no upload or download endpoint for site/equipment/intervention files).

## 7. Notifications

`GET /notifications` (+ `unread-count` for the badge), `PUT /notifications/{id}/read`, `PUT /notifications/{id}/dismiss`. Each notification carries `created_at`, when it was raised, and `service_request_id` when it is about a service request (null otherwise), which lets the UI open that request. Notification `message` text is English only. Web push is possible only through FCM (`platform: WEB` is accepted by `PUT /notifications/device-tokens`).

## 8. Profile

`PUT /profiles/owners/{ownerId}` (own profile): `full_name`, `phone`, `street`, `number?`, `city`, `postal_code`, `country`, `ruc` (11 digits). Email is not editable.

## 9. Backend behavior vs frontend responsibility

| Backend | Frontend |
|---|---|
| Role/channel checks, ownership scoping, state machines, validation, token issuing | Role-aware navigation, hiding actions the role cannot do, mapping error codes to UI, token storage and refresh, SSE reconnection and resynchronization, time-zone display of no-zone timestamps, language of the UI |
