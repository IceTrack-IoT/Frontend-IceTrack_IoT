# Monitoring and Alerting

Package `pe.edu.upc.ice.track.platform.monitoring`. API: [../api/monitoring/endpoints.md](../api/monitoring/endpoints.md), contracts: [../api/monitoring/contracts.md](../api/monitoring/contracts.md). Stream: [../integrations/telemetry-sse.md](../integrations/telemetry-sse.md).

## Responsibilities

Ingests aggregated readings and edge events from gateways (device API key), keeps reading history, raises and manages thermal-excursion alerts, stores alert policies, tracks maintenance windows, and streams readings and alert changes to owners.

## Package organization (actual)

```text
monitoring/
  application/commandservices   AlertCommandService, AlertPolicyCommandService, EdgeEventCommandService, SensorReadingCommandService, TelemetryStreamCommandService
  application/queryservices     AlertQueryService, AlertPolicyQueryService, MaintenanceWindowQueryService, SensorReadingQueryService
  application/internal/accesspolicies, results
  application/internal/eventhandlers   AlertRaised/AlertPolicyUpdated/MaintenanceWindow* handlers, DefaultAlertPolicySeedingEventHandler, MaintenanceWindowExpiryScheduler
  application/internal/outboundservices
      acl/ExternalAssetManagementService, ExternalProfilesServiceForMonitoring, ExternalServiceRequestServiceForMonitoring, ServiceRequestAttribution
      streaming/StreamTicketService
  domain/model/aggregates   Alert, AlertPolicy, EdgeEvent, MaintenanceWindow, SensorReading
  domain/model/valueobjects AlertType, AlertSeverity, AlertStatus, EdgeEventType, EdgeEventResult, MaintenanceOrigin, ClosureReason, Temperature, Humidity, EnvironmentObservation
  infrastructure/streaming/{sse,tickets,events}, infrastructure/async, infrastructure/persistence/jpa
  interfaces/acl/MonitoringContextFacade, AlertPolicySettings ; interfaces/events/* (5 integration events)
  interfaces/rest   AlertsController, AlertPoliciesController, TelemetryController, TelemetryStreamController, EdgeEventsController, MaintenanceWindowsController
```

## Domain rules visible through the API

| Rule | Detail |
|---|---|
| Alert lifecycle | `OPEN` -> `ACKNOWLEDGED` (owner) -> `RESOLVED` or `DISMISSED`; `OPEN` can go directly to `RESOLVED`/`DISMISSED`. `acknowledge` requires `OPEN`; `resolve`/`dismiss` require `OPEN` or `ACKNOWLEDGED`. Violations are `409 INVALID_STATUS_TRANSITION`. Dismissal needs a non-blank `reason` (max 500) and optional `evidence` (max 1000); dismissed alerts are excluded from excursion reports |
| Alert fields | `type`: `TEMPERATURE_EXCURSION`, `DEVICE_OFFLINE`; `severity`: `INFO`, `WARNING`, `CRITICAL`; `peak_temperature`; `total_duration_seconds` after resolution; `acknowledged_by/at`, `resolved_by/at`, `dismissed_by/at` (user ids) |
| Excursion alerts come from **edge events**, not from reading batches | `POST /telemetry/events` `THERMAL_EXCURSION_DETECTED` opens a `CRITICAL` alert (`201`), unless one is already active (`200 ALERT_ALREADY_ACTIVE`) or a maintenance window covers `occurred_at` (`200 SUPPRESSED_BY_MAINTENANCE`). `THERMAL_EXCURSION_NORMALIZED` resolves it (`ALERT_RESOLVED`) or does nothing (`NO_ACTIVE_ALERT`). A reading batch can only resolve an active alert once every batch within the policy's sustained duration is back in range by the hysteresis margin |
| Idempotency | `reading_uid` and `event_uid` are client-generated UUIDs. A resend answers `200` with the stored outcome; a uid recorded by **another** device answers `409` |
| Reading limits | calibrated temperatures -5 to 55, raw 0 to 50, each calibrated within 5 of its raw value, min <= avg <= max (both sets), humidity 20 to 90, `sample_count` 1 to 360, `light_level_max` 0 to 100, `door_open_seconds` >= 0, `applied_config_version` >= 0 |
| Event limits | temperatures -50 to 60 degrees C; a detection requires `temperature_celsius`; a window start requires `origin` (`APP` or `BUTTON`); a window end requires `closure_reason` |
| Maintenance windows | Opened/closed by edge events (`MAINTENANCE_WINDOW_STARTED/ENDED`); an `APP` start promotes a `BUTTON` window; the platform closes a window still open `expiry-grace-minutes` (30) after its expiration with `closure_reason: EXPIRED` (sweep every 60 s). Closure reasons: `MANUAL_APP`, `MANUAL_BUTTON`, `INTERVENTION_COMPLETED`, `EXPIRED`, `SAFETY_LIMIT`. Readings recorded during a window are flagged `under_maintenance: true` |
| Alert policy | `sustained_excursion_minutes` > 0, `hysteresis_margin_celsius` 1.0 to 5.0, `missed_sync_windows_for_offline` > 0. An equipment policy overrides the platform default (seeded at startup, not editable through the API). Updating it bumps the equipment `config_version` |

