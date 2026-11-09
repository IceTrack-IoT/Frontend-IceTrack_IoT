# Assets - request and response contracts

Generated from the REST resource records under `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources`. Property names are the **serialized** names: Jackson runs with `SNAKE_CASE` (`JacksonConfiguration`, `spring.jackson.property-naming-strategy`), so the Java component `fullName` is the JSON property `full_name`.

Legend: **Required** = enforced by Bean Validation (`@NotNull` / `@NotBlank`). Optional properties may be omitted or `null`. A resource marked `@JsonInclude(NON_NULL)` **omits** null properties; every other resource writes them as `null`.

## `AddressNotVerifiedResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/AddressNotVerifiedResource.java`
- Example: [`responses/AddressNotVerifiedResource.json`](responses/AddressNotVerifiedResource.json) | JSON Schema: [`schemas/assets/AddressNotVerifiedResource.schema.json`](../../schemas/assets/AddressNotVerifiedResource.schema.json)
- Used by: `POST /api/v1/assets/sites/validate-address`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `code` | string | no |  |  |
| `message` | string | no |  |  |
| `candidates` | array<string> | no |  | Candidate addresses to choose from, at most five |

## `AddressValidationResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/AddressValidationResource.java`
- Example: [`responses/AddressValidationResource.json`](responses/AddressValidationResource.json) | JSON Schema: [`schemas/assets/AddressValidationResource.schema.json`](../../schemas/assets/AddressValidationResource.schema.json)
- Used by: `POST /api/v1/assets/sites/validate-address`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `formatted_address` | string | no |  | Normalized address |
| `latitude` | number | no |  | Latitude of the verified point |
| `longitude` | number | no |  | Longitude of the verified point |
| `place_id` | string | no |  | Provider place identifier; nullable |
| `district` | string | no |  | District; nullable |
| `area` | string | no |  | documented values: `LIMA_METROPOLITANA`, `CALLAO`; Coverage area |
| `validation_token` | string | no |  | Token to present when saving the site; valid for 15 minutes |

## `ChangeStatusResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/ChangeStatusResource.java`
- Example: [`requests/ChangeStatusResource.json`](requests/ChangeStatusResource.json) | JSON Schema: [`schemas/assets/ChangeStatusResource.schema.json`](../../schemas/assets/ChangeStatusResource.schema.json)
- Used by: `PUT /api/v1/assets/equipments/{equipmentId}/status`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `new_status` | string enum | yes |  | values: `ACTIVE`, `MAINTENANCE`, `REPAIR`, `DEACTIVATED`; Status to move to. Allowed transitions: ACTIVE to MAINTENANCE/REPAIR/DEACTIVATED, MAINTENANCE to ACTIVE/REPAIR/DEACTIVATED, REPAIR to ACTIVE/DEACTIVATED, DEACTIVATED to ACTIVE |

## `ChangeThresholdResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/ChangeThresholdResource.java`
- Example: [`requests/ChangeThresholdResource.json`](requests/ChangeThresholdResource.json) | JSON Schema: [`schemas/assets/ChangeThresholdResource.schema.json`](../../schemas/assets/ChangeThresholdResource.schema.json)
- Used by: `PUT /api/v1/assets/equipments/{equipmentId}/threshold`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `min_celsius` | number | yes | min 0.0; max 30.0 | Lowest acceptable temperature in Celsius, within 0 to 30 and strictly below max_celsius |
| `max_celsius` | number | yes | min 0.0; max 30.0 | Highest acceptable temperature in Celsius, within 0 to 30 and strictly above min_celsius |

## `EquipmentResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/EquipmentResource.java`
- Example: [`responses/EquipmentResource.json`](responses/EquipmentResource.json) | JSON Schema: [`schemas/assets/EquipmentResource.schema.json`](../../schemas/assets/EquipmentResource.schema.json)
- Used by: `POST /api/v1/assets/equipments`, `GET /api/v1/assets/equipments`, `GET /api/v1/assets/equipments/{equipmentId}`, `PUT /api/v1/assets/equipments/{equipmentId}`, `PUT /api/v1/assets/equipments/{equipmentId}/threshold`, `PUT /api/v1/assets/equipments/{equipmentId}/status`, `GET /api/v1/assets/sites/{siteId}/equipments`
- Embedded in: `PagedEquipmentResource`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Equipment unique identifier |
| `site_id` | integer | no |  | Identifier of the site the unit is installed at |
| `uid` | string | no |  | The unit's own identifier, unique across the platform |
| `name` | string | no |  | Name assigned to the unit |
| `equipment_type` | string enum | no |  | values: `DISPLAY_CASE`, `COLD_ROOM`, `REFRIGERATOR`, `OTHER`; Kind of refrigeration unit |
| `status` | string enum | no |  | values: `ACTIVE`, `MAINTENANCE`, `REPAIR`, `DEACTIVATED`; Current lifecycle status |
| `online` | boolean | no |  | Whether the unit is reporting: true once a reading batch is stored; false before the first one, after offline detection and while DEACTIVATED |
| `min_celsius` | number | no |  | Lowest acceptable temperature in Celsius |
| `max_celsius` | number | no |  | Highest acceptable temperature in Celsius |
| `reminder_interval_days` | integer | no |  | Preventive maintenance interval in days |
| `last_reading_at` | string | no |  | When the unit's latest reading batch was taken (its recorded_at); a batch delivered late never moves it back; null when the unit has not reported yet; nullable |
| `last_known_temperature` | number | no |  | Average temperature of the unit's latest reading batch, in Celsius; null when the unit has not reported yet; nullable |
| `config_version` | integer | no |  | Version of the configuration the unit's edge gateway enforces; incremented whenever the threshold, the alert policy or the technician grants of the unit change |

