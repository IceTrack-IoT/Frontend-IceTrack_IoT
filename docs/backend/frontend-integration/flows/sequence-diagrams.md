# Sequence diagrams

Every diagram below is traced to classes in the repository (named in the text under each). Diagrams 1, 2 and 4 to 12 follow flows that were also exercised over HTTP against a locally running backend (diagram 13 is covered by unit tests only, because nothing triggers it yet); the arrows marked asynchronous are drawn from the code, and their timing was not validated. Participants named `Facade` are the inbound ACL classes of the target context; "ExternalService" classes live in the calling context. Mermaid syntax; render with any Mermaid viewer.

Contents: [1 Username/password sign-in](#1-usernamepassword-sign-in) | [2 Token refresh](#2-token-refresh) | [3 Google authentication](#google-authentication) | [4 Equipment registration](#4-equipment-registration) | [5 Site address validation and registration](#5-site-address-validation-and-site-registration) | [6 Service request creation](#6-service-request-creation) | [7 Technician assignment](#7-technician-assignment) | [8 Acceptance, start and completion](#8-service-acceptance-start-and-completion) | [9 Device pairing](#9-device-pairing) | [10 Telemetry processing](#10-telemetry-ingestion-and-live-stream) | [11 Alert and notification](#11-thermal-alert-to-notification-and-push) | [12 Report generation](#12-report-generation-and-file-retrieval) | [13 Device offline detection](#13-device-offline-detection-and-recovery)

## 1. Username/password sign-in

Classes: `AuthenticationController.signIn`, `UserCommandServiceImpl.handle(SignInByLocalCommand)`, `SignInRateLimitFilter`.

```mermaid
sequenceDiagram
  participant FE as Web / Mobile
  participant RL as SignInRateLimitFilter
  participant C as AuthenticationController
  participant S as UserCommandServiceImpl
  participant P as ProfilesContextFacade (via ExternalProfileService)
  participant DB as PostgreSQL
  FE->>RL: POST /api/v1/authentication/sign-in/local {username,password,channel}
  RL->>RL: throttled? (address / account) -> 429 + Retry-After
  RL->>C: pass
  C->>S: SignInByLocalCommand
  alt identifier contains @
    S->>P: fetchUserIdByEmail
  end
  S->>DB: find user, check BCrypt (dummy hash if unknown)
  alt bad credentials
    S-->>FE: 401 BAD_CREDENTIALS (counted by the filter)
  else role does not match channel
    S-->>FE: 403 ROLE_CHANNEL_MISMATCH
  else ok
    S->>DB: store refresh token digest (channel-bound)
    S-->>FE: 200 {id,username,role,provider,token,refresh_token}
  end
```

## 2. Token refresh

Classes: `UserCommandServiceImpl.handle(RefreshTokenCommand)`, `AuthenticationExceptionHandler`.

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant S as UserCommandServiceImpl
  participant DB as PostgreSQL
  FE->>S: POST /authentication/refresh-token {refresh_token}
  S->>DB: find by SHA-256 digest
  alt unknown / expired / revoked
    S-->>FE: 401 REFRESH_TOKEN_INVALID | EXPIRED | REVOKED
  else already rotated
    alt within 20 s grace
      S-->>FE: 401 REFRESH_TOKEN_RECENTLY_ROTATED (retry once with the latest token)
    else later
      S->>DB: revoke every session of the user
      S-->>FE: 401 REFRESH_TOKEN_REPLAY_DETECTED
    end
  else valid
    S->>DB: rotate token, keep channel
    S-->>FE: 200 new token + refresh_token
  end
```

## Google authentication

Classes: `AuthenticationController.verifyGoogleAccount|linkGoogleAccount|completeGoogle*Registration`, `GoogleTokenServiceImpl`, `UserCommandServiceImpl`.

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant G as Google (Sign-In SDK)
  participant API as IceTrack API
  participant J as Google JWKS (googleapis.com)
  FE->>G: user signs in with Google
  G-->>FE: id_token (Google JWT)
  FE->>API: POST /authentication/google/verify {id_token, channel}
  API->>J: fetch signing keys (cached by NimbusJwtDecoder)
  API->>API: verify signature, iss, exp, aud = GOOGLE_CLIENT_ID, email verified
  alt token invalid
    API-->>FE: 401 INVALID_TOKEN
  else Google sub already linked
    alt channel admits role
      API-->>FE: 200 {token, refresh_token, ...}
    else
      API-->>FE: 403 ROLE_CHANNEL_MISMATCH
    end
  else email belongs to a password account
    API-->>FE: 409 ACCOUNT_LINK_REQUIRED
    FE->>API: POST /authentication/google/link {id_token, password, channel}
    API-->>FE: 200 tokens (or 401 BAD_CREDENTIALS)
  else unknown
    API-->>FE: 404 GOOGLE_ACCOUNT_NOT_FOUND
    FE->>FE: show role selection + onboarding form
    FE->>API: POST /authentication/google/complete-registration/owner|technician {id_token, form}
    API-->>FE: 201 tokens (account + profile created)
  end
```

## 4. Equipment registration

Classes: `EquipmentController.registerEquipment`, `EquipmentCommandServiceImpl`, `AssetsExternalOwnerService`, `EquipmentRegisteredEventHandler`.

```mermaid
sequenceDiagram
  participant FE as Web (owner)
  participant C as EquipmentController
  participant S as EquipmentCommandServiceImpl
  participant X as AssetsExternalOwnerService
  participant IAM as IamContextFacade
  participant PRO as ProfilesContextFacade
  participant DB as PostgreSQL
  FE->>C: POST /api/v1/assets/equipments {site_id,uid,name,equipment_type,min_celsius,max_celsius,reminder_interval_days}
  C->>S: RegisterEquipmentCommand (after @Valid)
  S->>X: fetchOwnerIdByUsername
  X->>IAM: fetchUserIdByUsername
  X->>PRO: fetchOwnerIdByUserId
  X-->>S: owner id (none -> 403)
  S->>DB: site reachable by owner? (none -> 404) ; uid unique? (-> 409)
  S->>DB: save Equipment (ACTIVE, online=false, config_version)
  S-->>C: EquipmentRegisteredEvent -> site equipment_count + 1
  C-->>FE: 201 EquipmentResource
```

## 5. Site address validation and site registration

Classes: `SiteController.validateAddress|registerSite`, `AddressValidationCommandServiceImpl`, `GoogleMapsGeocodingAdapter`, `AddressValidationTokenService`, `SiteCommandServiceImpl`.

```mermaid
sequenceDiagram
  participant FE as Web (owner)
  participant API as SiteController / services
  participant GM as Google Geocoding API
  FE->>API: POST /assets/sites/validate-address {address, place_id?}
  API->>API: owner profile? 20/min limit?
  API->>GM: GET geocode?address=... (or place_id=...) [2 s connect, 3 s read, no retry]
  GM-->>API: results
  alt one exact match inside Lima/Callao
    API-->>FE: 200 {formatted_address, latitude, longitude, place_id, district, area, validation_token}
  else ambiguous / zero / partial
    API-->>FE: 422 ADDRESS_NOT_VERIFIED {candidates[]}
  else outside coverage
    API-->>FE: 422 ADDRESS_OUT_OF_COVERAGE
  else Google failure or timeout
    API-->>FE: 503 GEOCODING_UNAVAILABLE (Retry-After 30)
  end
  FE->>FE: owner confirms, optionally drags pin
  FE->>API: POST /assets/sites {name, contact_name, phone, validation_token, pin?}
  API->>API: verify token (owner-bound, 15 min), pin within 150 m
  API-->>FE: 201 SiteResource (geocoding_status RESOLVED, location, navigation_url)
```

## 6. Service request creation

Classes: `ServiceRequestsController.createServiceRequest`, `ServiceRequestCommandServiceImpl`, `ExternalUserProfileService`, `ExternalEquipmentService`.

```mermaid
sequenceDiagram
  participant FE as Web (owner)
  participant C as ServiceRequestsController
  participant S as ServiceRequestCommandServiceImpl
  participant U as ExternalUserProfileService (iam + profiles facades)
  participant E as ExternalEquipmentService
  participant A as AssetContextFacade
  FE->>C: POST /api/v1/service-requests {equipment_id,type,priority,description}
  C->>S: CreateServiceRequestCommand
  S->>U: fetchOwnerIdByUsername
  S->>E: fetchOwnedEquipment(ownerId, equipmentId)
  E->>A: existsEquipmentForOwner, getSiteIdByEquipment
  alt not owned / missing
    S-->>FE: 404 EQUIPMENT_NOT_FOUND
  else
    S->>S: ServiceRequest PENDING (no technician) + ServiceRequestCreatedEvent
    S-->>FE: 201 ServiceRequestResource
  end
```

## 7. Technician assignment

Classes: `ServiceRequestsController.assignTechnician`, `ServiceRequestCommandServiceImpl`, `ExternalUserProfileService.isTechnicianEligibleForAssignment`, `ServiceRequestOutboxEventHandler`, `ServiceRequestNotificationEventListener`.

```mermaid
sequenceDiagram
  participant FE as Web (owner)
  participant S as ServiceRequestCommandServiceImpl
  participant P as ProfilesContextFacade
  participant OB as outbox_events
  participant N as Notifications
  participant M as Mobile (technician)
  FE->>S: PUT /service-requests/{id}/assign {technician_profile_id}
  S->>P: isTechnicianEligibleForAssignment (via ExternalUserProfileService; the facade only checks that the technician profile exists)
  alt not eligible
    S-->>FE: 409 TECHNICIAN_NOT_ELIGIBLE
  else request not PENDING/ACCEPTED
    S-->>FE: 409 INVALID_STATUS_TRANSITION
  else
    S->>S: status PENDING, previous grant revoked
    S->>OB: TechnicianAssignedIntegrationEvent (same transaction)
    S-->>FE: 200 ServiceRequestResource
    OB-->>N: dispatcher (every 2 s) -> notification to the technician
    N-->>M: FCM push (if a device token is registered)
  end
```

## 8. Service acceptance, start and completion

Classes: `ServiceRequestsController.acceptServiceRequest|startServiceRequest`, `InterventionsController.registerIntervention`, `EdgeGrantTokenService`.

```mermaid
sequenceDiagram
  participant M as Mobile (technician)
  participant API as service.request
  participant GW as On-site gateway
  M->>API: PUT /service-requests/{id}/accept
  API-->>M: 200 ServiceRequestResource {status ACCEPTED, edge_grant{token it_grt_...}} (token shown once)
  Note over API,GW: gateway learns the grant digest on its next GET /devices/me/config (config_version bumped)
  M->>GW: operate the gateway with the plaintext edge grant (outside this API)
  M->>API: PUT /service-requests/{id}/start {started_at?}
  API-->>M: 200 {status IN_PROGRESS}
  M->>API: POST /interventions {service_request_id, client_generated_id, diagnosis, actions_taken, spare_parts?, photo_evidence?, completed_at?}
  alt first time
    API-->>M: 201 InterventionResource, request COMPLETED, grant revoked
  else same client_generated_id for the same request (offline retry)
    API-->>M: 200 stored InterventionResource
  end
```

## 9. Device pairing

Classes: `DeviceController.registerDevice`, `DeviceCommandServiceImpl`, `ExternalAssetManagementServiceForDevice`, `DeviceCredentialService`.

```mermaid
sequenceDiagram
  participant FE as Web (owner)
  participant C as DeviceController
  participant S as DeviceCommandServiceImpl
  participant A as AssetContextFacade (via ExternalAssetManagementServiceForDevice)
  FE->>C: POST /api/v1/devices {equipment_id, device_uid, board_model, firmware_version?}
  C->>S: RegisterDeviceCommand
  S->>A: existsEquipmentForOwner(equipmentId, ownerId)
  alt not owned
    S-->>FE: 404 EQUIPMENT_NOT_FOUND
  else equipment already has a device, or the device_uid is already linked
    S-->>FE: 409 DEVICE_CONFLICT
  else
    S->>S: Device PAIRED (an existing UNPAIRED device with the same device_uid is reused), new key it_dev_..., digest stored
    S-->>FE: 201 {device{...}, api_key}  (api_key shown once)
    Note over FE: owner copies api_key into the gateway/board configuration
  end
```

## 10. Telemetry ingestion and live stream

Classes: `EdgeSecurityConfiguration`, `ApiKeyAuthenticationFilter`, `TelemetryController.recordReading`, `SensorReadingCommandService`, `ExternalAssetManagementService` -> `AssetContextFacade`, `ExternalDeviceServiceForMonitoring` -> `DeviceContextFacade`, `TelemetryStreamEventDispatcher`, `TelemetryStreamRegistry`, `TelemetryStreamController`.

The connectivity updates run synchronously, inside the ingestion transaction: they commit with the reading or not at all, and a duplicate batch changes none of them.

```mermaid
sequenceDiagram
  participant GW as Edge gateway
  participant F as ApiKeyAuthenticationFilter
  participant T as TelemetryController
  participant S as SensorReadingCommandService
  participant A as AssetContextFacade
  participant DV as DeviceContextFacade
  participant D as TelemetryStreamEventDispatcher
  participant FE as Web dashboard (EventSource)
  FE->>T: POST /telemetry/stream-ticket (Bearer) -> {ticket, expires_in 60}
  FE->>D: GET /telemetry/stream?ticket=... (consumes the ticket)
  D-->>FE: event stream-opened
  GW->>F: POST /api/v1/telemetry  X-API-Key
  F->>T: DEVICE_ROLE principal
  T->>S: command (payload ids must match the key's device)
  Note over S: new batch only (a duplicate returns here)
  S->>A: recordEquipmentReading(equipmentId, avg_temperature, recorded_at)
  Note over A: Equipment.recordReading: online = true (unless DEACTIVATED), last reading moves forward only
  S->>DV: recordActivity(deviceId, received_at)
  S->>S: resolve active DEVICE_OFFLINE alert of the unit, if any
  S-->>T: Recorded | Duplicate
  T-->>GW: 201 SensorReadingResource | 200 duplicate | 400 | 403 | 409
  S-)D: ReadingRecordedEvent (after commit, async)
  D-)FE: event telemetry-update {type READING_RECORDED,...} (owner of the unit only)
```

## 11. Thermal alert to notification and push

Classes: `EdgeEventsController.recordEvent`, `EdgeEventCommandService`, `AlertRaisedEventHandler`, `AlertRaisedEventListener`, `NotificationCommandServiceImpl`, `NotificationCreatedEventHandler`, `FcmPushGateway`.

```mermaid
sequenceDiagram
  participant GW as Edge gateway
  participant M as monitoring
  participant N as notifications
  participant A as AssetContextFacade
  participant FCM as Firebase Cloud Messaging
  participant FE as Owner web/mobile
  GW->>M: POST /telemetry/events {event_uid, type THERMAL_EXCURSION_DETECTED, occurred_at, temperature_celsius}
  M->>M: dedupe by event_uid; maintenance window? active alert?
  M-->>GW: 201 ALERT_OPENED (or 200 ALERT_ALREADY_ACTIVE / SUPPRESSED_BY_MAINTENANCE)
  M->>N: AlertRaisedIntegrationEvent (in-process @EventListener: synchronous, same thread and transaction as the POST)
  N->>A: getEquipmentOwnerId (via ExternalAssetManagementServiceForNotifications)
  N->>N: save Notification (English text) -> NotificationCreatedEvent
  N-)FCM: after NotificationCreatedEvent, a separate @Async handler sends the multicast push (only this step is asynchronous)
  FCM-)FE: push {notification_id, type, severity, equipment_id, alert_id}
  FE->>N: GET /notifications, GET /alerts/{id}, PUT /alerts/{id}/acknowledge
```

## 12. Report generation and file retrieval

Classes: `ReportsController`, `ReportCommandServiceImpl`, `ReportGenerationWorker`, `ReportFileStorage` (`GcsReportFileStorage`), `ReportQueryServiceImpl`.

```mermaid
sequenceDiagram
  participant FE as Web (owner)
  participant C as ReportsController
  participant W as ReportGenerationWorker (reportTaskExecutor)
  participant X as Monitoring/Assets/ServiceRequest ExternalServices
  participant GCS as Google Cloud Storage
  FE->>C: POST /api/v1/reports {name,type,format,filters{from,to,...}}
  C-->>FE: 202 ReportResource {status PENDING}
  Note over C,W: after commit, ReportRequestedEvent
  W->>W: PENDING -> GENERATING
  W->>X: gather KPIs / samples for the filters
  W->>GCS: store reports/{ownerId}/{reportId}.{ext}
  W->>W: COMPLETED (or FAILED + failure_reason)
  loop poll
    FE->>C: GET /api/v1/reports/{id}
    C->>GCS: sign V4 URL (15 min) when COMPLETED
    C-->>FE: 200 ReportResource {status, download_url?}
  end
  FE->>GCS: GET download_url (direct)
```

## 13. Device offline detection and recovery

Classes: `EquipmentConnectivityCommandService` (`DetectOfflineEquipmentCommand`), `AlertPolicy.isOfflineSince`, `Alert.raisedForSilence`, `ExternalAssetManagementService` -> `AssetContextFacade.fetchOnlineEquipmentIds` / `markEquipmentOffline`, `AlertRaisedEventHandler`, `AlertRaisedEventListener` (notifications).

**Pending:** nothing invokes the detection periodically yet; the trigger belongs to the development team. The recovery half (diagram 10) runs on every reading.

```mermaid
sequenceDiagram
  participant TR as Periodic trigger (pending)
  participant C as EquipmentConnectivityCommandService
  participant A as AssetContextFacade
  participant R as SensorReadingRepository
  participant AL as AlertRepository
  participant N as Notifications (AlertRaisedEventListener)
  TR->>C: DetectOfflineEquipmentCommand(now)
  C->>A: fetchOnlineEquipmentIds()
  loop each online unit, own transaction
    C->>R: latest received reading
    Note over C: silent >= 60 s x missed_sync_windows_for_offline? skip if a maintenance window covers now
    C->>A: markEquipmentOffline(equipmentId)
    alt no active DEVICE_OFFLINE alert
      C->>AL: save Alert.raisedForSilence (OPEN, WARNING)
      AL->>N: AlertRaisedIntegrationEvent (synchronous listener) -> owner notification
    end
  end
```

