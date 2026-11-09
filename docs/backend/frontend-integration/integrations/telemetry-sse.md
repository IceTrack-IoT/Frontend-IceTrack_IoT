# Real-time telemetry stream (Server-Sent Events)

Backend-only transport (no third party). Sources: `monitoring/interfaces/rest/TelemetryStreamController`, `monitoring/application/internal/outboundservices/streaming/StreamTicketService`, `monitoring/infrastructure/streaming/**` (`TelemetryStreamRegistry`, `TelemetryStreamEventDispatcher`, tickets), `WebSecurityConfiguration`, `application.properties` (`monitoring.telemetry-stream.*`).

Audience: the **web application** (`OWNER_ROLE`). Technicians cannot request a ticket.

## Why a ticket

Browser `EventSource` cannot send an `Authorization` header. The owner trades the JWT for a one-time ticket, then opens the stream with the ticket in the query string. `GET /api/v1/telemetry/stream` is therefore reachable without a bearer token; the ticket is its only credential.

## Step 1: ticket

`POST /api/v1/telemetry/stream-ticket` (bearer token, `OWNER_ROLE`, no body) answers `200` with `Cache-Control: no-store`:

```json
{ "ticket": "st_9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", "expires_in": 60 }
```

- Single use, valid 60 seconds, bound to the authenticated owner.
- An owner may hold up to 10 unredeemed tickets (`max-pending-tickets-per-owner`); the instance caps total tickets at 10,000. Beyond either: `429 TOO_MANY_REQUESTS` with `Retry-After: 60`.
- `403 ACCESS_DENIED` for a non-owner; `401` without a valid token.

## Step 2: open the stream

`GET /api/v1/telemetry/stream?ticket=<ticket>`; `Accept: text/event-stream` (EventSource sets it).

- The ticket is consumed by this request **whatever its outcome**. A missing, malformed, unknown, used or expired ticket answers `401` with a JSON `UNAUTHORIZED` body; `EventSource` does not retry a `401`, so request a new ticket and create a new `EventSource`.
- Response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`.
- The stream shows only the readings and alert changes of the ticket owner's units.
- At most 10 streams per owner (`max-streams-per-owner`); opening one more closes the **oldest**.
- The stream closes after **30 minutes**. Reconnect with a **new ticket** (the stored `EventSource` URL would carry a spent ticket, so close and recreate it rather than relying on automatic reconnect).
- Heartbeat: an SSE comment line (`: heartbeat`) every 25 seconds (`heartbeat-ms`) to keep proxies from closing the connection.

## Events

| SSE event name | Sent | `data` (JSON, snake_case) |
|---|---|---|
| `stream-opened` | once, first; sets `retry: 5000` ms | `{ "timeout_seconds": 1800, "heartbeat_seconds": 25 }` |
| `telemetry-update` | for every reading and alert status change | one of the two resources below, discriminated by `type` |

`type: "READING_RECORDED"` - `ReadingRecordedStreamResource`: `reading_uid`, `equipment_id`, `device_id`, `min_temperature`, `max_temperature`, `avg_temperature`, `humidity`, `sample_count`, `recorded_at`, `received_at`, `under_maintenance`.

`type: "ALERT_STATUS_CHANGED"` - `AlertStatusChangedStreamResource`: `alert_id`, `equipment_id`, `alert_type`, `severity`, `previous_status` (null when the alert has just opened), `status`, `peak_temperature`, `changed_at`.

Contracts and examples: [../api/monitoring/contracts.md](../api/monitoring/contracts.md), `api/monitoring/responses/ReadingRecordedStreamResource.json`, `api/monitoring/responses/AlertStatusChangedStreamResource.json`. Timestamps are local date-times without a zone.

## Client sketch (language neutral)

```text
ticket = POST /telemetry/stream-ticket            (with Authorization)
es = new EventSource(BASE + "/api/v1/telemetry/stream?ticket=" + ticket)
on "stream-opened"   -> note timeout_seconds; schedule reconnect a little before it
on "telemetry-update"-> switch(data.type) READING_RECORDED | ALERT_STATUS_CHANGED
on error             -> es.close(); get a new ticket; reopen with backoff
```

On every (re)connect, reload current state with `GET /api/v1/assets/equipments`, `GET /api/v1/alerts/equipment/{id}/open` and `GET /api/v1/telemetry/equipment/{id}`: the stream carries no replay, and updates are dropped (oldest first) when the server's stream queue is full.

## Operational limits to know

Tickets and open streams live in the memory of one server instance. With several replicas the backend needs sticky sessions and cross-instance fan-out (noted in `application.properties`). The backend does not set an `Access-Control-Expose-Headers`, but the SSE flow does not need any exposed header.