## `GeoLocationResource` (nested object)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/GeoLocationResource.java`
- Example: [`nested/GeoLocationResource.json`](nested/GeoLocationResource.json) | JSON Schema: [`schemas/assets/GeoLocationResource.schema.json`](../../schemas/assets/GeoLocationResource.schema.json)
- Embedded in: `SiteResource`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `latitude` | number | no |  | Latitude in degrees |
| `longitude` | number | no |  | Longitude in degrees |
| `place_id` | string | no |  | Google Maps place identifier; null when the provider supplied none; nullable |

## `PagedEquipmentResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/PagedEquipmentResource.java`
- Example: [`responses/PagedEquipmentResource.json`](responses/PagedEquipmentResource.json) | JSON Schema: [`schemas/assets/PagedEquipmentResource.schema.json`](../../schemas/assets/PagedEquipmentResource.schema.json)

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `content` | array<object (`EquipmentResource`)> | no |  | Equipment units of this page |
| `page` | integer | no |  | Zero-based index of this page |
| `size` | integer | no |  | Maximum number of units a page may hold |
| `total_elements` | integer | no |  | Total number of units matching the filters |
| `total_pages` | integer | no |  | Number of pages the matching units span |

## `PinResource` (nested object)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/PinResource.java`
- Example: [`nested/PinResource.json`](nested/PinResource.json) | JSON Schema: [`schemas/assets/PinResource.schema.json`](../../schemas/assets/PinResource.schema.json)
- Embedded in: `RegisterSiteResource`, `UpdateSiteAddressResource`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `latitude` | number | yes | min -90.0; max 90.0 | Latitude of the pin |
| `longitude` | number | yes | min -180.0; max 180.0 | Longitude of the pin |

## `RegisterEquipmentResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/RegisterEquipmentResource.java`
- Example: [`requests/RegisterEquipmentResource.json`](requests/RegisterEquipmentResource.json) | JSON Schema: [`schemas/assets/RegisterEquipmentResource.schema.json`](../../schemas/assets/RegisterEquipmentResource.schema.json)
- Used by: `POST /api/v1/assets/equipments`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `site_id` | integer | yes |  | Identifier of the site the unit is installed at |
| `uid` | string | yes | not blank; max length 30 | The unit's own identifier, unique across the platform |
| `name` | string | yes | not blank; max length 30 | Name assigned to the unit |
| `equipment_type` | string enum | yes |  | values: `DISPLAY_CASE`, `COLD_ROOM`, `REFRIGERATOR`, `OTHER`; Kind of refrigeration unit |
| `min_celsius` | number | yes | min 0.0; max 30.0 | Lowest acceptable temperature in Celsius, within 0 to 30 and strictly below max_celsius |
| `max_celsius` | number | yes | min 0.0; max 30.0 | Highest acceptable temperature in Celsius, within 0 to 30 and strictly above min_celsius |
| `reminder_interval_days` | integer | yes | > 0 | Preventive maintenance interval in days |

## `RegisterSiteResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/RegisterSiteResource.java`
- Example: [`requests/RegisterSiteResource.json`](requests/RegisterSiteResource.json) | JSON Schema: [`schemas/assets/RegisterSiteResource.schema.json`](../../schemas/assets/RegisterSiteResource.schema.json)
- Used by: `POST /api/v1/assets/sites`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `name` | string | yes | not blank; max length 30 | Site name |
| `contact_name` | string | yes | not blank; max length 30 | Name of the person reachable on site |
| `phone` | string | yes | not blank | Contact phone number, digits only with an optional leading '+' and spaces as separators |
| `validation_token` | string | no (documented as required but not enforced) |  | Token issued by the address validation endpoint, valid for 15 minutes; a missing, forged, expired or foreign token is answered with ADDRESS_VALIDATION_REQUIRED |
| `pin` | object (`PinResource`) | no | validated recursively | Owner-adjusted location, within 150 meters of the verified point; omit it to use the verified point; nullable |

