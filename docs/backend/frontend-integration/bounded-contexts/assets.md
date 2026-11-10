# Assets

Package `pe.edu.upc.ice.track.platform.assets`. API: [../api/assets/endpoints.md](../api/assets/endpoints.md), contracts: [../api/assets/contracts.md](../api/assets/contracts.md). Maps integration: [../integrations/google-maps.md](../integrations/google-maps.md).

## Responsibilities

Sites (operational locations with verified addresses) and refrigeration equipment (identity, type, status, temperature threshold, maintenance reminder interval, `config_version` for the edge).

## Package organization (actual)

```text
assets/
  application/commandservices   AddressValidationCommandService, EquipmentCommandService, SiteCommandService
  application/queryservices     EquipmentQueryService, SiteQueryService
  application/internal/eventhandlers   EquipmentRegisteredEventHandler (increments site equipment count), SiteCreatedEventHandler, TemperatureThresholdUpdatedEventHandler
  application/internal/outboundservices
      acl/AssetsExternalOwnerService, AssetsExternalServiceRequestService
      geocoding/GeocodingPort, addressvalidation/AddressValidationTokenPort, ValidationRateLimiterPort
  domain/model/aggregates   Equipment, Site
  domain/model/valueobjects Address, GeoLocation, VerifiedAddress, CoverageArea, TemperatureThreshold, StatusEquipment, EquipmentType, GeocodingStatus ...
  domain/model/policies     CoveragePolicy, PinDistancePolicy
  infrastructure/geocoding/adapters/GoogleMapsGeocodingAdapter, infrastructure/addressvalidation/* (token service, rate limiter)
  infrastructure/monitoring/events, infrastructure/servicerequest/events   listeners for other contexts' events
  interfaces/acl/AssetContextFacade ; interfaces/rest  EquipmentController, SiteController
```

## Domain rules visible through the API

| Rule | Where |
|---|---|
| Threshold band: each bound 0 to 30 degrees C, minimum strictly below maximum; an accepted band increments `config_version` | `ChangeThresholdResource`, `RegisterEquipmentResource`, `TemperatureThreshold` |
| `uid` is unique across the platform, max 30 chars (`409 DUPLICATE_RESOURCE_CONFLICT` / `EQUIPMENT_CONFLICT` otherwise) | `EquipmentCommandServiceImpl` |
| `name` max 30 chars; `reminder_interval_days` positive | resources |
| Equipment status matrix: `ACTIVE` -> `MAINTENANCE`, `REPAIR`, `DEACTIVATED`; `MAINTENANCE` -> `ACTIVE`, `REPAIR`, `DEACTIVATED`; `REPAIR` -> `ACTIVE`, `DEACTIVATED`; `DEACTIVATED` -> `ACTIVE`. Same status is a no-op; anything else is `409`. Deactivating forces `online=false` | `StatusEquipment`, `Equipment.changeStatus` |
| Maintenance windows opened by the edge move an `ACTIVE` unit to `MAINTENANCE` and back when they close | `MaintenanceWindowStatusEventListener` |
| Site `name`, `contact_name` max 30; `phone` required; address and coordinates only change through a verified `validation_token` | resources, `SiteCommandServiceImpl` |
| Coverage: Metropolitan Lima or Callao only; pin within 150 m of the verified point | `CoveragePolicy`, `PinDistancePolicy` |

## Internal data flow, `POST /api/v1/assets/sites` (register a site)

`SiteController.registerSite` (owner) -> `RegisterSiteCommandFromResourceAssembler` -> `SiteCommandServiceImpl.handle`: resolve owner id through `AssetsExternalOwnerService` (`IamContextFacade.fetchUserIdByUsername`, `ProfilesContextFacade.fetchOwnerIdByUserId`) -> `AddressValidationTokenPort.verify(token, ownerId)` (HS256, 15 min, owner-bound; else `ADDRESS_VALIDATION_REQUIRED`) -> optional pin check (`PinDistancePolicy`, else `PIN_OUT_OF_RANGE`) -> `Site` aggregate saved as `RESOLVED` -> `SiteCreatedEvent` -> `SiteResourceFromEntityAssembler` -> `201 SiteResource` (`location` and `navigation_url` present when located).

## Access model

Owners see only their own sites and units. Technicians can read a unit or site only while holding an active (`PENDING`, `ACCEPTED`, `IN_PROGRESS`) request on it (`AssetsExternalServiceRequestService.isTechnicianAssignedToEquipment/ToSite`). Anything else answers `404`.

## Read-model fields that depend on other contexts

`EquipmentResource.online`, `last_reading_at`, `last_known_temperature` are written only by Monitoring, through `AssetContextFacade.recordEquipmentReading` (every stored reading batch: `online` becomes `true` unless the unit is `DEACTIVATED`; `last_reading_at` and `last_known_temperature` take the batch's `recorded_at` and `avg_temperature`, and never move backwards for a batch delivered late) and `AssetContextFacade.markEquipmentOffline` (offline detection). A unit registered without readings is `false` / `null` / `null`. `config_version` is bumped by threshold changes, alert-policy updates (`AlertPolicyUpdatedIntegrationEvent`) and edge-grant issue/revoke events.

## Interfaces

`EquipmentController` (6 endpoints) and `SiteController` (7). `GET /api/v1/assets/equipments` returns a plain array unless both `page` and `size` are present, in which case it returns `PagedEquipmentResource` (`content`, `page`, `size`, `total_elements`, `total_pages`). `AssetContextFacade` is the inbound ACL.

## Dependencies

Outbound: `AssetsExternalOwnerService` (iam, profiles), `AssetsExternalServiceRequestService` (iam, profiles, service.request), technical ports (Google Maps, token, rate limiter). Inbound: `AssetContextFacade` used by device, monitoring, notifications, reporting, service.request. Listens to: `AlertPolicyUpdatedIntegrationEvent`, `MaintenanceWindowOpened/ClosedIntegrationEvent`, `EdgeGrantIssued/RevokedIntegrationEvent`.
