# Monitoring and Alerting - request and response contracts

Generated from the REST resource records under `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources`. Property names are the **serialized** names: Jackson runs with `SNAKE_CASE` (`JacksonConfiguration`, `spring.jackson.property-naming-strategy`), so the Java component `fullName` is the JSON property `full_name`.

Legend: **Required** = enforced by Bean Validation (`@NotNull` / `@NotBlank`). Optional properties may be omitted or `null`. A resource marked `@JsonInclude(NON_NULL)` **omits** null properties; every other resource writes them as `null`.

## `TelemetryBucketResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/TelemetryBucketResource.java`
- Example: [`responses/TelemetryBucketResource.json`](responses/TelemetryBucketResource.json)
- Used by: `GET /api/v1/telemetry/equipment/{equipmentId}` with `bucket`, as a JSON array, oldest first; empty buckets are omitted

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `bucket_start` | string (date-time, UTC with Z) | no |  | Inclusive; a multiple of the bucket width since the epoch |
| `bucket_end` | string (date-time, UTC with Z) | no |  | Exclusive |
| `min_temperature` | number | no |  | Minimum of the batches' `min_temperature` |
| `max_temperature` | number | no |  | Maximum of the batches' `max_temperature` |
| `avg_temperature` | number | no |  | Average of the batches' `avg_temperature`, weighted by `sample_count` |
| `avg_humidity` | number | no |  | Weighted average; null when no batch had humidity; nullable |
| `sample_count` | integer | no |  | Sum of the batches' samples |
| `batch_count` | integer | no |  | Batches aggregated |
| `under_maintenance` | boolean | no |  | True when any aggregated batch was under maintenance |
| `door_open_seconds` | integer | no |  | Sum, when the batches carry it; nullable |
| `last_received_at` | string (date-time, UTC with Z) | no |  | Latest server arrival time in the bucket |

## Owner stream events

Data of the events of `GET /api/v1/telemetry/stream` other than `telemetry-update` (documented below with `ReadingRecordedStreamResource` and `AlertStatusChangedStreamResource`). Every event but `stream-opened` carries an SSE `id`; pass the last one received as `last_event_id` when reconnecting.

| SSE event | Resource | JSON properties |
|---|---|---|
| `stream-opened` | map | `timeout_seconds`, `heartbeat_seconds`, `replayed` (events replayed after `last_event_id`), `replay_complete` (`false`: reload over REST) |
| `notification-created` | `NotificationCreatedStreamResource` | `notification_id`, `type` (`NotificationType`), `severity` (`NotificationSeverity`), `equipment_id` (nullable), `source_alert_id` (nullable), `created_at`, `unread_count` (after this notification). No message text |
| `unread-count-changed` | `UnreadCountChangedStreamResource` | `unread_count`, `changed_at`. Sent when a notification arrives and when one or several are read or dismissed |
| `report-status-changed` | `ReportStatusChangedStreamResource` | `report_id`, `previous_status`, `status` (`GENERATING`, `COMPLETED` or `FAILED`), `changed_at` |
| `device-status-changed` | `DeviceStatusChangedStreamResource` | `device_id`, `paired_equipment_id` (null once unpaired), `previous_status`, `status` (`UNPAIRED`, `PAIRED`, `REVOKED`; both `PAIRED` for a rotation), `changed_at`. `last_seen_at` changes are not pushed |
| `connectivity-changed` | `ConnectivityChangedStreamResource` | `equipment_id`, `device_id` (nullable), `previous_state`, `state` (`REPORTING`, `SILENT`, `NEVER_REPORTED`, `NOT_MONITORED`), `last_received_at` (nullable), `under_maintenance`, `changed_at`. Sent when offline detection finds the unit silent, its next batch brings it back, it is deactivated or reactivated, or a maintenance window opens or closes (then the state may stay the same) |

These events report the state stored by offline detection and reading arrivals; `EquipmentResource.connectivity` additionally applies the offline window at read time.

## `AlertPolicyResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/AlertPolicyResource.java`
- Example: [`responses/AlertPolicyResource.json`](responses/AlertPolicyResource.json) | JSON Schema: [`schemas/monitoring/AlertPolicyResource.schema.json`](../../schemas/monitoring/AlertPolicyResource.schema.json)
- Used by: `GET /api/v1/alert-policies/equipment/{equipmentId}`, `PUT /api/v1/alert-policies`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Policy unique identifier |
| `equipment_id` | integer | no |  | Identifier of the equipment this policy applies to; null for the platform-wide default policy |
| `sustained_excursion_minutes` | integer | no |  | Minutes an out-of-range reading must persist before an alert opens |
| `hysteresis_margin_celsius` | number | no |  | Margin, in Celsius, a reading must re-enter range by before the alert closes |
| `missed_sync_windows_for_offline` | integer | no |  | Number of missed synchronization windows before a device is considered offline |
| `active` | boolean | no |  | Whether this policy is currently active |

