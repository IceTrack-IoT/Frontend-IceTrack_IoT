# Monitoring and Alerting - REST endpoints

Every endpoint below was discovered from the controllers named in its entry. "Declared statuses" are the `@ApiResponse` codes the controller documents. Statuses produced by shared handlers apply to every endpoint (see [../../errors/error-contract.md](../../errors/error-contract.md)): `400` for unreadable bodies, failed validation and bad parameter types; `401` for a missing or invalid bearer token; `403` for method-security denials; `500` for unexpected errors.

Base URL: see [../../README.md](../../README.md#5-base-url). All paths are relative to it. JSON bodies use `snake_case`.

| # | Method | Path | Auth | Summary |
|---|---|---|---|---|
| 1 | `GET` | `/api/v1/alert-policies/equipment/{equipmentId}` | OWNER_ROLE or TECHNICIAN_ROLE | Get alert policy by equipment |
| 2 | `PUT` | `/api/v1/alert-policies` | OWNER_ROLE | Create or update an alert policy |
| 3 | `GET` | `/api/v1/alerts/{alertId}` | OWNER_ROLE or TECHNICIAN_ROLE | Get alert by ID |
| 4 | `GET` | `/api/v1/alerts/equipment/{equipmentId}/open` | OWNER_ROLE or TECHNICIAN_ROLE | Get open alerts by equipment |
| 5 | `PUT` | `/api/v1/alerts/{alertId}/acknowledge` | OWNER_ROLE | Acknowledge an alert |
| 6 | `PUT` | `/api/v1/alerts/{alertId}/resolve` | OWNER_ROLE | Resolve an alert |
| 7 | `PUT` | `/api/v1/alerts/{alertId}/dismiss` | OWNER_ROLE | Dismiss an alert |
| 8 | `POST` | `/api/v1/telemetry/events` | Device API key (`X-API-Key`), authority `DEVICE_ROLE`; no user JWT | Record an edge event |
| 9 | `GET` | `/api/v1/maintenance-windows` | OWNER_ROLE | List the maintenance windows of a unit |
| 10 | `POST` | `/api/v1/telemetry` | Device API key (`X-API-Key`), authority `DEVICE_ROLE`; no user JWT | Record an aggregated reading batch |
| 11 | `GET` | `/api/v1/telemetry/equipment/{equipmentId}` | OWNER_ROLE or TECHNICIAN_ROLE | Get reading history by equipment |
| 12 | `POST` | `/api/v1/telemetry/stream-ticket` | OWNER_ROLE | Issue a telemetry stream ticket |
| 13 | `GET` | `/api/v1/telemetry/stream` | None (no JWT). Single-use stream ticket in `?ticket=` | Open the telemetry stream |

## `GET /api/v1/alert-policies/equipment/{equipmentId}`

**Get alert policy by equipment** - Retrieves the alert policy applicable to an equipment: the equipment-specific policy when one is active, otherwise the platform-wide default. Owners read the policy of their own units; technicians of units they hold an active service request on.

| Field | Value |
|---|---|
| Bounded context | Monitoring and Alerting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/AlertPoliciesController.java` - method `getPolicyByEquipment` |
| Authentication / authorization | OWNER_ROLE or TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `equipmentId` (Long; Java `equipmentId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `AlertPolicyResource` ([`responses/AlertPolicyResource.json`](responses/AlertPolicyResource.json)) - Policy found<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`404` - error body - EQUIPMENT_NOT_FOUND - no such equipment is reachable by the caller |
| Application flow | controller -> `alertPolicyQueryService` |

## `PUT /api/v1/alert-policies`

**Create or update an alert policy** - Creates or updates the alert policy of one of the caller's units. The platform-wide default policy is managed by configuration and cannot be changed here.

| Field | Value |
|---|---|
| Bounded context | Monitoring and Alerting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/AlertPoliciesController.java` - method `updatePolicy` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `UpdateAlertPolicyResource` - [`requests/UpdateAlertPolicyResource.json`](requests/UpdateAlertPolicyResource.json), schema [`UpdateAlertPolicyResource.schema.json`](../../schemas/monitoring/UpdateAlertPolicyResource.schema.json) |
| Declared statuses / responses | `200` - `AlertPolicyResource` ([`responses/AlertPolicyResource.json`](responses/AlertPolicyResource.json)) - Policy created or updated successfully<br>`400` - `ErrorResource` - Invalid input data<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - `ErrorResource` - Forbidden - the caller is not an owner<br>`404` - `ErrorResource` - No such equipment is reachable by the caller |
| Application flow | controller -> `alertPolicyCommandService` |

## `GET /api/v1/alerts/{alertId}`

**Get alert by ID** - Retrieves a specific alert, including its type, severity, status and the peak temperature observed during the excursion that raised it. Owners read alerts of their own units; technicians read alerts of units they hold an active service request on.

| Field | Value |
|---|---|
| Bounded context | Monitoring and Alerting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/AlertsController.java` - method `getAlertById` |
| Authentication / authorization | OWNER_ROLE or TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `alertId` (Long; Java `alertId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `AlertResource` ([`responses/AlertResource.json`](responses/AlertResource.json)) - Alert found<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`404` - error body - ALERT_NOT_FOUND - no such alert is reachable by the caller |
| Application flow | controller -> `alertQueryService` |

## `GET /api/v1/alerts/equipment/{equipmentId}/open`

**Get open alerts by equipment** - Retrieves the alerts currently OPEN or ACKNOWLEDGED for an equipment, used to populate the equipment detail view and the dashboard open-alerts card. A unit the caller may not read yields an empty list.

| Field | Value |
|---|---|
| Bounded context | Monitoring and Alerting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/AlertsController.java` - method `getOpenAlertsByEquipment` |
| Authentication / authorization | OWNER_ROLE or TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `equipmentId` (Long; Java `equipmentId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `AlertResource` ([`responses/AlertResource.json`](responses/AlertResource.json)) - Open alerts found<br>`401` - error body - Unauthorized - JWT token required or invalid |
| Application flow | controller -> `alertQueryService` |

## `PUT /api/v1/alerts/{alertId}/acknowledge`

**Acknowledge an alert** - Transitions an OPEN alert of one of the caller's units to ACKNOWLEDGED, signaling that the owner has seen it without yet resolving the underlying condition. The caller and the instant are recorded as acknowledged_by and acknowledged_at.

| Field | Value |
|---|---|
| Bounded context | Monitoring and Alerting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/AlertsController.java` - method `acknowledgeAlert` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `alertId` (Long; Java `alertId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `AlertResource` ([`responses/AlertResource.json`](responses/AlertResource.json)) - Alert acknowledged<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the caller is not an owner<br>`404` - `ErrorResource` - ALERT_NOT_FOUND - no such alert is reachable by the caller<br>`409` - `ErrorResource` - INVALID_STATUS_TRANSITION - the alert is not OPEN |
| Application flow | controller -> `alertCommandService` |

## `PUT /api/v1/alerts/{alertId}/resolve`

**Resolve an alert** - Closes an OPEN or ACKNOWLEDGED alert of one of the caller's units once the underlying condition has been corrected. The caller and the instant are recorded as resolved_by and resolved_at, and total_duration_seconds becomes available.

| Field | Value |
|---|---|
| Bounded context | Monitoring and Alerting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/AlertsController.java` - method `resolveAlert` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `alertId` (Long; Java `alertId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `AlertResource` ([`responses/AlertResource.json`](responses/AlertResource.json)) - Alert resolved<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the caller is not an owner<br>`404` - `ErrorResource` - ALERT_NOT_FOUND - no such alert is reachable by the caller<br>`409` - `ErrorResource` - INVALID_STATUS_TRANSITION - the alert is already RESOLVED or DISMISSED |
| Application flow | controller -> `alertCommandService` |

## `PUT /api/v1/alerts/{alertId}/dismiss`

**Dismiss an alert** - Closes an OPEN or ACKNOWLEDGED alert of one of the caller's units as a false alarm, such as a planned defrost cycle, without asserting that the underlying condition was resolved. A non-blank reason is mandatory; evidence is optional. The caller, the instant and the reason are recorded as dismissed_by, dismissed_at and dismiss_reason. Dismissed alerts are excluded from thermal excursion reports.

| Field | Value |
|---|---|
| Bounded context | Monitoring and Alerting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/AlertsController.java` - method `dismissAlert` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `alertId` (Long; Java `alertId`) |
| Query parameters | none |
| Request body | `DismissAlertResource` - [`requests/DismissAlertResource.json`](requests/DismissAlertResource.json), schema [`DismissAlertResource.schema.json`](../../schemas/monitoring/DismissAlertResource.schema.json) |
| Declared statuses / responses | `200` - `AlertResource` ([`responses/AlertResource.json`](responses/AlertResource.json)) - Alert dismissed<br>`400` - `ErrorResource` - VALIDATION_ERROR - the body is missing, the reason is blank, or a field is too long<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the caller is not an owner<br>`404` - `ErrorResource` - ALERT_NOT_FOUND - no such alert is reachable by the caller<br>`409` - `ErrorResource` - INVALID_STATUS_TRANSITION - the alert is already RESOLVED or DISMISSED |
| Application flow | controller -> `alertCommandService` |

## `POST /api/v1/telemetry/events`

**Record an edge event** - Records an event detected by the gateway, idempotently by event_uid. THERMAL_EXCURSION_DETECTED opens a CRITICAL alert dated at occurred_at (201), unless the unit already has an OPEN or ACKNOWLEDGED one (200, ALERT_ALREADY_ACTIVE) or a maintenance window covers occurred_at (200, SUPPRESSED_BY_MAINTENANCE). THERMAL_EXCURSION_NORMALIZED resolves the active alert, recording the peak temperature and total duration (200, ALERT_RESOLVED), or changes nothing when none is active (200, NO_ACTIVE_ALERT). MAINTENANCE_WINDOW_STARTED (requires origin) opens the unit's maintenance window dated at occurred_at (201, MAINTENANCE_WINDOW_OPENED); while one is active, an APP start takes over a BUTTON window (200, MAINTENANCE_WINDOW_PROMOTED) and any other start keeps it (200, MAINTENANCE_ALREADY_ACTIVE). MAINTENANCE_WINDOW_ENDED (requires closure_reason) closes the window named by start_event_uid, or the active one (201, MAINTENANCE_WINDOW_CLOSED), or changes nothing (200, NO_ACTIVE_MAINTENANCE). A resent event_uid answers 200 with the stored outcome. Reading batches never open alerts; only these events do. Authenticated by the X-API-Key header only.

| Field | Value |
|---|---|
| Bounded context | Monitoring and Alerting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/EdgeEventsController.java` - method `recordEvent` |
| Authentication / authorization | Device API key (`X-API-Key`), authority `DEVICE_ROLE`; no user JWT |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `X-API-Key: <device api key>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `RecordEdgeEventResource` - [`requests/RecordEdgeEventResource.json`](requests/RecordEdgeEventResource.json), schema [`RecordEdgeEventResource.schema.json`](../../schemas/monitoring/RecordEdgeEventResource.schema.json) |
| Declared statuses / responses | `201` - `EdgeEventResource` ([`responses/EdgeEventResource.json`](responses/EdgeEventResource.json)) - New alert or maintenance window opened, or window closed<br>`200` - `EdgeEventResource` ([`responses/EdgeEventResource.json`](responses/EdgeEventResource.json)) - Event processed without creating anything, or already recorded<br>`400` - `ErrorResource` - VALIDATION_ERROR - a missing field, an unknown type, a detection without temperature_celsius, a window start without origin, a window end without closure_reason, or a temperature outside -50 to 60 °C<br>`401` - error body - Missing, unknown, revoked or malformed API key<br>`403` - `ErrorResource` - equipment_id or device_id does not match the authenticated device<br>`409` - `ErrorResource` - event_uid was already recorded by another device |
| Application flow | controller -> `edgeEventCommandService` |

## `GET /api/v1/maintenance-windows`

**List the maintenance windows of a unit** - Returns the maintenance windows of one of the caller's units, newest first: origin, start, expiration, end, closure reason, the service request and technician when known, and an unlinked flag. from and to, both optional and ISO-8601, bound the window start inclusively.

| Field | Value |
|---|---|
| Bounded context | Monitoring and Alerting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/MaintenanceWindowsController.java` - method `getMaintenanceWindows` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | `equipment_id` (Long; required)<br>`from` (Instant; optional)<br>`to` (Instant; optional) |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `MaintenanceWindowResource` ([`responses/MaintenanceWindowResource.json`](responses/MaintenanceWindowResource.json)) - Windows found; empty when the unit has none<br>`400` - `ErrorResource` - VALIDATION_ERROR - a missing or malformed parameter, or from after to<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the caller is not an owner<br>`404` - `ErrorResource` - EQUIPMENT_NOT_FOUND - the unit does not exist or belongs to another owner |
| Application flow | controller -> `maintenanceWindowQueryService` |

## `POST /api/v1/telemetry`

**Record an aggregated reading batch** - Stores one aggregated sensor reading batch sent by an edge device, de-duplicating by reading_uid. A batch never opens an alert - excursions are reported on POST /api/v1/telemetry/events - but it resolves the active excursion alert once every batch of the policy's sustained duration lies back within range by the hysteresis margin, as a fallback for a lost normalization event. Authenticated by the X-API-Key header only; the equipment and device are those the key is paired with. Raw temperatures must lie within 0 to 50 °C, each calibrated temperature within 5 °C of its raw value, humidity within 20 to 90 %, and min <= avg <= max for both sets. Light level, door-open seconds and presence are optional; an omitted presence is stored as unavailable.

| Field | Value |
|---|---|
| Bounded context | Monitoring and Alerting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/TelemetryController.java` - method `recordReading` |
| Authentication / authorization | Device API key (`X-API-Key`), authority `DEVICE_ROLE`; no user JWT |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `X-API-Key: <device api key>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `RecordReadingBatchResource` - [`requests/RecordReadingBatchResource.json`](requests/RecordReadingBatchResource.json), schema [`RecordReadingBatchResource.schema.json`](../../schemas/monitoring/RecordReadingBatchResource.schema.json) |
| Declared statuses / responses | `201` - `SensorReadingResource` ([`responses/SensorReadingResource.json`](responses/SensorReadingResource.json)) - New batch recorded<br>`200` - `SensorReadingResource` ([`responses/SensorReadingResource.json`](responses/SensorReadingResource.json)) - Batch already recorded under this reading_uid; nothing was stored<br>`400` - `ErrorResource` - Invalid reading payload; nothing was stored<br>`401` - error body - Missing, unknown, revoked or malformed API key<br>`403` - `ErrorResource` - equipment_id or device_id does not match the authenticated device<br>`409` - `ErrorResource` - reading_uid was already recorded by another device |
| Application flow | controller -> `sensorReadingCommandService` |

## `GET /api/v1/telemetry/equipment/{equipmentId}`

**Get reading history by equipment** - Retrieves the sensor readings recorded for an equipment within the given date range. Owners read their own units; technicians read units they hold an active service request on. Any other unit answers 404.

| Field | Value |
|---|---|
| Bounded context | Monitoring and Alerting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/TelemetryController.java` - method `getReadingsByEquipment` |
| Authentication / authorization | OWNER_ROLE or TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `equipmentId` (Long; Java `equipmentId`) |
| Query parameters | `from` (Instant, ISO 8601 with Z; required)<br>`to` (Instant, ISO 8601 with Z; required) |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `SensorReadingResource` ([`responses/SensorReadingResource.json`](responses/SensorReadingResource.json)) - Readings found<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`404` - error body - EQUIPMENT_NOT_FOUND - no such equipment is reachable by the caller |
| Application flow | controller -> `sensorReadingQueryService` |

## `POST /api/v1/telemetry/stream-ticket`

**Issue a telemetry stream ticket** - Exchanges the owner's JWT for an opaque, single-use ticket valid for 60 seconds, to be passed to GET /api/v1/telemetry/stream?ticket=... from a browser EventSource, which cannot send an Authorization header. The ticket is bound to the authenticated owner. An owner may hold up to 10 unredeemed tickets at once.

| Field | Value |
|---|---|
| Bounded context | Monitoring and Alerting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/TelemetryStreamController.java` - method `issueStreamTicket` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `StreamTicketResource` ([`responses/StreamTicketResource.json`](responses/StreamTicketResource.json)) - Ticket issued; the response carries Cache-Control: no-store<br>`401` - error body - UNAUTHORIZED - JWT token required or invalid<br>`403` - `ErrorResource` - ACCESS_DENIED - the caller is not an owner<br>`429` - error body - TOO_MANY_REQUESTS - too many unredeemed tickets; Retry-After is 60 |
| Application flow | controller -> `telemetryStreamCommandService` |

## `GET /api/v1/telemetry/stream`

**Open the telemetry stream** - Server-Sent Events stream of the readings and alert status changes of the ticket owner's units, and of no other owner's. Authenticated by the ticket query parameter only; no JWT is accepted here. The ticket is consumed by this request whatever its outcome. Events: stream-opened first (with the reconnection delay), then telemetry-update, whose JSON data is a TelemetryReadingUpdate (type READING_RECORDED) or a TelemetryAlertUpdate (type ALERT_STATUS_CHANGED); a heartbeat comment every 25 seconds. The stream closes after 30 minutes. An EventSource does not retry a 401: request a new ticket and reconnect.

| Field | Value |
|---|---|
| Bounded context | Monitoring and Alerting |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/TelemetryStreamController.java` - method `openStream` |
| Authentication / authorization | None (no JWT). Single-use stream ticket in `?ticket=` |
| Headers | `Accept: text/event-stream` (set by `EventSource`); no `Authorization` header |
| Path parameters | none |
| Query parameters | `ticket` (string; declared optional in code but always required in practice: a missing, spent or expired ticket answers `401`; see [telemetry-sse](../../integrations/telemetry-sse.md)) |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - SSE stream (`text/event-stream`) of `ReadingRecordedStreamResource`, `AlertStatusChangedStreamResource` ([`responses/ReadingRecordedStreamResource.json`](responses/ReadingRecordedStreamResource.json)) - Stream opened<br>`401` - `ErrorResource` - UNAUTHORIZED - the ticket is missing, malformed, unknown, already used or expired |
| Application flow | controller -> `telemetryStreamCommandService` |
