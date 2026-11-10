# Device Management

Package `pe.edu.upc.ice.track.platform.device`. API: [../api/device/endpoints.md](../api/device/endpoints.md), contracts: [../api/device/contracts.md](../api/device/contracts.md).

## Responsibilities

Pairing of ESP32 boards with equipment, issuing and rotating device API keys, revoking and unpairing devices, device authentication for edge routes, and the configuration the gateway polls (`GET /api/v1/devices/me/config`).

## Package organization (actual)

```text
device/
  application/commandservices   DeviceCommandService (register, unpair, rotate key, change status, recordActivity)
  application/queryservices     DeviceQueryService (get, list by equipment, authenticateByApiKey), EdgeConfigurationQueryService
  application/results           DeviceAuthenticationResult ...
  application/internal/eventhandlers   DeviceRegistered/Paired/UnpairedEventHandler (publish integration events)
  application/internal/outboundservices
      acl/DeviceExternalOwnerService, ExternalAssetManagementServiceForDevice, ExternalMonitoringServiceForDevice, ExternalServiceRequestServiceForDevice
      credentials/DeviceCredentialService, IssuedDeviceCredential
  domain/model/aggregates/Device ; valueobjects/DeviceStatus (UNPAIRED, PAIRED, REVOKED)
  infrastructure/authorization   ApiKeyAuthenticationFilter, EdgeSecurityConfiguration, DeviceAuthenticationToken
  infrastructure/credentials, infrastructure/persistence/jpa
  interfaces/acl/DeviceContextFacade ; interfaces/events/Device*IntegrationEvent
  interfaces/rest   DeviceController, EdgeConfigurationController
```

## Device state machine (`Device`)

| From | Action | To |
|---|---|---|
| `UNPAIRED` | pair (`POST /devices`) with a fresh API key | `PAIRED` |
| `PAIRED` | `PUT /devices/{id}/status` `REVOKED` (invalidate key, keep link) | `REVOKED` |
| `REVOKED` | `POST /devices/{id}/rotate-api-key` (issues a new key) | `PAIRED` |
| `PAIRED` or `REVOKED` | `POST /devices/{id}/unpair` or status `UNPAIRED` | `UNPAIRED` |

An equipment can have at most one paired device and a board at most one equipment (`409 DEVICE_CONFLICT`). The raw API key (`it_dev_...`) is returned only in `DeviceCredentialResource.api_key` on pairing and rotation; only its digest is stored.

## Internal data flow, `POST /api/v1/devices` (pair)

`DeviceController.registerDevice` (`OWNER_ROLE`) -> `RegisterDeviceCommandFromResourceAssembler` -> `DeviceCommandServiceImpl`: owner resolved by `DeviceExternalOwnerService` (iam + profiles facades) -> `ExternalAssetManagementServiceForDevice.existsEquipmentForOwner` (`AssetContextFacade`; not owned or missing is `404 EQUIPMENT_NOT_FOUND`) -> `Device.pairTo` with a key from `DeviceCredentialService` -> repository -> `DeviceRegisteredEvent`/`DevicePairedEvent` -> `DeviceCredentialResourceAssembler` -> `201 DeviceCredentialResource`.

## Edge configuration (`GET /api/v1/devices/me/config`)

Authenticated by `X-API-Key` only. `EdgeConfigurationQueryService` assembles: equipment `config_version`, thresholds (`ExternalAssetManagementServiceForDevice`), alert policy values (`ExternalMonitoringServiceForDevice` -> `MonitoringContextFacade.fetchApplicableAlertPolicy`) and active technician grants (`ExternalServiceRequestServiceForDevice` -> `ServiceRequestContextFacade.fetchActiveEdgeGrants`, returned as SHA-256 digests, never the plaintext token). The response carries an `ETag`; sending `If-None-Match` with the same value answers `304` with an empty body. Missing unit: `404 EQUIPMENT_NOT_FOUND`. Edge routes answer a failed authentication with `401` and an empty body.

## Not exposed to frontends

`DeviceContextFacade.recordActivity` is called by Monitoring (`ExternalDeviceServiceForMonitoring`) for every stored reading batch, so `DeviceResource.last_seen_at` is the arrival time of the device's latest reading batch (`null` until the first one; edge events and configuration polls do not move it). Only a `PAIRED` device is updated. `Device*IntegrationEvent` has no subscribers.

## Dependencies

Outbound: iam, profiles, assets, monitoring, service.request (all through ExternalService + Facade). Inbound: `DeviceContextFacade` (`recordActivity` and `countLinkedDevices`, both called by monitoring). Security: owns the edge chain used by monitoring's `POST /telemetry`, `POST /telemetry/events`.