## `SiteResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/SiteResource.java`
- Example: [`responses/SiteResource.json`](responses/SiteResource.json) | JSON Schema: [`schemas/assets/SiteResource.schema.json`](../../schemas/assets/SiteResource.schema.json)
- Used by: `POST /api/v1/assets/sites`, `GET /api/v1/assets/sites`, `GET /api/v1/assets/sites/{siteId}`, `PUT /api/v1/assets/sites/{siteId}`, `PUT /api/v1/assets/sites/{siteId}/address`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Site unique identifier |
| `owner_id` | integer | no |  | Identifier of the owner profile the site belongs to |
| `name` | string | no |  | Site name |
| `address` | string | no |  | Physical address of the site |
| `contact_name` | string | no |  | Name of the person reachable on site |
| `phone` | string | no |  | Contact phone number |
| `equipment_count` | integer | no |  | Number of equipment units installed at the site |
| `geocoding_status` | string enum | no |  | values: `PENDING`, `RESOLVED`, `FAILED`, `NOT_FOUND`; Where the site stands in locating its address |
| `location` | object (`GeoLocationResource`) | no (documented as required but not enforced) |  | Resolved coordinates; omitted unless geocoding_status is RESOLVED |
| `navigation_url` | string | no (documented as required but not enforced) |  | Google Maps directions link; omitted unless the site is located |

## `UpdateEquipmentResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/UpdateEquipmentResource.java`
- Example: [`requests/UpdateEquipmentResource.json`](requests/UpdateEquipmentResource.json) | JSON Schema: [`schemas/assets/UpdateEquipmentResource.schema.json`](../../schemas/assets/UpdateEquipmentResource.schema.json)
- Used by: `PUT /api/v1/assets/equipments/{equipmentId}`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `name` | string | yes | not blank; max length 30 | Name assigned to the unit |
| `equipment_type` | string enum | yes |  | values: `DISPLAY_CASE`, `COLD_ROOM`, `REFRIGERATOR`, `OTHER`; Kind of refrigeration unit |
| `reminder_interval_days` | integer | yes | > 0 | Preventive maintenance interval in days |

## `UpdateSiteAddressResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/UpdateSiteAddressResource.java`
- Example: [`requests/UpdateSiteAddressResource.json`](requests/UpdateSiteAddressResource.json) | JSON Schema: [`schemas/assets/UpdateSiteAddressResource.schema.json`](../../schemas/assets/UpdateSiteAddressResource.schema.json)
- Used by: `PUT /api/v1/assets/sites/{siteId}/address`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `validation_token` | string | no |  | Token issued by the address validation endpoint, valid for 15 minutes |
| `pin` | object (`PinResource`) | no | validated recursively | Owner-adjusted location, within 150 meters of the verified point; nullable |

## `UpdateSiteResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/UpdateSiteResource.java`
- Example: [`requests/UpdateSiteResource.json`](requests/UpdateSiteResource.json) | JSON Schema: [`schemas/assets/UpdateSiteResource.schema.json`](../../schemas/assets/UpdateSiteResource.schema.json)
- Used by: `PUT /api/v1/assets/sites/{siteId}`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `name` | string | yes | not blank; max length 30 | Site name |
| `contact_name` | string | yes | not blank; max length 30 | Name of the person reachable on site |
| `phone` | string | yes | not blank | Contact phone number, digits only with an optional leading '+' and spaces as separators |

## `ValidateAddressResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/ValidateAddressResource.java`
- Example: [`requests/ValidateAddressResource.json`](requests/ValidateAddressResource.json) | JSON Schema: [`schemas/assets/ValidateAddressResource.schema.json`](../../schemas/assets/ValidateAddressResource.schema.json)
- Used by: `POST /api/v1/assets/sites/validate-address`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `address` | string | yes | not blank; max length 255 | Free-form address to verify |
| `place_id` | string | no | max length 256 | Place identifier of the suggestion the owner picked, when there is one; nullable |

## Enumerations

- `EquipmentTypeResource`: `DISPLAY_CASE`, `COLD_ROOM`, `REFRIGERATOR`, `OTHER`  
  source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/EquipmentTypeResource.java`
- `GeocodingStatusResource`: `PENDING`, `RESOLVED`, `FAILED`, `NOT_FOUND`  
  source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/GeocodingStatusResource.java`
- `StatusEquipmentResource`: `ACTIVE`, `MAINTENANCE`, `REPAIR`, `DEACTIVATED`  
  source: `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/StatusEquipmentResource.java`
