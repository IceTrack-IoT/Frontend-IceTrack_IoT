# Known limitations

Behavior of the backend that frontends must work around today, and work that is pending. Each entry states who owns the next step. Everything not listed here behaves as documented in the rest of this guide.

## Connectivity of units reported before arrival times were recorded

The offline detection runs every 60 seconds (`OfflineDetectionScheduler`, one instance at a time through the `scheduled_task_locks` table), raises `DEVICE_OFFLINE` alerts and marks units offline. Every `EquipmentResource` carries `connectivity`, evaluated by the server from the arrival time of the unit's latest batch (`last_received_at`). A unit whose latest batch was stored before that column existed has no arrival time yet: until its next batch, `connectivity` is judged from `last_reading_at` (the device's clock) instead. Details: [../bounded-contexts/monitoring.md](../bounded-contexts/monitoring.md#device-offline-detection).

**Frontend workaround:** none needed; read `connectivity.state` instead of `online`, which is kept for compatibility. `GET /api/v1/dashboard/summary` still judges `reporting`, `silent` and `never_reported` from `last_reading_at` by the server clock.

The equipment directory (`GET /api/v1/assets/equipments/directory`) does not carry `connectivity`: its `ETag` is a digest of the answer, and a value evaluated on every read would change it on every read. Take connectivity from `EquipmentResource` and the `connectivity-changed` stream event.

## Timestamp conventions in transition

Every moment is now an ISO 8601 instant in UTC. Request bodies and query parameters must state `Z` or an explicit offset, and zone-less values are refused with `400`; there is no transition period. One thing remains open:

- Telemetry and report ranges are inclusive at both ends. The approved target is half-open `[from, to)`; until it ships, adjacent ranges share their boundary instant.

See [../guides/frontend-conventions.md](../guides/frontend-conventions.md).

## Contract shapes kept for compatibility

- `ReportResource.result_payload` is JSON encoded inside a string; parse it twice.
- Paged lists name their items differently: `content` (equipment, devices, alerts, service requests, public technician directory) and `items` (notifications).
- `GET /api/v1/assets/equipments` and `GET /api/v1/devices` return the unpaged array unless both `page` and `size` are sent.
- A page `size` above 100 is refused with `400` by the equipment and service request listings, and capped to 100 by the device, alert and public technician directory listings.
- `NotificationResource.created_at` of a notification stored before the column existed is the moment the column was added, not the moment the notification was raised.
- `GET /api/v1/users` and `GET /api/v1/profiles/owners` only ever return the caller's own record.
- `ADDRESS_NOT_VERIFIED` uses its own body (`code`, `message`, `candidates`), and edge routes answer a rejected API key with an empty `401`.

Changing any of these would break existing clients; they are left as documented.

## Features not implemented by the backend

- No upload endpoint for intervention photos: `photo_evidence` accepts URL strings (up to 20, 2048 characters each) and validates neither scheme nor host. Clients that display them should only open `https` URLs.
- Notification `message` is English only. Clients localize from `message_key` and `message_params`; a key they do not know must fall back to `message`. Notifications stored before templates existed carry `notification.untemplated`.
- Technicians receive no push for thermal alerts on the units they serve; only owners are notified of alerts.
- Notification types `MAINTENANCE_REMINDER`, `LOW_BATTERY` and `SENSOR_FAILURE` have no producer.

## Security and deployment settings (development team)

- CORS allows every origin. It exposes `ETag`, `Retry-After`, `X-Telemetry-Bucket` and `Idempotent-Replayed` (`Access-Control-Expose-Headers`), so browsers can read them cross-origin; no other response header is exposed.
- Sign-in throttling counts failures per client address; behind a reverse proxy the forwarded-header strategy must be configured, otherwise all clients share the proxy's address.
- Access tokens are stateless for their lifetime (30 minutes by default); `logout` revokes only the refresh token.
- `GET /api/v1/roles` is open to any authenticated user.
- The default configuration keeps `open-in-view`, `show-sql` and `ddl-auto=update` on, uses placeholder defaults for the Google client id and Maps key, and fixes the report storage provider to `gcs`.

These are configuration or authorization choices; they were not changed.

## Operation with several instances

Sign-in and address-validation rate limits, telemetry stream tickets, open streams and their replay buffers live in the memory of one instance. With several replicas, use sticky sessions and fan stream events out between instances; a `last_event_id` issued by another instance, or before a restart, answers `replay_complete: false`. The offline detection is the one scheduled task that coordinates replicas: each round takes a lease in `scheduled_task_locks`, so the instances' clocks must agree to within a few seconds. An outbox event that fails its maximum number of deliveries (10 by default) stays stored but is no longer retried, and only a log line records it.

## Address validation rate limit

`Retry-After` on the address-validation limit is always `60`, although the limit is a sliding window: treat it as an upper bound.

## Code-level observations without client impact

- `NotificationsContextFacade` and `ReportingContextFacade`, and a few methods of other Facades, have no callers ([../architecture/inter-context-communication.md](../architecture/inter-context-communication.md)).
- Five Facades read repositories directly instead of going through query services (`DeviceContextFacade` does so for its device count), and some signal "not found" with sentinel values (`0L`, empty string) that their callers translate to `Optional.empty()`.
- With the `local` report storage provider (development only) `download_url` is a `file://` URL.
