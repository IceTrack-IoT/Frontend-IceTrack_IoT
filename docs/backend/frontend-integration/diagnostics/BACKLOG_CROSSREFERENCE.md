# Backlog cross-reference

Source of the stories: `docs/product-backlog.md` (56 user stories, 32 technical stories, 9 NFRs). The backlog is **supplementary**: a story does not prove an endpoint exists, a backlog JSON example does not prove a resource shape, and a story does not define a status code. The "Evidence" columns come from the code. Statuses:

- **Implemented**: an endpoint and domain behavior matching the story exist.
- **Partial**: some of the story exists; the gap is stated.
- **Not implemented (backend)**: no code was found in this repository.
- **Outside this backend**: edge firmware/gateway, mobile/web UI, or marketing pages; nothing to find here. The cloud-side counterpart, if any, is stated.

Statuses come from source reading; the rows touched by the latest remediation (US-01, US-18, US-19, US-42) were also exercised over HTTP against a locally running backend.

## User stories

| Story | Objective | Context | Endpoint(s) | Request resource -> response resource | Application service | Status |
|---|---|---|---|---|---|---|
| US-01 | Register by role | iam | `POST /authentication/sign-up/owner`, `/technician` | `SignUpOwnerResource` / `SignUpTechnicianResource` -> `UserResource` | `UserCommandService` | Implemented, including the password policy (8 to 64 characters, upper and lower case letter, digit) |
| US-02 | Sign in | iam | `POST /authentication/sign-in/local` | `SignInWithLocalResource` -> `AuthenticatedUserResource` | `UserCommandService` | Implemented |
| US-03 | Register/update equipment | assets | `POST /assets/equipments`, `PUT /assets/equipments/{id}` | `RegisterEquipmentResource`, `UpdateEquipmentResource` -> `EquipmentResource` | `EquipmentCommandService` | Implemented |
| US-04 | Request maintenance or repair | service.request | `POST /service-requests` | `CreateServiceRequestResource` -> `ServiceRequestResource` | `ServiceRequestCommandService` | Implemented |
| US-05 | Track progress and history | service.request | `GET /service-requests/{id}` | -> `ServiceRequestResource` (`history`, `maintenance_windows`) | `ServiceRequestQueryService` | Implemented |
| US-06 | Cancel with reason | service.request | `PUT /service-requests/{id}/cancel` | `CancelServiceRequestResource` -> `ServiceRequestResource` | `ServiceRequestCommandService` | Implemented |
| US-07 | Update technician profile | profiles | `PUT /profiles/technicians/{id}` | `UpdateTechnicianResource` -> `TechnicianProfileResource` | `TechnicianCommandService` | Implemented |
| US-08 | View technician profile | profiles | `GET /profiles/technicians/{id}/public` | -> `TechnicianPublicProfileResource` | `TechnicianQueryService` | Implemented |
| US-09 | Assign / reassign technician | service.request | `PUT /service-requests/{id}/assign` | `AssignTechnicianResource` -> `ServiceRequestResource` | `ServiceRequestCommandService` | Implemented |
| US-10 | Intervention history per unit | service.request | `GET /assets/equipments/{id}/interventions` | -> `InterventionResource[]` | `ServiceRequestQueryService` | Implemented |
| US-11 | Filter equipment by site/type/status | assets | `GET /assets/equipments?site_id&equipment_type&status&search` | -> `EquipmentResource[]` or `PagedEquipmentResource` | `EquipmentQueryService` | Implemented |
| US-12 | Review a completed service | service.request | `POST /reviews`, `PUT /reviews/{id}`, `GET /service-requests/{id}/review` | `SubmitReviewResource`, `UpdateReviewResource` -> `ReviewResource` | `ReviewCommandService` | Implemented |
| US-13 to US-17 | Landing page (value proposition, industries, features, mission, call to action) | none | none | none | none | Outside this backend (web UI) |
| US-18 | View equipment list and detail | assets | `GET /assets/equipments`, `GET /assets/equipments/{id}` | -> `EquipmentResource` | `EquipmentQueryService` | Implemented: `online`, `last_reading_at`, `last_known_temperature` follow every stored reading batch |
| US-19 | Real-time telemetry dashboard | monitoring | `POST /telemetry/stream-ticket`, `GET /telemetry/stream` (SSE) | -> `StreamTicketResource`, `ReadingRecordedStreamResource`, `AlertStatusChangedStreamResource` | `TelemetryStreamCommandService` | Partial: stream and unit online state exist; aggregated metrics do not |
| US-20 | Register and view sites | assets | `POST /assets/sites`, `GET /assets/sites`, `GET /assets/sites/{id}` | `RegisterSiteResource` -> `SiteResource` | `SiteCommandService` | Implemented |
| US-21 | View and filter service requests | service.request | `GET /service-requests?status&page&size` | -> `PagedServiceRequestResource` | `ServiceRequestQueryService` | Implemented |
| US-22 | Search and filter reports by name/type/status | reporting | `GET /reports` | -> `ReportResource[]` | `ReportQueryService` | Partial: no server-side search or filters; the list is returned whole |
| US-23 | Change interface language (en, es-419) | shared / notifications | `Accept-Language` | `ErrorResource.message` | `ErrorResponseAssembler` | Partial: `en` and `es` only (not `es-419`), localizes error messages only; notifications are English |
| US-24 | View/download a completed service report | reporting, service.request | `GET /service-requests/{id}` (`intervention`), `POST/GET /reports` | `ServiceRequestResource.intervention`; `ReportResource.download_url` | `ReportCommandService`, `ReportQueryService` | Partial: intervention data is in the request; no per-service downloadable report type exists |
| US-25 | Dashboard metrics | profiles | none (`/profiles/dashboard-configs/*` stores layout only) | none | none | Not implemented (backend): no metrics endpoint |
| US-26 | ESP32 firmware to local gateway | none | none | none | none | Outside this backend (firmware) |
| US-27 | Historical and current telemetry | monitoring | `GET /telemetry/equipment/{id}?from&to` | -> `SensorReadingResource[]` | `SensorReadingQueryService` | Implemented (owner, and technician with an active assignment) |
| US-28 | Automatic alerts for sustained excursions | monitoring | `POST /telemetry/events` (edge) | `RecordEdgeEventResource` -> `EdgeEventResource` | `EdgeEventCommandService`, `SensorReadingCommandService` | Implemented: cloud records alerts reported by the gateway; detection itself is at the edge |
| US-29 | Interpret alert and generate corrective order | monitoring, service.request | `GET /alerts/{id}`, `POST /service-requests` | `CreateServiceRequestResource` | `AlertQueryService`, `ServiceRequestCommandService` | Partial: `CreateServiceRequestResource` has no link to the alert |
| US-30 | Receive, accept or reject assignments | service.request, notifications | `PUT /service-requests/{id}/accept`, `/reject`, `GET /notifications` | `RejectServiceRequestResource` -> `ServiceRequestResource` | `ServiceRequestCommandService` | Implemented |
| US-31 | Offline intervention logging | service.request | `POST /interventions` (idempotent by `client_generated_id`) | `RegisterInterventionResource` -> `InterventionResource` | `ServiceRequestCommandService` | Implemented (backend side); offline queue is the mobile app's job. Photos are URL strings only |
| US-32 | Push alerts for thermal anomalies to technicians | notifications | `PUT /notifications/device-tokens` | `RegisterDeviceTokenResource` | `NotificationCommandService` | Partial: FCM works; thermal alerts notify only the owner |
| US-33 | Update status and view on-site telemetry | service.request, assets, monitoring | `PUT /service-requests/{id}/start`, `GET /assets/equipments/{id}`, `GET /telemetry/equipment/{id}` | `StartServiceRequestResource` | `ServiceRequestCommandService` | Implemented |
| US-34 | Google sign-in | iam | `POST /authentication/google/verify`, `/link`, `/complete-registration/*` | `SignInWithGoogleResource`, `LinkGoogleAccountResource`, `Complete*RegistrationResource` -> `AuthenticatedUserResource` | `UserCommandService` | Implemented |
| US-35 | Configure dashboard cards | profiles | `GET/POST /profiles/dashboard-configs...`, `PUT .../layout`, `PATCH .../visibility`, `PUT .../defaults`, `POST .../reset-defaults` | `UpdateDashboardLayoutResource`, `UpdateDashboardDefaultsResource` -> `DashboardConfigResource` | `DashboardConfigCommandService` | Implemented |
| US-36 | Configure temperature thresholds | assets | `PUT /assets/equipments/{id}/threshold` | `ChangeThresholdResource` -> `EquipmentResource` | `EquipmentCommandService` | Implemented |
| US-37 | Pair a device with equipment | device | `POST /devices` | `RegisterDeviceResource` -> `DeviceCredentialResource` | `DeviceCommandService` | Implemented |
| US-38 | Rotate or revoke device credentials | device | `POST /devices/{id}/rotate-api-key`, `PUT /devices/{id}/status`, `POST /devices/{id}/unpair` | `ChangeDeviceStatusResource` -> `DeviceCredentialResource` / `DeviceResource` | `DeviceCommandService` | Implemented |
| US-39 | Physical status signaling on the device | none | none | none | none | Outside this backend (firmware) |
| US-40 | Check local device status on-site | none | none | none | none | Outside this backend (gateway local API); the edge grant (`it_grt_...`) is issued here |
| US-41 | Alert lifecycle | monitoring | `PUT /alerts/{id}/acknowledge`, `/resolve`, `/dismiss` | `DismissAlertResource` -> `AlertResource` | `AlertCommandService` | Implemented |
| US-42 | Detect non-reporting equipment | monitoring | none (time-driven) | none | `EquipmentConnectivityCommandService`, `SensorReadingCommandService` | Partial: silence rule, offline marking, `DEVICE_OFFLINE` raising (maintenance-aware, no duplicates) and recovery on the next reading are implemented; no periodic trigger runs the detection yet (pending, development team) |
| US-43 | Notification center | notifications | `GET /notifications`, `/unread-count`, `/{id}`, `PUT .../read`, `PUT .../dismiss` | -> `PagedNotificationResource`, `NotificationResource`, `UnreadNotificationCountResource` | `NotificationQueryService`, `NotificationCommandService` | Implemented |
| US-44 | Role-targeted notifications | notifications | same | same | same | Partial: inbox is per recipient; producers are limited (no technician alert pushes, `DEVICE_OFFLINE` pending its trigger) |
| US-45 | Thermal excursion report with cold-chain metrics | reporting | `POST /reports` (`type: TEMPERATURE_EXCURSION`) | `CreateReportResource` -> `ReportResource` | `ReportCommandService` | Implemented (the KPI content of the file was not inspected) |
| US-46 | Mobile sign-in | iam | sign-in endpoints with `channel: MOBILE` | same as US-02, US-34 | `UserCommandService` | Implemented |
| US-47 | View site location and navigate | assets | `GET /assets/sites/{id}` | -> `SiteResource` (`location`, `navigation_url`) | `SiteQueryService` | Implemented (map rendering is the app's job) |
| US-48 | Toggle maintenance mode from mobile | monitoring | `POST /telemetry/events` (`MAINTENANCE_WINDOW_STARTED/ENDED`, origin `APP`) from the gateway; `GET /maintenance-windows` | `RecordEdgeEventResource` -> `EdgeEventResource` | `EdgeEventCommandService` | Implemented for the cloud record; the command runs on the gateway (outside this backend) |
| US-49 | Mute buzzer / test signaling | none | none | none | none | Outside this backend (gateway local) |
| US-50 | Verify site address with Google Maps | assets | `POST /assets/sites/validate-address` | `ValidateAddressResource` -> `AddressValidationResource` | `AddressValidationCommandService` | Implemented |
| US-51 | Maintenance mode via hardware button | monitoring | `POST /telemetry/events` (origin `BUTTON`) | `RecordEdgeEventResource` | `EdgeEventCommandService` | Implemented for the cloud record; button handling is firmware |
| US-52 | Open-door detection by light sensor and alert owner | monitoring | readings carry `light_level_max`, `door_open_seconds` | `RecordReadingBatchResource` | `SensorReadingCommandService` | Partial: fields are stored; no door alert type, policy or event exists (see TS-31, TS-32) |
| US-53 | Record presence (PIR) | monitoring | `POST /telemetry` (`presence_detected`) | `RecordReadingBatchResource` -> `SensorReadingResource` | `SensorReadingCommandService` | Implemented (storage and read-back) |
| US-54 | View door openings next to temperature | monitoring | `GET /telemetry/equipment/{id}` (`door_open_seconds`) | `SensorReadingResource` | `SensorReadingQueryService` | Partial: data is available; the chart is client-side |
| US-55 | Detect defective temperature sensor | monitoring | none | none | none | Not implemented (backend): no sensor-fault event type (`EdgeEventType` has four values) |
| US-56 | Calibrate temperature sensor | assets / monitoring | none | readings carry raw and calibrated values only | none | Not implemented (backend): no calibration offset endpoint |

## Technical stories

| Story | Objective | Endpoint(s) / evidence | Status |
|---|---|---|---|
| TS-01 | Create service requests via API | `POST /service-requests` | Implemented |
| TS-02 | Intervention logging, transactional and idempotent | `POST /interventions` | Implemented |
| TS-03 | Review management | `POST /reviews`, `PUT /reviews/{id}` | Implemented |
| TS-04 | Role-specific registration | `POST /authentication/sign-up/owner|technician` | Implemented |
| TS-05 | Service request status query | `GET /service-requests/{id}`, list | Implemented |
| TS-06 | Mobile app integration with the REST API | this documentation | Outside this backend (mobile) |
| TS-07 | Credential verification for user JWT and edge API keys | `WebSecurityConfiguration`, `EdgeSecurityConfiguration` (two chains inside the application; no separate API gateway component in this repository) | Implemented in-app |
| TS-08 | Device management endpoints | `/devices/**` | Implemented |
| TS-09 | Edge API reading ingestion | Edge API is a separate component | Outside this backend; cloud counterpart is TS-12 |
| TS-10 | Local threshold evaluation with hysteresis at the edge | edge; cloud supplies thresholds and policy through `GET /devices/me/config` | Outside this backend |
| TS-11 | Reliable edge-to-cloud sync (outbox) | edge; cloud is idempotent by `reading_uid` / `event_uid` | Outside this backend (cloud side idempotent) |
| TS-12 | Cloud aggregated telemetry ingestion | `POST /telemetry` | Implemented |
| TS-13 | Real-time streaming to the dashboard | ticket + SSE | Implemented |
| TS-14 | Service request status transition endpoints | `assign`, `accept`, `reject`, `start`, `cancel`, `POST /interventions` | Implemented |
| TS-15 | FCM push integration | `FcmPushGateway`, `/notifications/device-tokens` | Implemented |
| TS-16 | Async report generation with Google Cloud Storage | `ReportGenerationWorker`, `GcsReportFileStorage` | Implemented |
| TS-17 | Address validation with Google Maps | `POST /assets/sites/validate-address` | Implemented |
| TS-18 | Credential authentication | `POST /authentication/sign-in/local` | Implemented |
| TS-19 | Google authentication | `/authentication/google/*` | Implemented |
| TS-20 | Threshold configuration endpoint | `PUT /assets/equipments/{id}/threshold` | Implemented |
| TS-21 | Edge API local device status endpoint | edge | Outside this backend |
| TS-22 | Paginated and filtered service requests | `GET /service-requests?status&page&size` | Implemented |
| TS-23 | Decoupled technician metric projection | `TechnicianMetricsProjector` (outbox events) | Implemented |
| TS-24 | Equipment intervention history | `GET /assets/equipments/{id}/interventions` | Implemented |
| TS-25 | Device configuration polling | `GET /devices/me/config` (ETag / `If-None-Match`) | Implemented |
| TS-26 | Technician edge grant | `accept`, `POST /service-requests/{id}/edge-grant`, `EdgeGrantTokenService` | Implemented |
| TS-27 | Local technician commands on the edge API | edge | Outside this backend |
| TS-28 | Site registration and address update with validated location | `POST /assets/sites`, `PUT /assets/sites/{id}/address` | Implemented |
| TS-29 | Link maintenance windows to service requests | `MaintenanceWindowLinkEventListener`, `ServiceRequestResource.maintenance_windows` | Implemented |
| TS-30 | Maintenance window management and queries | `POST /telemetry/events`, `GET /maintenance-windows` | Implemented |
| TS-31 | Telemetry/event contract for light, presence and sensor faults | `RecordReadingBatchResource` has `light_level_max`, `door_open_seconds`, `presence_detected`; `EdgeEventTypeResource` has no door or sensor-fault events | Partial |
| TS-32 | Door threshold policy and calibration configuration | `UpdateAlertPolicyResource` has only `sustained_excursion_minutes`, `hysteresis_margin_celsius`, `missed_sync_windows_for_offline`; `GET /devices/me/config` does not carry door or calibration values | Not implemented (backend) |

## Non-functional requirements touching the API

| NFR | Observation |
|---|---|
| NFR-07 Idempotency | Implemented for `POST /telemetry` (`reading_uid`), `POST /telemetry/events` (`event_uid`), `POST /interventions` (`client_generated_id`), `PUT .../start` (`started_at`). Other writes are not idempotent |
| NFR-09 Internationalization | `Accept-Language` en/es for error messages; notification text English only |
| NFR-04 HTTPS | A deployment concern; the application listens on HTTP |

## Contradictions between backlog and implementation worth knowing

1. Backlog scenarios speak of es-419; the code supports `es` (and English fallback).
2. The backlog describes dashboard metrics; the API only stores layout.
3. The backlog expects technician pushes for critical alerts; only owners are notified of alerts.
4. Door, calibration and sensor-fault features are absent from the cloud API even though their reading fields exist.
