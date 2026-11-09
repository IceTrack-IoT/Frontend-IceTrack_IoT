# Profiles - request and response contracts

Generated from the REST resource records under `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/resources`. Property names are the **serialized** names: Jackson runs with `SNAKE_CASE` (`JacksonConfiguration`, `spring.jackson.property-naming-strategy`), so the Java component `fullName` is the JSON property `full_name`.

Legend: **Required** = enforced by Bean Validation (`@NotNull` / `@NotBlank`). Optional properties may be omitted or `null`. A resource marked `@JsonInclude(NON_NULL)` **omits** null properties; every other resource writes them as `null`.

## `CardLayoutItemResource` (nested object)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/resources/CardLayoutItemResource.java`
- Example: [`nested/CardLayoutItemResource.json`](nested/CardLayoutItemResource.json) | JSON Schema: [`schemas/profiles/CardLayoutItemResource.schema.json`](../../schemas/profiles/CardLayoutItemResource.schema.json)
- Embedded in: `UpdateDashboardLayoutResource`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `card_id` | integer | yes | > 0 | Card unique identifier |
| `order` | integer | yes | > 0 | Requested 1-based position of the card; the positions of a layout must be exactly 1 to N |
| `is_visible` | boolean | yes |  | Whether the card is shown |

## `CreateDashboardConfigResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/resources/CreateDashboardConfigResource.java`
- Example: [`requests/CreateDashboardConfigResource.json`](requests/CreateDashboardConfigResource.json) | JSON Schema: [`schemas/profiles/CreateDashboardConfigResource.schema.json`](../../schemas/profiles/CreateDashboardConfigResource.schema.json)
- Used by: `POST /api/v1/profiles/dashboard-configs`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `user_id` | integer | yes |  | Identifier of the platform account the configuration belongs to |
| `default_site_id` | integer | yes | > 0 | Identifier of the site the dashboard opens on |
| `default_temperature_range` | object (`TemperatureRangeResource`) | yes | validated recursively | Temperature range the dashboard opens on |

## `DashboardCardResource` (nested object)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/resources/DashboardCardResource.java`
- Example: [`nested/DashboardCardResource.json`](nested/DashboardCardResource.json) | JSON Schema: [`schemas/profiles/DashboardCardResource.schema.json`](../../schemas/profiles/DashboardCardResource.schema.json)
- Embedded in: `DashboardConfigResource`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `card_id` | integer | no |  | Card unique identifier |
| `card_type` | string | no |  | documented values: `MONITORED_EQUIPMENT`, `OPEN_ALERTS`, `ACTIVE_ORDERS`, `EQUIPMENT_STATUS`; Kind of widget |
| `order` | integer | no |  | Position of the card on the dashboard: the cards of a dashboard always hold the positions 1 to N, with no gap and no repeat |
| `is_visible` | boolean | no |  | Whether the card is shown; a hidden card keeps its data |

## `DashboardConfigResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/resources/DashboardConfigResource.java`
- Example: [`responses/DashboardConfigResource.json`](responses/DashboardConfigResource.json) | JSON Schema: [`schemas/profiles/DashboardConfigResource.schema.json`](../../schemas/profiles/DashboardConfigResource.schema.json)
- Used by: `GET /api/v1/profiles/dashboard-configs/user/{userId}`, `POST /api/v1/profiles/dashboard-configs`, `PUT /api/v1/profiles/dashboard-configs/user/{userId}/layout`, `PATCH /api/v1/profiles/dashboard-configs/user/{userId}/cards/{cardId}/visibility`, `POST /api/v1/profiles/dashboard-configs/user/{userId}/reset-defaults`, `PUT /api/v1/profiles/dashboard-configs/user/{userId}/defaults`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Dashboard configuration unique identifier |
| `user_id` | integer | no |  | Identifier of the platform account the configuration belongs to |
| `default_site_id` | integer | no |  | Identifier of the site the dashboard opens on |
| `default_temperature_range` | object (`TemperatureRangeResource`) | no |  | Temperature range the dashboard opens on |
| `cards` | array<object (`DashboardCardResource`)> | no |  | Cards of the dashboard, one per card type, sorted by their order |

## `OwnerProfileResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/resources/OwnerProfileResource.java`
- Example: [`responses/OwnerProfileResource.json`](responses/OwnerProfileResource.json) | JSON Schema: [`schemas/profiles/OwnerProfileResource.schema.json`](../../schemas/profiles/OwnerProfileResource.schema.json)
- Used by: `GET /api/v1/profiles/owners`, `GET /api/v1/profiles/owners/{ownerId}`, `GET /api/v1/profiles/owners/user/{userId}`, `PUT /api/v1/profiles/owners/{ownerId}`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Owner profile unique identifier |
| `user_id` | integer | no |  | Identifier of the platform account the owner belongs to |
| `full_name` | string | no |  | Owner full name |
| `email` | string | no |  | Owner email address |
| `phone` | string | no |  | Owner phone number |
| `address` | string | no |  | Owner complete street address |
| `ruc` | integer | no |  | 11 digit taxpayer registration number (RUC) |