## Internal data flow, `POST /api/v1/telemetry` (edge)

`EdgeSecurityConfiguration` + `ApiKeyAuthenticationFilter` (authority `DEVICE_ROLE`, principal `AuthenticatedDevice`) -> `TelemetryController.recordReading` (`@Valid RecordReadingBatchResource`; mismatching `equipment_id`/`device_id` is `403`) -> `RecordReadingBatchCommandFromResourceAssembler` -> `SensorReadingCommandService.handle` -> aggregate `SensorReading` persisted, maintenance flag computed -> connectivity refreshed in the same transaction: `ExternalAssetManagementService.recordEquipmentReading` (`AssetContextFacade` -> `Equipment.recordReading`: the unit goes `online`, `last_reading_at`/`last_known_temperature` move forward unless the batch is older than the latest one), `ExternalDeviceServiceForMonitoring.recordDeviceActivity` (`DeviceContextFacade.recordActivity`: `last_seen_at` = arrival time), and an active `DEVICE_OFFLINE` alert of the unit is resolved automatically -> active excursion alert resolved when the policy allows -> `ReadingIngestionOutcome` (`Recorded` -> `201`, `Duplicate` -> `200`, other device -> `409 READING_CONFLICT`) -> `SensorReadingResourceFromEntityAssembler` -> `SensorReadingResource`. After commit `ReadingRecordedEvent` is dispatched asynchronously to the owner's SSE streams.

## Internal data flow, `PUT /api/v1/alerts/{alertId}/acknowledge`

`AlertsController.acknowledgeAlert` (`OWNER_ROLE`) -> `AlertCommandService` -> ownership via `EquipmentAccessPolicy` -> `ExternalAssetManagementService.isEquipmentOwnedBy` (`AssetContextFacade.existsEquipmentForOwner`) -> `Alert.acknowledge` (records caller id and time) -> `AlertStatusChangedEvent` -> `AlertResourceFromEntityAssembler` -> `200 AlertResource`. Not reachable: `404 ALERT_NOT_FOUND`; wrong state: `409 INVALID_STATUS_TRANSITION`.

## Interfaces

Six controllers, 13 endpoints. Edge routes: `POST /telemetry` and `POST /telemetry/events` (API key). Owner and technician reads: alerts, policies, readings history. Owner only: alert lifecycle, policy update, maintenance windows list, stream ticket. Public (ticket): `GET /telemetry/stream`.

## Dependencies

Outbound: `ExternalAssetManagementService` (thresholds, ownership, unit owner, the unit's telemetry view and the list of connected units), `ExternalDeviceServiceForMonitoring` (device last contact), `ExternalProfilesServiceForMonitoring`, `ExternalServiceRequestServiceForMonitoring` (technician access, request attribution). Inbound: `MonitoringContextFacade` used by device (alert policy) and reporting (alerts, samples). Publishes `AlertRaised`, `AlertPolicyUpdated`, `MaintenanceWindow{Opened,Closed,Promoted}` integration events; consumed by notifications, assets, service.request.

## Device offline detection

A unit is offline once the platform received no reading from it for `60 s × missed_sync_windows_for_offline` of its alert policy (default 3 windows, so 3 minutes). Silence is measured from the arrival time of the latest stored reading (server clock), never from the device clock.

| Step | Where | Behavior |
|---|---|---|
| Detection | `EquipmentConnectivityCommandService.handle(DetectOfflineEquipmentCommand)` | For every unit Assets shows as `online`: skipped while a maintenance window covers it; otherwise marked offline (`AssetContextFacade.markEquipmentOffline`) and, unless it already has an active `DEVICE_OFFLINE` alert, an `OPEN` `WARNING` alert is raised (`Alert.raisedForSilence`; `triggering_recorded_at` = arrival of the last reading, temperatures `null`). Raising it publishes `AlertRaisedIntegrationEvent`, so Notifications tells the owner exactly as for a thermal alert. Each unit runs in its own transaction |
| Recovery | reading ingestion (`POST /api/v1/telemetry`) | The first stored batch resolves the active `DEVICE_OFFLINE` alert (`resolved_by` `null`) and brings the unit back `online`. Readings taken during maintenance count too |
| Reporting | `EQUIPMENT_UPTIME` | Uptime is computed from the `DEVICE_OFFLINE` alert durations |

**Pending (development team):** detection is time-driven and nothing schedules it yet. The application service is implemented and unit-tested, but no periodic trigger invokes it, so `DEVICE_OFFLINE` alerts are not raised at runtime until the team adds one (the trigger, its cadence and its threading belong to the team's asynchronous-execution responsibility). Recovery and uptime reporting already work for any `DEVICE_OFFLINE` alert that exists.