## `AlertResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/AlertResource.java`
- Example: [`responses/AlertResource.json`](responses/AlertResource.json) | JSON Schema: [`schemas/monitoring/AlertResource.schema.json`](../../schemas/monitoring/AlertResource.schema.json)
- Used by: `GET /api/v1/alerts/{alertId}`, `GET /api/v1/alerts/equipment/{equipmentId}/open`, `PUT /api/v1/alerts/{alertId}/acknowledge`, `PUT /api/v1/alerts/{alertId}/resolve`, `PUT /api/v1/alerts/{alertId}/dismiss`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Alert unique identifier |
| `equipment_id` | integer | no |  | Identifier of the equipment the alert concerns |
| `type` | string | no |  | documented values: `TEMPERATURE_EXCURSION`, `DEVICE_OFFLINE`; Kind of anomalous condition raised |
| `severity` | string | no |  | documented values: `INFO`, `WARNING`, `CRITICAL`; How urgently the alert should be surfaced. Thermal excursions are always CRITICAL. |
| `status` | string | no |  | documented values: `OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `DISMISSED`; Current lifecycle status: OPEN, then optionally ACKNOWLEDGED, and finally RESOLVED or DISMISSED |
| `triggering_reading_id` | integer | no |  | Identifier of the sensor reading that raised the alert; nullable |
| `triggering_temperature` | number | no |  | Out-of-range value of the triggering reading, in Celsius: its maximum above the range, its minimum below it; null for a DEVICE_OFFLINE alert; nullable |
| `triggering_recorded_at` | string (date-time, UTC with Z) | no |  | When the triggering reading was recorded; nullable |
| `peak_temperature` | number | no |  | Peak temperature observed during the excursion, in Celsius; null for a DEVICE_OFFLINE alert; nullable |
| `opened_at` | string (date-time, UTC with Z) | no |  | Timestamp the alert was raised |
| `acknowledged_by` | integer | no |  | IAM user identifier of who acknowledged the alert; nullable |
| `acknowledged_at` | string (date-time, UTC with Z) | no |  | When the alert was acknowledged; nullable |
| `resolved_by` | integer | no |  | IAM user identifier of who resolved the alert; null while not resolved, or when it was resolved automatically because readings returned within range; nullable |
| `resolved_at` | string (date-time, UTC with Z) | no |  | When the alert was resolved; nullable |
| `dismissed_by` | integer | no |  | IAM user identifier of who dismissed the alert; nullable |
| `dismissed_at` | string (date-time, UTC with Z) | no |  | When the alert was dismissed; nullable |
| `dismiss_reason` | string | no |  | Justification given when the alert was dismissed; nullable |
| `dismiss_evidence` | string | no |  | Evidence given when the alert was dismissed; nullable |
| `total_duration_seconds` | integer | no |  | Seconds between opening and resolution or dismissal; null while the alert is active; nullable |

## `PagedAlertResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/PagedAlertResource.java`
- Used by: `GET /api/v1/alerts`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `content` | array<object (`AlertResource`)> | no |  | Alerts of this page, most recently opened first |
| `page` | integer | no |  | Zero-based index of this page |
| `size` | integer | no |  | Maximum number of alerts a page may hold |
| `total_elements` | integer | no |  | Total number of alerts matching the filters |
| `total_pages` | integer | no |  | Number of pages the matching alerts span; at least 1 |

## `ApplicablePolicyResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/ApplicablePolicyResource.java`
- Used by: `GET /api/v1/alert-policies`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `equipment_id` | integer | no |  | Identifier of the unit the policy applies to |
| `source` | string | no |  | documented values: `EQUIPMENT`, `DEFAULT`; `EQUIPMENT` for the unit's own policy, `DEFAULT` for the platform-wide default |
| `policy` | object (`AlertPolicyResource`) | no |  | The applicable policy; its `equipment_id` is null when `source` is `DEFAULT` |

## `DashboardSummaryResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/DashboardSummaryResource.java`
- Used by: `GET /api/v1/dashboard/summary`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `generated_at` | string (date-time, UTC with Z) | no |  | When the figures were computed |
| `site_count` | integer | no |  | Sites the figures cover: the owner's sites, or 1 when `site_id` was sent |
| `equipment.total` | integer | no |  | Units in scope |
| `equipment.by_status` | object | no |  | Units per lifecycle status (`ACTIVE`, `MAINTENANCE`, `REPAIR`, `DEACTIVATED`); every status is present, 0 when no unit holds it |
| `equipment.reporting` | integer | no |  | Units whose `last_reading_at` lies within their offline window (60 s × `missed_sync_windows_for_offline` of the applicable policy), judged by the server clock |
| `equipment.silent` | integer | no |  | Units whose `last_reading_at` lies outside that window |
| `equipment.never_reported` | integer | no |  | Units with no reading yet |
| `alerts.open` | integer | no |  | Alerts in `OPEN` |
| `alerts.acknowledged` | integer | no |  | Alerts in `ACKNOWLEDGED` |
| `alerts.active_by_severity` | object | no |  | `OPEN` and `ACKNOWLEDGED` alerts per severity (`INFO`, `WARNING`, `CRITICAL`); every severity is present |
| `service_requests.active` | integer | no |  | Requests in `PENDING`, `ACCEPTED` or `IN_PROGRESS` |
| `service_requests.by_status` | object | no |  | Requests per status (`PENDING`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELED`); every status is present |
| `devices.paired` | integer | no |  | Devices `PAIRED` with a unit in scope |
| `devices.revoked` | integer | no |  | Devices `REVOKED` and still linked to a unit in scope |