## `TechnicianProfileResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/resources/TechnicianProfileResource.java`
- Example: [`responses/TechnicianProfileResource.json`](responses/TechnicianProfileResource.json) | JSON Schema: [`schemas/profiles/TechnicianProfileResource.schema.json`](../../schemas/profiles/TechnicianProfileResource.schema.json)
- Used by: `GET /api/v1/profiles/technicians`, `GET /api/v1/profiles/technicians/{technicianId}`, `GET /api/v1/profiles/technicians/user/{userId}`, `PUT /api/v1/profiles/technicians/{technicianId}`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Technician profile unique identifier |
| `user_id` | integer | no |  | Identifier of the platform account the technician belongs to |
| `full_name` | string | no |  | Technician full name |
| `email` | string | no |  | Technician email address |
| `phone` | string | no |  | Technician phone number |
| `address` | string | no |  | Technician complete street address |
| `speciality` | string | no |  | Technician speciality |
| `certification_number` | string | no |  | Technician certification number |

## `TechnicianPublicProfileResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/resources/TechnicianPublicProfileResource.java`
- Example: [`responses/TechnicianPublicProfileResource.json`](responses/TechnicianPublicProfileResource.json) | JSON Schema: [`schemas/profiles/TechnicianPublicProfileResource.schema.json`](../../schemas/profiles/TechnicianPublicProfileResource.schema.json)
- Used by: `GET /api/v1/profiles/technicians/{technicianId}/public`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Technician profile unique identifier |
| `full_name` | string | no |  | Technician full name |
| `speciality` | string | no |  | Technician speciality |
| `certification_number` | string | no |  | Technician certification number |
| `completed_services` | integer | no |  | Service requests the technician completed |
| `average_rating` | number | no |  | Average of the technician's review scores, between 1 and 5; null until the first review; nullable |
| `rating_available` | boolean | no |  | Whether average_rating is available, i.e. the technician has been reviewed |

## `TemperatureRangeResource` (nested object)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/resources/TemperatureRangeResource.java`
- Example: [`nested/TemperatureRangeResource.json`](nested/TemperatureRangeResource.json) | JSON Schema: [`schemas/profiles/TemperatureRangeResource.schema.json`](../../schemas/profiles/TemperatureRangeResource.schema.json)
- Embedded in: `CreateDashboardConfigResource`, `DashboardConfigResource`, `UpdateDashboardDefaultsResource`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `min` | integer | yes |  | Lower bound of the range, never above max |
| `max` | integer | yes |  | Upper bound of the range, never below min |
| `unit` | string | yes | not blank | documented values: `C`, `F`; Unit of both bounds |
| `label` | string | yes | not blank | Human-readable range label |

## `UpdateDashboardDefaultsResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/resources/UpdateDashboardDefaultsResource.java`
- Example: [`requests/UpdateDashboardDefaultsResource.json`](requests/UpdateDashboardDefaultsResource.json) | JSON Schema: [`schemas/profiles/UpdateDashboardDefaultsResource.schema.json`](../../schemas/profiles/UpdateDashboardDefaultsResource.schema.json)
- Used by: `PUT /api/v1/profiles/dashboard-configs/user/{userId}/defaults`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `default_site_id` | integer | yes | > 0 | Identifier of the site the dashboard opens on |
| `default_temperature_range` | object (`TemperatureRangeResource`) | yes | validated recursively | Temperature range the dashboard opens on |

## `UpdateDashboardLayoutResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/resources/UpdateDashboardLayoutResource.java`
- Example: [`requests/UpdateDashboardLayoutResource.json`](requests/UpdateDashboardLayoutResource.json) | JSON Schema: [`schemas/profiles/UpdateDashboardLayoutResource.schema.json`](../../schemas/profiles/UpdateDashboardLayoutResource.schema.json)
- Used by: `PUT /api/v1/profiles/dashboard-configs/user/{userId}/layout`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `cards` | array<object (`CardLayoutItemResource`)> | yes |  | Placement of every card of the dashboard |

## `UpdateOwnerResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/resources/UpdateOwnerResource.java`
- Example: [`requests/UpdateOwnerResource.json`](requests/UpdateOwnerResource.json) | JSON Schema: [`schemas/profiles/UpdateOwnerResource.schema.json`](../../schemas/profiles/UpdateOwnerResource.schema.json)
- Used by: `PUT /api/v1/profiles/owners/{ownerId}`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `full_name` | string | yes | not blank | Owner full name |
| `phone` | string | yes | not blank | Phone number, optionally prefixed by the country code and a space |
| `street` | string | yes | not blank | Street of the address |
| `number` | string | no (documented as required but not enforced) |  | Street number or apartment |
| `city` | string | yes | not blank | City of the address |
| `postal_code` | string | yes | not blank | Postal code of the address |
| `country` | string | yes | not blank | Country of the address |
| `ruc` | integer | yes |  | 11 digit taxpayer registration number (RUC) |

## `UpdateTechnicianResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/resources/UpdateTechnicianResource.java`
- Example: [`requests/UpdateTechnicianResource.json`](requests/UpdateTechnicianResource.json) | JSON Schema: [`schemas/profiles/UpdateTechnicianResource.schema.json`](../../schemas/profiles/UpdateTechnicianResource.schema.json)
- Used by: `PUT /api/v1/profiles/technicians/{technicianId}`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `full_name` | string | yes | not blank | Technician full name |
| `phone` | string | yes | not blank | Phone number, optionally prefixed by the country code and a space |
| `street` | string | yes | not blank | Street of the address |
| `number` | string | no (documented as required but not enforced) |  | Street number or apartment |
| `city` | string | yes | not blank | City of the address |
| `postal_code` | string | yes | not blank | Postal code of the address |
| `country` | string | yes | not blank | Country of the address |
| `speciality` | string | yes | not blank; max length Speciality.MAX_LENGTH | Technician speciality |
| `certification_number` | string | yes | not blank; has a regex pattern (certification number format) | Technician certification number: 3 to 50 letters, digits, '-', '.' or '/' |
