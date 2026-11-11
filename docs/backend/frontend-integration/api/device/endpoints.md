# Device Management - REST endpoints

Every endpoint below was discovered from the controllers named in its entry. "Declared statuses" are the `@ApiResponse` codes the controller documents. Statuses produced by shared handlers apply to every endpoint (see [../../errors/error-contract.md](../../errors/error-contract.md)): `400` for unreadable bodies, failed validation and bad parameter types; `401` for a missing or invalid bearer token; `403` for method-security denials; `500` for unexpected errors.

Base URL: see [../../README.md](../../README.md#5-base-url). All paths are relative to it. JSON bodies use `snake_case`.

| # | Method | Path | Auth | Summary |
|---|---|---|---|---|
| 1 | `POST` | `/api/v1/devices` | OWNER_ROLE | Pair a device with an owned equipment unit |
| 2 | `GET` | `/api/v1/devices/{deviceId}` | OWNER_ROLE | Get a device by ID |
| 3 | `GET` | `/api/v1/devices` | OWNER_ROLE | List my devices |
| 4 | `POST` | `/api/v1/devices/{deviceId}/unpair` | OWNER_ROLE | Unpair a device |
| 5 | `POST` | `/api/v1/devices/{deviceId}/rotate-api-key` | OWNER_ROLE | Rotate the API key of a device |
| 6 | `PUT` | `/api/v1/devices/{deviceId}/status` | OWNER_ROLE | Change the lifecycle status of a device |
| 7 | `GET` | `/api/v1/devices/me/config` | Device API key (`X-API-Key`), authority `DEVICE_ROLE`; no user JWT | Poll the edge configuration |

**Connectivity.** Every `DeviceResource` carries `connectivity` (see `DeviceConnectivityResource` in [contracts.md](contracts.md)). `GET /api/v1/devices` accepts `connectivity`, comma-separated `DeviceConnectivityStateResource` values (`REPORTING`, `SILENT`, `NEVER_REPORTED`, `KEY_REVOKED`, `UNPAIRED`); an unknown value answers `400 VALIDATION_ERROR` naming the parameter. The states are evaluated before paging, so a paged answer counts only the matching devices.

**Retries.** `POST /api/v1/devices` accepts an optional `Idempotency-Key` header (a UUID). A replay answers the stored `201` with `Idempotent-Replayed: true` but **without `api_key`**, which is never stored: rotate the key to obtain a new one.

## `POST /api/v1/devices`

**Pair a device with an owned equipment unit** - Pairs an ESP32 board with one of the authenticated owner's units and issues its API key (it_dev_...), returned only in this response and stored as a SHA-256 digest. A board that was unpaired earlier is paired again under the same UID with a new key.

| Field | Value |
|---|---|
| Bounded context | Device Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/DeviceController.java` - method `registerDevice` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `RegisterDeviceResource` - [`requests/RegisterDeviceResource.json`](requests/RegisterDeviceResource.json), schema [`RegisterDeviceResource.schema.json`](../../schemas/device/RegisterDeviceResource.schema.json) |
| Declared statuses / responses | `201` - `DeviceCredentialResource` ([`responses/DeviceCredentialResource.json`](responses/DeviceCredentialResource.json)) - Device paired; api_key is shown only once<br>`400` - `ErrorResource` - VALIDATION_ERROR<br>`401` - error body - Missing or invalid JWT<br>`403` - error body - Caller is not an owner<br>`404` - `ErrorResource` - Equipment not found or not owned by the caller<br>`409` - `ErrorResource` - Device already paired, or the equipment already has a paired device |
| Application flow | controller -> `deviceCommandService` |

## `GET /api/v1/devices/{deviceId}`

**Get a device by ID** - Returns a device linked (paired or revoked) to one of the caller's units.

| Field | Value |
|---|---|
| Bounded context | Device Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/DeviceController.java` - method `getDevice` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `deviceId` (Long; Java `deviceId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `DeviceResource` ([`responses/DeviceResource.json`](responses/DeviceResource.json)) - Device found<br>`401` - error body - Missing or invalid JWT<br>`403` - error body - Caller is not an owner<br>`404` - `ErrorResource` - No such device is reachable by the caller |
| Application flow | controller -> `deviceQueryService` |

## `GET /api/v1/devices`

**List my devices** - Lists the devices linked (paired or revoked) to the units of the authenticated owner, ordered by `device_uid`. Without a filter it answers the whole inventory in one read. It can be narrowed to one unit, to the units of one site, to a set of statuses and by a search on the device uid or board model; every filter combines with the others. An unpaired device belongs to no owner, so `status=UNPAIRED` matches nothing. Each device carries the name and the site of its unit. Supplying both `page` and `size` returns a page wrapper with the total count instead of a plain array; a `size` above 100 is capped to 100.

| Field | Value |
|---|---|
| Bounded context | Device Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/DeviceController.java` - method `getDevices` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | `equipment_id` (Long; optional)<br>`site_id` (Long; optional)<br>`status` (comma-separated `DeviceStatusResource`; optional)<br>`search` (String, at most 64 characters; optional)<br>`page` (Integer, 0 or more; optional)<br>`size` (Integer, 1 or more, capped at 100; optional) |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `DeviceResource` ([`responses/DeviceResource.json`](responses/DeviceResource.json)), or `PagedDeviceResource` (`content`, `page`, `size`, `total_elements`, `total_pages`) when both `page` and `size` are sent - Devices found<br>`400` - `ErrorResource` - VALIDATION_ERROR - unknown status, search above 64 characters, negative page or size below 1<br>`401` - error body - Missing or invalid JWT<br>`403` - error body - Caller is not an owner<br>`404` - `ErrorResource` - SITE_NOT_FOUND or EQUIPMENT_NOT_FOUND - the site or unit of a filter is not reachable by the caller |
| Application flow | controller -> `deviceQueryService` |

Behavior change: `equipment_id` used to be required, and a unit of another owner used to answer an empty list. It is now optional, and a unit or site that is not the caller's answers `404`.

## `POST /api/v1/devices/{deviceId}/unpair`

**Unpair a device** - Unlinks a paired or revoked device from its unit and invalidates its API key. Subsequent edge requests with that key receive 401; the unit and the board can both be paired again.

| Field | Value |
|---|---|
| Bounded context | Device Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/DeviceController.java` - method `unpairDevice` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `deviceId` (Long; Java `deviceId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `DeviceResource` ([`responses/DeviceResource.json`](responses/DeviceResource.json)) - Device unpaired<br>`401` - error body - Missing or invalid JWT<br>`403` - error body - Caller is not an owner<br>`404` - `ErrorResource` - No such device is reachable by the caller |
| Application flow | controller -> `deviceCommandService` |

## `POST /api/v1/devices/{deviceId}/rotate-api-key`

**Rotate the API key of a device** - Issues a new API key, shown only in this response, and invalidates the previous one. Also the way a revoked device resumes: it becomes PAIRED again.

| Field | Value |
|---|---|
| Bounded context | Device Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/DeviceController.java` - method `rotateApiKey` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `deviceId` (Long; Java `deviceId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `DeviceCredentialResource` ([`responses/DeviceCredentialResource.json`](responses/DeviceCredentialResource.json)) - New API key issued<br>`401` - error body - Missing or invalid JWT<br>`403` - error body - Caller is not an owner<br>`404` - `ErrorResource` - No such device is reachable by the caller |
| Application flow | controller -> `deviceCommandService` |

## `PUT /api/v1/devices/{deviceId}/status`

**Change the lifecycle status of a device** - REVOKED invalidates the API key immediately while the device stays linked to its unit; UNPAIRED also unlinks it. Moving a revoked device back to PAIRED is refused with 409: rotate its API key instead.

| Field | Value |
|---|---|
| Bounded context | Device Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/DeviceController.java` - method `changeStatus` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `deviceId` (Long; Java `deviceId`) |
| Query parameters | none |
| Request body | `ChangeDeviceStatusResource` - [`requests/ChangeDeviceStatusResource.json`](requests/ChangeDeviceStatusResource.json), schema [`ChangeDeviceStatusResource.schema.json`](../../schemas/device/ChangeDeviceStatusResource.schema.json) |
| Declared statuses / responses | `200` - `DeviceResource` ([`responses/DeviceResource.json`](responses/DeviceResource.json)) - Status changed<br>`400` - `ErrorResource` - VALIDATION_ERROR<br>`401` - error body - Missing or invalid JWT<br>`403` - error body - Caller is not an owner<br>`404` - `ErrorResource` - No such device is reachable by the caller<br>`409` - `ErrorResource` - Transition not allowed |
| Application flow | controller -> `deviceCommandService` |

## `GET /api/v1/devices/me/config`

**Poll the edge configuration** - Returns what the gateway enforces locally for its unit: thresholds, alert policy and active technician grants (SHA-256 digests only). The ETag header carries config_version; sending it back in If-None-Match answers 304 with an empty body while nothing changed. The version moves whenever the threshold, the alert policy or a grant of the unit changes. Authenticated by the X-API-Key header only.

| Field | Value |
|---|---|
| Bounded context | Device Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/EdgeConfigurationController.java` - method `getConfiguration` |
| Authentication / authorization | Device API key (`X-API-Key`), authority `DEVICE_ROLE`; no user JWT |
| Headers | `Accept: application/json`, `X-API-Key: <device api key>`, `If-None-Match` (optional) |
| Path parameters | none |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `EdgeConfigurationResource` ([`responses/EdgeConfigurationResource.json`](responses/EdgeConfigurationResource.json)) - Configuration changed since the version in If-None-Match<br>`304` - no JSON body (Configuration unchanged; empty body)<br>`401` - error body - Missing, unknown, revoked or malformed API key<br>`404` - `ErrorResource` - EQUIPMENT_NOT_FOUND - the paired unit no longer exists |
| Application flow | controller -> `edgeConfigurationQueryService` |