`equipment.reporting`, `equipment.silent` and `equipment.never_reported` add up to `equipment.total`.

## `AlertStatusChangedStreamResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/AlertStatusChangedStreamResource.java`
- Example: [`responses/AlertStatusChangedStreamResource.json`](responses/AlertStatusChangedStreamResource.json) | JSON Schema: [`schemas/monitoring/AlertStatusChangedStreamResource.schema.json`](../../schemas/monitoring/AlertStatusChangedStreamResource.schema.json)
- Used by: `GET /api/v1/telemetry/stream`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `type` | string | no |  | documented values: `ALERT_STATUS_CHANGED`; Kind of update; always ALERT_STATUS_CHANGED for this data |
| `alert_id` | integer | no |  | Identifier of the alert |
| `equipment_id` | integer | no |  | Identifier of the unit the alert concerns |
| `alert_type` | string | no |  | documented values: `TEMPERATURE_EXCURSION`, `DEVICE_OFFLINE`; Kind of condition the alert reports |
| `severity` | string | no |  | documented values: `INFO`, `WARNING`, `CRITICAL`; How urgently the alert must be surfaced |
| `previous_status` | string | no |  | documented values: `OPEN`, `ACKNOWLEDGED`; Status the alert left; null when the alert was just raised; nullable |
| `status` | string | no |  | documented values: `OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `DISMISSED`; Status the alert entered |
| `peak_temperature` | number | no |  | Most extreme temperature recorded for the alert, in Celsius; null when no temperature is involved; nullable |
| `changed_at` | string (date-time, UTC with Z) | no |  | When the alert entered status |

## `DismissAlertResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/DismissAlertResource.java`
- Example: [`requests/DismissAlertResource.json`](requests/DismissAlertResource.json) | JSON Schema: [`schemas/monitoring/DismissAlertResource.schema.json`](../../schemas/monitoring/DismissAlertResource.schema.json)
- Used by: `PUT /api/v1/alerts/{alertId}/dismiss`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `reason` | string | yes | not blank; max length 500 | Why the alert does not represent an actual fault |
| `evidence` | string | no | max length 1000 | Optional supporting evidence, such as a note or a link to a maintenance record; nullable |

## `EdgeEventResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/EdgeEventResource.java`
- Example: [`responses/EdgeEventResource.json`](responses/EdgeEventResource.json) | JSON Schema: [`schemas/monitoring/EdgeEventResource.schema.json`](../../schemas/monitoring/EdgeEventResource.schema.json)
- Used by: `POST /api/v1/telemetry/events`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `event_uid` | string (uuid) | no |  | Identifier generated by the gateway |
| `type` | string | no |  | documented values: `THERMAL_EXCURSION_DETECTED`, `THERMAL_EXCURSION_NORMALIZED`, `MAINTENANCE_WINDOW_STARTED`, `MAINTENANCE_WINDOW_ENDED`; Kind of event |
| `occurred_at` | string (date-time, UTC with Z) | no |  | When the gateway observed the event |
| `result` | string | no |  | documented values: `ALERT_OPENED`, `ALERT_ALREADY_ACTIVE`, `ALERT_RESOLVED`, `NO_ACTIVE_ALERT`, `SUPPRESSED_BY_MAINTENANCE`, `MAINTENANCE_WINDOW_OPENED`, `MAINTENANCE_WINDOW_PROMOTED`, `MAINTENANCE_ALREADY_ACTIVE`, `MAINTENANCE_WINDOW_CLOSED`, `NO_ACTIVE_MAINTENANCE`; What processing the event did |
| `alert_id` | integer | no |  | Alert opened, already active or resolved; null otherwise; nullable |
| `maintenance_window_id` | integer | no |  | Maintenance window opened, kept, promoted or closed, or the one covering a suppressed detection; null otherwise; nullable |

## `MaintenanceWindowResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/MaintenanceWindowResource.java`
- Example: [`responses/MaintenanceWindowResource.json`](responses/MaintenanceWindowResource.json) | JSON Schema: [`schemas/monitoring/MaintenanceWindowResource.schema.json`](../../schemas/monitoring/MaintenanceWindowResource.schema.json)
- Used by: `GET /api/v1/maintenance-windows`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Maintenance window unique identifier |
| `equipment_id` | integer | no |  | Unit the window was opened on |
| `origin` | string | no |  | documented values: `APP`, `BUTTON`; How the window was started, or promoted to |
| `started_at` | string (date-time, UTC instant `Z`) | no |  | When the gateway started the window, ISO-8601 UTC |
| `expires_at` | string (date-time, UTC instant `Z`) | no |  | When the window expires, or expired, unless closed earlier |
| `ended_at` | string (date-time, UTC instant `Z`) | no |  | When the window ended; null while active; nullable |
| `closure_reason` | string | no |  | documented values: `MANUAL_APP`, `MANUAL_BUTTON`, `INTERVENTION_COMPLETED`, `EXPIRED`, `SAFETY_LIMIT`; Why the window ended; null while active; nullable |
| `technician_id` | integer | no |  | Technician attributed to the window; null when unknown; nullable |
| `service_request_id` | integer | no |  | Service request the window is linked to; null when unlinked; nullable |
| `unlinked` | boolean | no |  | Whether no service request is linked to the window |
| `active` | boolean | no |  | Whether the window is still open |

## `ReadingRecordedStreamResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/ReadingRecordedStreamResource.java`
- Example: [`responses/ReadingRecordedStreamResource.json`](responses/ReadingRecordedStreamResource.json) | JSON Schema: [`schemas/monitoring/ReadingRecordedStreamResource.schema.json`](../../schemas/monitoring/ReadingRecordedStreamResource.schema.json)
- Used by: `GET /api/v1/telemetry/stream`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `type` | string | no |  | documented values: `READING_RECORDED`; Kind of update; always READING_RECORDED for this data |
| `reading_uid` | string | no |  | Client-generated identifier of the batch, unique across the platform |
| `equipment_id` | integer | no |  | Identifier of the unit the batch was taken on |
| `device_id` | integer | no |  | Identifier of the device that produced the batch |
| `min_temperature` | number | no |  | Calibrated minimum temperature, in Celsius |
| `max_temperature` | number | no |  | Calibrated maximum temperature, in Celsius |
| `avg_temperature` | number | no |  | Calibrated average temperature, in Celsius |
| `humidity` | number | no |  | Average relative humidity, as a percentage |
| `sample_count` | integer | no |  | Number of raw samples folded into the batch |
| `recorded_at` | string (date-time, UTC with Z) | no |  | When the batch was taken, by the device clock |
| `received_at` | string (date-time, UTC with Z) | no |  | When the platform received the batch |
| `under_maintenance` | boolean | no |  | Whether a maintenance window covered recorded_at |

## `RecordEdgeEventResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/RecordEdgeEventResource.java`
- Example: [`requests/RecordEdgeEventResource.json`](requests/RecordEdgeEventResource.json) | JSON Schema: [`schemas/monitoring/RecordEdgeEventResource.schema.json`](../../schemas/monitoring/RecordEdgeEventResource.schema.json)
- Used by: `POST /api/v1/telemetry/events`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `event_uid` | string (uuid) | yes |  | Identifier generated by the gateway; retries must reuse it |
| `type` | string enum | yes |  | values: `THERMAL_EXCURSION_DETECTED`, `THERMAL_EXCURSION_NORMALIZED`, `MAINTENANCE_WINDOW_STARTED`, `MAINTENANCE_WINDOW_ENDED`; Kind of event |
| `occurred_at` | string (date-time, UTC with Z) | yes |  | When the gateway observed the event, by its clock. For maintenance events, when the window started or ended |
| `temperature_celsius` | number | no | min -50.0; max 60.0 | Out-of-range temperature, in Celsius; required for THERMAL_EXCURSION_DETECTED; nullable |
| `peak_temperature_celsius` | number | no | min -50.0; max 60.0 | Most extreme temperature of the excursion, in Celsius; optional with THERMAL_EXCURSION_NORMALIZED; nullable |
| `reading_uid` | string (uuid) | no |  | reading_uid of the batch the excursion was detected in, recorded as the triggering reading when that batch is stored; nullable |
| `equipment_id` | integer | no |  | Optional; must match the unit the API key is paired with; nullable |
| `device_id` | integer | no |  | Optional; must match the device the API key belongs to; nullable |
| `origin` | string enum | no |  | values: `APP`, `BUTTON`; How the maintenance window was started; required for MAINTENANCE_WINDOW_STARTED; nullable |
| `technician_id` | integer | no | > 0 | Technician the maintenance window belongs to, taken from the edge grant; optional; nullable |
| `service_request_id` | integer | no | > 0 | Service request the maintenance window belongs to, taken from the edge grant; optional; nullable |
| `closure_reason` | string enum | no |  | values: `MANUAL_APP`, `MANUAL_BUTTON`, `INTERVENTION_COMPLETED`, `EXPIRED`, `SAFETY_LIMIT`; Why the maintenance window ended; required for MAINTENANCE_WINDOW_ENDED; nullable |
| `start_event_uid` | string (uuid) | no |  | event_uid of the MAINTENANCE_WINDOW_STARTED event that opened the window being ended; optional with MAINTENANCE_WINDOW_ENDED, the unit's active window is ended without it; nullable |

## `RecordReadingBatchResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/RecordReadingBatchResource.java`
- Example: [`requests/RecordReadingBatchResource.json`](requests/RecordReadingBatchResource.json) | JSON Schema: [`schemas/monitoring/RecordReadingBatchResource.schema.json`](../../schemas/monitoring/RecordReadingBatchResource.schema.json)
- Used by: `POST /api/v1/telemetry`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `reading_uid` | string (uuid) | yes |  | Client-generated identifier used to de-duplicate retried deliveries |
| `equipment_id` | integer | no |  | Optional cross-check: must equal the equipment the authenticated device is paired with; nullable |
| `device_id` | integer | no |  | Optional cross-check: must equal the authenticated device; nullable |
| `min_temperature` | number | yes | min -5.0; max 55.0 | Calibrated minimum temperature in the window, in Celsius; within 5 of raw_min_temperature |
| `max_temperature` | number | yes | min -5.0; max 55.0 | Calibrated maximum temperature in the window, in Celsius; within 5 of raw_max_temperature |
| `avg_temperature` | number | yes | min -5.0; max 55.0 | Calibrated average temperature in the window, in Celsius; within 5 of raw_avg_temperature |
| `raw_min_temperature` | number | yes | min 0.0; max 50.0 | Minimum temperature measured by the probe before calibration, in Celsius (0 to 50) |
| `raw_max_temperature` | number | yes | min 0.0; max 50.0 | Maximum temperature measured by the probe before calibration, in Celsius (0 to 50) |
| `raw_avg_temperature` | number | yes | min 0.0; max 50.0 | Average temperature measured by the probe before calibration, in Celsius (0 to 50) |
| `humidity` | number | yes | min 20.0; max 90.0 | Average relative humidity observed in the window, as a percentage (20 to 90) |
| `sample_count` | integer | yes | min 1; max 360 | Number of raw samples folded into this reading (1 to 360) |
| `light_level_max` | number | no | min 0.0; max 100.0 | Highest light level inside the unit during the window, 0 to 100 %; omitted when the device has no light sensor; nullable |
| `door_open_seconds` | integer | no | >= 0 | Seconds the door was detected open during the window; omitted when not reported; nullable |
| `presence_detected` | boolean | no |  | Whether the PIR sensor detected presence near the unit during the window; omitted when presence is unavailable, which is stored as unavailable, not as false; nullable |
| `recorded_at` | string (date-time, UTC with Z) | yes |  | Timestamp assigned by the device clock |
| `applied_config_version` | integer | yes | >= 0 | Edge configuration version the gateway was running when it built this batch |

## `SensorReadingResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/SensorReadingResource.java`
- Example: [`responses/SensorReadingResource.json`](responses/SensorReadingResource.json) | JSON Schema: [`schemas/monitoring/SensorReadingResource.schema.json`](../../schemas/monitoring/SensorReadingResource.schema.json)
- Used by: `POST /api/v1/telemetry`, `GET /api/v1/telemetry/equipment/{equipmentId}`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Reading unique identifier |
| `reading_uid` | string | no |  | Client-generated identifier of the batch |
| `equipment_id` | integer | no |  | Identifier of the equipment the reading belongs to |
| `device_id` | integer | no |  | Identifier of the device that produced the reading |
| `min_temperature` | number | no |  | Calibrated minimum temperature observed in the window, in Celsius |
| `max_temperature` | number | no |  | Calibrated maximum temperature observed in the window, in Celsius |
| `avg_temperature` | number | no |  | Calibrated average temperature observed in the window, in Celsius |
| `raw_min_temperature` | number | no |  | Minimum temperature measured by the probe before calibration, in Celsius; nullable |
| `raw_max_temperature` | number | no |  | Maximum temperature measured by the probe before calibration, in Celsius; nullable |
| `raw_avg_temperature` | number | no |  | Average temperature measured by the probe before calibration, in Celsius; nullable |
| `humidity` | number | no |  | Average relative humidity observed in the window, as a percentage |
| `sample_count` | integer | no |  | Number of raw samples folded into this reading |
| `light_level_max` | number | no |  | Highest light level inside the unit, 0 to 100 %; null when not reported; nullable |
| `door_open_seconds` | integer | no |  | Seconds the door was detected open; null when not reported; nullable |
| `presence_detected` | boolean | no |  | Whether presence was detected near the unit; null when presence is unavailable; nullable |
| `recorded_at` | string (date-time, UTC with Z) | no |  | Timestamp assigned by the device clock |
| `applied_config_version` | integer | no |  | Edge configuration version the gateway was running; nullable |
| `under_maintenance` | boolean | no |  | Whether a maintenance window covered recorded_at; such readings never change an alert |

## `StreamTicketResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/StreamTicketResource.java`
- Example: [`responses/StreamTicketResource.json`](responses/StreamTicketResource.json) | JSON Schema: [`schemas/monitoring/StreamTicketResource.schema.json`](../../schemas/monitoring/StreamTicketResource.schema.json)
- Used by: `POST /api/v1/telemetry/stream-ticket`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `ticket` | string | no |  | Opaque ticket: st_ followed by 64 hexadecimal characters. Shown only in this response |
| `expires_in` | integer | no |  | Seconds the ticket stays redeemable; it opens one stream at most |

## `UpdateAlertPolicyResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/UpdateAlertPolicyResource.java`
- Example: [`requests/UpdateAlertPolicyResource.json`](requests/UpdateAlertPolicyResource.json) | JSON Schema: [`schemas/monitoring/UpdateAlertPolicyResource.schema.json`](../../schemas/monitoring/UpdateAlertPolicyResource.schema.json)
- Used by: `PUT /api/v1/alert-policies`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `equipment_id` | integer | yes |  | Identifier of one of the caller's units this policy applies to. The platform-wide default policy is managed by configuration and cannot be changed here. |
| `sustained_excursion_minutes` | integer | yes | > 0 | Minutes an out-of-range reading must persist before an alert opens |
| `hysteresis_margin_celsius` | number | yes | min 1.0; max 5.0 | Margin, in Celsius, a reading must re-enter range by before the alert closes; at least 1.0, the resolution of the DHT11 sensor |
| `missed_sync_windows_for_offline` | integer | yes | > 0 | Number of missed synchronization windows before a device is considered offline |

## Enumerations

- `ClosureReasonResource`: `MANUAL_APP`, `MANUAL_BUTTON`, `INTERVENTION_COMPLETED`, `EXPIRED`, `SAFETY_LIMIT`  
  source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/ClosureReasonResource.java`
- `EdgeEventTypeResource`: `THERMAL_EXCURSION_DETECTED`, `THERMAL_EXCURSION_NORMALIZED`, `MAINTENANCE_WINDOW_STARTED`, `MAINTENANCE_WINDOW_ENDED`  
  source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/EdgeEventTypeResource.java`
- `MaintenanceOriginResource`: `APP`, `BUTTON`  
  source: `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/MaintenanceOriginResource.java`
