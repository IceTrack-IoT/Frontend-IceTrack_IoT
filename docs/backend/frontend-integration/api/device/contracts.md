# Device Management - request and response contracts

Generated from the REST resource records under `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/resources`. Property names are the **serialized** names: Jackson runs with `SNAKE_CASE` (`JacksonConfiguration`, `spring.jackson.property-naming-strategy`), so the Java component `fullName` is the JSON property `full_name`.

Legend: **Required** = enforced by Bean Validation (`@NotNull` / `@NotBlank`). Optional properties may be omitted or `null`. A resource marked `@JsonInclude(NON_NULL)` **omits** null properties; every other resource writes them as `null`.

## `ChangeDeviceStatusResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/resources/ChangeDeviceStatusResource.java`
- Example: [`requests/ChangeDeviceStatusResource.json`](requests/ChangeDeviceStatusResource.json) | JSON Schema: [`schemas/device/ChangeDeviceStatusResource.schema.json`](../../schemas/device/ChangeDeviceStatusResource.schema.json)
- Used by: `PUT /api/v1/devices/{deviceId}/status`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `new_status` | string enum | yes |  | values: `UNPAIRED`, `PAIRED`, `REVOKED`; documented values: `UNPAIRED`, `PAIRED`, `REVOKED`; Status to move the device to. REVOKED invalidates the API key, UNPAIRED also unlinks the equipment; a revoked device resumes only by rotating its API key |

## `DeviceCredentialResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/resources/DeviceCredentialResource.java`
- Example: [`responses/DeviceCredentialResource.json`](responses/DeviceCredentialResource.json) | JSON Schema: [`schemas/device/DeviceCredentialResource.schema.json`](../../schemas/device/DeviceCredentialResource.schema.json)
- Used by: `POST /api/v1/devices`, `POST /api/v1/devices/{deviceId}/rotate-api-key`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `device` | object (`DeviceResource`) | no |  | Paired device |
| `api_key` | string | no |  | Plaintext API key: it_dev_ followed by 64 hexadecimal characters. Store it securely on the board; it is never returned again |

## `DeviceResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/resources/DeviceResource.java`
- Example: [`responses/DeviceResource.json`](responses/DeviceResource.json) | JSON Schema: [`schemas/device/DeviceResource.schema.json`](../../schemas/device/DeviceResource.schema.json)
- Used by: `GET /api/v1/devices/{deviceId}`, `GET /api/v1/devices`, `POST /api/v1/devices/{deviceId}/unpair`, `PUT /api/v1/devices/{deviceId}/status`
- Embedded in: `DeviceCredentialResource`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Device unique identifier |
| `device_uid` | string | no |  | Unique identifier of the board |
| `board_model` | string | no |  | Board model |
| `firmware_version` | string | no |  | Firmware version currently running on the board |
| `status` | string enum | no |  | values: `UNPAIRED`, `PAIRED`, `REVOKED`; Current lifecycle status of the device |
| `paired_equipment_id` | integer | no |  | Identifier of the equipment the device is paired with; nullable |
| `last_seen_at` | string | no |  | When the platform received the device's latest reading batch; null before the first one; nullable |

## `EdgeConfigurationResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/resources/EdgeConfigurationResource.java`
- Example: [`responses/EdgeConfigurationResource.json`](responses/EdgeConfigurationResource.json) | JSON Schema: [`schemas/device/EdgeConfigurationResource.schema.json`](../../schemas/device/EdgeConfigurationResource.schema.json)
- Used by: `GET /api/v1/devices/me/config`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `config_version` | integer | no |  | Version of this configuration; also returned as the ETag header |
| `min_celsius` | number | no |  | Lowest acceptable temperature in Celsius |
| `max_celsius` | number | no |  | Highest acceptable temperature in Celsius |
| `sustained_excursion_minutes` | integer | no |  | Minutes an excursion must last before the gateway raises it |
| `hysteresis_margin_celsius` | number | no |  | Margin, in Celsius, the temperature must recover by relative to the breached limit before the gateway closes an excursion |
| `missed_sync_windows_for_offline` | integer | no |  | Missed synchronization windows before a device counts as offline |
| `grants` | array<object (`EdgeGrantResource`)> | no |  | Technician grants the gateway must accept; empty when none is active |

## `EdgeGrantResource` (nested object)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/resources/EdgeConfigurationResource.java`
- Example: [`nested/EdgeGrantResource.json`](nested/EdgeGrantResource.json) | JSON Schema: [`schemas/device/EdgeGrantResource.schema.json`](../../schemas/device/EdgeGrantResource.schema.json)
- Embedded in: `EdgeConfigurationResource`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `sha256` | string | no |  | Hex SHA-256 digest of the grant token |
| `technician_id` | integer | no |  | Technician the grant was issued to |
| `service_request_id` | integer | no |  | Service request the grant was issued for |
| `expires_at` | string | no |  | When the grant stops being valid |

## `RegisterDeviceResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/resources/RegisterDeviceResource.java`
- Example: [`requests/RegisterDeviceResource.json`](requests/RegisterDeviceResource.json) | JSON Schema: [`schemas/device/RegisterDeviceResource.schema.json`](../../schemas/device/RegisterDeviceResource.schema.json)
- Used by: `POST /api/v1/devices`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `equipment_id` | integer | yes |  | Identifier of the equipment the device will be paired with |
| `device_uid` | string | yes | not blank; max length 64 | Unique identifier of the board |
| `board_model` | string | yes | not blank; max length 64 | Board model |
| `firmware_version` | string | no | max length 64 | Firmware version currently running on the board; nullable |

## Enumerations

- `DeviceStatusResource`: `UNPAIRED`, `PAIRED`, `REVOKED`  
  source: `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/resources/DeviceStatusResource.java`
