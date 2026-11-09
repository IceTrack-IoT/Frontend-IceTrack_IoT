# Known limitations

Behavior of the backend that frontends must work around today, and work that is pending. Each entry states who owns the next step. Everything not listed here behaves as documented in the rest of this guide.

## Pending: periodic trigger of the device offline detection

The offline rule, the offline marking of the unit and the raising of `DEVICE_OFFLINE` alerts are implemented in `EquipmentConnectivityCommandService`, and an active `DEVICE_OFFLINE` alert is resolved by the next reading. Nothing runs the detection periodically yet, so at runtime no `DEVICE_OFFLINE` alert is raised, `online` only becomes `false` for deactivated units, and `EQUIPMENT_UPTIME` reports read 100 %. The trigger, its cadence and its threading belong to the development team (asynchronous execution). Details: [../bounded-contexts/monitoring.md](../bounded-contexts/monitoring.md#device-offline-detection).

**Frontend workaround:** derive freshness from `last_reading_at` and the policy's window (`60 s × missed_sync_windows_for_offline`).

## Timestamp conventions in transition

Every moment is now an ISO 8601 instant in UTC. Request bodies and query parameters must state `Z` or an explicit offset, and zone-less values are refused with `400`; there is no transition period. One thing remains open:

- Telemetry and report ranges are inclusive at both ends. The approved target is half-open `[from, to)`; until it ships, adjacent ranges share their boundary instant.

See [../guides/frontend-conventions.md](../guides/frontend-conventions.md).

## Contract shapes kept for compatibility

- `ReportResource.result_payload` is JSON encoded inside a string; parse it twice.
- Paged lists name their items differently: `content` (equipment, service requests) and `items` (notifications).
- `GET /api/v1/assets/equipments` returns the unpaged array unless both `page` and `size` are sent.
- `GET /api/v1/users` and `GET /api/v1/profiles/owners` only ever return the caller's own record.
- `ADDRESS_NOT_VERIFIED` uses its own body (`code`, `message`, `candidates`), and edge routes answer a rejected API key with an empty `401`.

Changing any of these would break existing clients; they are left as documented.

## Features not implemented by the backend

- No upload endpoint for intervention photos: `photo_evidence` accepts URL strings (up to 20, 2048 characters each) and validates neither scheme nor host. Clients that display them should only open `https` URLs.
- Notification texts are English only; the recipient's language is not resolved.
- Technicians receive no push for thermal alerts on the units they serve; only owners are notified of alerts.
- No aggregated dashboard metrics endpoint; dashboard cards store layout only. Compute totals from the list endpoints.
- Notification types `MAINTENANCE_REMINDER`, `LOW_BATTERY` and `SENSOR_FAILURE` have no producer.

## Security and deployment settings (development team)

- CORS allows every origin and exposes no response header, so browsers cannot read `Retry-After` or `ETag` cross-origin.
- Sign-in throttling counts failures per client address; behind a reverse proxy the forwarded-header strategy must be configured, otherwise all clients share the proxy's address.
- Access tokens are stateless for their lifetime (30 minutes by default); `logout` revokes only the refresh token.
- `GET /api/v1/roles` is open to any authenticated user.
- The default configuration keeps `open-in-view`, `show-sql` and `ddl-auto=update` on, uses placeholder defaults for the Google client id and Maps key, and fixes the report storage provider to `gcs`.

These are configuration or authorization choices; they were not changed.

## Operation with several instances

Sign-in and address-validation rate limits, telemetry stream tickets and open streams live in the memory of one instance. With several replicas, use sticky sessions and fan stream events out between instances. An outbox event that fails its maximum number of deliveries (10 by default) stays stored but is no longer retried, and only a log line records it.

## Address validation rate limit

`Retry-After` on the address-validation limit is always `60`, although the limit is a sliding window: treat it as an upper bound.

## Code-level observations without client impact

- `NotificationsContextFacade` and `ReportingContextFacade`, and a few methods of other Facades, have no callers ([../architecture/inter-context-communication.md](../architecture/inter-context-communication.md)).
- Four Facades read repositories directly instead of going through query services, and some signal "not found" with sentinel values (`0L`, empty string) that their callers translate to `Optional.empty()`.
- With the `local` report storage provider (development only) `download_url` is a `file://` URL.
