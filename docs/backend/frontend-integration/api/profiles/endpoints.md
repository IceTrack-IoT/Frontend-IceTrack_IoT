# Profiles - REST endpoints

Every endpoint below was discovered from the controllers named in its entry. "Declared statuses" are the `@ApiResponse` codes the controller documents. Statuses produced by shared handlers apply to every endpoint (see [../../errors/error-contract.md](../../errors/error-contract.md)): `400` for unreadable bodies, failed validation and bad parameter types; `401` for a missing or invalid bearer token; `403` for method-security denials; `500` for unexpected errors.

Base URL: see [../../README.md](../../README.md#5-base-url). All paths are relative to it. JSON bodies use `snake_case`.

| # | Method | Path | Auth | Summary |
|---|---|---|---|---|
| 1 | `GET` | `/api/v1/profiles/dashboard-configs/user/{userId}` | caller must be the account in the path/body (`user_id`) | Get dashboard configuration by user ID |
| 2 | `POST` | `/api/v1/profiles/dashboard-configs` | caller must be the account in the path/body (`user_id`) | Create a dashboard configuration |
| 3 | `PUT` | `/api/v1/profiles/dashboard-configs/user/{userId}/layout` | caller must be the account in the path/body (`user_id`) | Update the dashboard layout |
| 4 | `PATCH` | `/api/v1/profiles/dashboard-configs/user/{userId}/cards/{cardId}/visibility` | caller must be the account in the path/body (`user_id`) | Toggle a dashboard card's visibility |
| 5 | `POST` | `/api/v1/profiles/dashboard-configs/user/{userId}/reset-defaults` | caller must be the account in the path/body (`user_id`) | Reset the dashboard layout |
| 6 | `PUT` | `/api/v1/profiles/dashboard-configs/user/{userId}/defaults` | caller must be the account in the path/body (`user_id`) | Update dashboard defaults |
| 7 | `GET` | `/api/v1/profiles/owners` | OWNER_ROLE | Get all owners |
| 8 | `GET` | `/api/v1/profiles/owners/{ownerId}` | Authenticated (any valid bearer token) | Get owner by ID |
| 9 | `GET` | `/api/v1/profiles/owners/user/{userId}` | Authenticated (any valid bearer token) | Get owner by user ID |
| 10 | `PUT` | `/api/v1/profiles/owners/{ownerId}` | OWNER_ROLE and the owner profile must be the caller's own | Update an owner |
| 11 | `GET` | `/api/v1/profiles/technicians` | OWNER_ROLE | Get all technicians |
| 12 | `GET` | `/api/v1/profiles/technicians/{technicianId}` | Authenticated (any valid bearer token) | Get technician by ID |
| 13 | `GET` | `/api/v1/profiles/technicians/{technicianId}/public` | OWNER_ROLE | Get the public profile of a technician |
| 14 | `GET` | `/api/v1/profiles/technicians/user/{userId}` | Authenticated (any valid bearer token) | Get technician by user ID |
| 15 | `PUT` | `/api/v1/profiles/technicians/{technicianId}` | TECHNICIAN_ROLE and the technician profile must be the caller's own | Update a technician |
| 16 | `GET` | `/api/v1/profiles/technicians/public` | OWNER_ROLE | Get the public technician directory |
| 17 | `GET` | `/api/v1/profiles/owners/me` | OWNER_ROLE | Get my owner profile (`404 OWNER_NOT_FOUND` without one) |
| 18 | `GET` | `/api/v1/profiles/dashboard-configs/me` | Authenticated (any valid bearer token) | Get my dashboard configuration (`404 DASHBOARD_CONFIG_NOT_FOUND` while not set up) |
| 19 | `GET` | `/api/v1/me/context` | Authenticated (any valid bearer token) | Get my session context (`SessionContextResource`, `Cache-Control: no-store`); controller `profiles/interfaces/rest/SessionContextController.java` |

**Concurrent edits.** `PUT /owners/{ownerId}`, `PUT .../layout`, `PATCH .../cards/{cardId}/visibility` and `PUT .../defaults` accept `If-Match: "<version>"` with the `version` of the profile or configuration being edited. A stale version answers `409 CONCURRENT_MODIFICATION_CONFLICT`, `details` naming the current version, and changes nothing; a malformed header answers `400 VALIDATION_ERROR`. Without the header only writes that overlap in time are refused.

## `GET /api/v1/profiles/technicians/public`

**Get the public technician directory** - Lists the public profile of the technicians - name, speciality, certification number, `completed_services` and `average_rating` - one page at a time. Optionally searched by name or speciality, filtered by an exact speciality and by a minimum rating, which leaves out technicians not rated yet, and ordered by name, by rating (best first, unrated last) or by completed services (most first). Email, phone and address are never included. A `size` above 100 is capped to 100.

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/TechnicianProfilesController.java` - method `getPublicTechnicianDirectory` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | `search` (String; optional; matches the full name or the speciality, case-insensitive)<br>`speciality` (String; optional; exact match, case-insensitive)<br>`min_rating` (Double, 0 to 5; optional)<br>`sort` (String; optional; `name`, `rating` or `completed_services`; default `name`)<br>`page` (Integer, 0 or more; default 0)<br>`size` (Integer, 1 or more, capped at 100; default 20) |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `PagedTechnicianPublicProfileResource` (`content` of `TechnicianPublicProfileResource`, `page`, `size`, `total_elements`, `total_pages`) - Technicians found<br>`400` - error body - VALIDATION_ERROR - unknown sort, min_rating outside 0 to 5, negative page or size below 1<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the caller is not an owner |
| Application flow | controller -> `technicianQueryService` |

## `GET /api/v1/profiles/dashboard-configs/user/{userId}`

**Get dashboard configuration by user ID** - Retrieves the dashboard configuration, cards included, of the caller's own account.

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/DashboardConfigsController.java` - method `getDashboardConfigByUserId` |
| Authentication / authorization | caller must be the account in the path/body (`user_id`) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `userId` (Long; Java `userId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `DashboardConfigResource` ([`responses/DashboardConfigResource.json`](responses/DashboardConfigResource.json)) - Dashboard configuration found<br>`403` - error body - Forbidden - the caller is not this account<br>`404` - error body - The account has no dashboard configuration |
| Application flow | controller -> `dashboardConfigQueryService` |

## `POST /api/v1/profiles/dashboard-configs`

**Create a dashboard configuration** - Creates the dashboard configuration of the caller's own account in the default layout: one visible card of each type, in the order MONITORED_EQUIPMENT, OPEN_ALERTS, ACTIVE_ORDERS, EQUIPMENT_STATUS. An account has at most one configuration.

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/DashboardConfigsController.java` - method `createDashboardConfig` |
| Authentication / authorization | caller must be the account in the path/body (`user_id`) |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `CreateDashboardConfigResource` - [`requests/CreateDashboardConfigResource.json`](requests/CreateDashboardConfigResource.json), schema [`CreateDashboardConfigResource.schema.json`](../../schemas/profiles/CreateDashboardConfigResource.schema.json) |
| Declared statuses / responses | `201` - `DashboardConfigResource` ([`responses/DashboardConfigResource.json`](responses/DashboardConfigResource.json)) - Dashboard configuration created<br>`400` - error body - Invalid input data<br>`403` - error body - Forbidden - the caller is not this account<br>`409` - error body - The account already has a dashboard configuration |
| Application flow | controller -> `dashboardConfigCommandService` |

## `PUT /api/v1/profiles/dashboard-configs/user/{userId}/layout`

**Update the dashboard layout** - Replaces the position and visibility of every card on the dashboard of the caller's own account. The layout must place each card of the dashboard exactly once, at the positions 1 to N. Accepts `If-Match: "<version>"` (`409 CONCURRENT_MODIFICATION_CONFLICT` when stale).

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/DashboardConfigsController.java` - method `updateLayout` |
| Authentication / authorization | caller must be the account in the path/body (`user_id`) |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>`, `If-Match: "<version>"` (optional) |
| Path parameters | `userId` (Long; Java `userId`) |
| Query parameters | none |
| Request body | `UpdateDashboardLayoutResource` - [`requests/UpdateDashboardLayoutResource.json`](requests/UpdateDashboardLayoutResource.json), schema [`UpdateDashboardLayoutResource.schema.json`](../../schemas/profiles/UpdateDashboardLayoutResource.schema.json) |
| Declared statuses / responses | `200` - `DashboardConfigResource` ([`responses/DashboardConfigResource.json`](responses/DashboardConfigResource.json)) - Dashboard layout updated<br>`400` - error body - Invalid layout, such as a missing, unknown or repeated card, or a repeated or out of range position<br>`403` - error body - Forbidden - the caller is not this account<br>`404` - error body - The account has no dashboard configuration |<br>`409` - error body - CONCURRENT_MODIFICATION_CONFLICT - If-Match names a version other than the current one (`details` gives the current version); a malformed If-Match is `400`
| Application flow | controller -> `dashboardConfigCommandService` |

## `PATCH /api/v1/profiles/dashboard-configs/user/{userId}/cards/{cardId}/visibility`

**Toggle a dashboard card's visibility** - Shows the card when hidden, hides it when shown. A hidden card keeps its data and its position. Accepts `If-Match: "<version>"` (`409 CONCURRENT_MODIFICATION_CONFLICT` when stale).

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/DashboardConfigsController.java` - method `toggleCardVisibility` |
| Authentication / authorization | caller must be the account in the path/body (`user_id`) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>`, `If-Match: "<version>"` (optional) |
| Path parameters | `userId` (Long; Java `userId`)<br>`cardId` (Long; Java `cardId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `DashboardConfigResource` ([`responses/DashboardConfigResource.json`](responses/DashboardConfigResource.json)) - Card visibility toggled<br>`403` - error body - Forbidden - the caller is not this account<br>`404` - error body - The account has no dashboard configuration, or the dashboard has no such card |<br>`409` - error body - CONCURRENT_MODIFICATION_CONFLICT - If-Match names a version other than the current one (`details` gives the current version); a malformed If-Match is `400`
| Application flow | controller -> `dashboardConfigCommandService` |

## `POST /api/v1/profiles/dashboard-configs/user/{userId}/reset-defaults`

**Reset the dashboard layout** - Restores the default card layout of the dashboard of the caller's own account: every card visible, in the order MONITORED_EQUIPMENT, OPEN_ALERTS, ACTIVE_ORDERS, EQUIPMENT_STATUS. The default site and temperature range are left unchanged.

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/DashboardConfigsController.java` - method `resetToDefaults` |
| Authentication / authorization | caller must be the account in the path/body (`user_id`) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `userId` (Long; Java `userId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `DashboardConfigResource` ([`responses/DashboardConfigResource.json`](responses/DashboardConfigResource.json)) - Dashboard layout reset<br>`403` - error body - Forbidden - the caller is not this account<br>`404` - error body - The account has no dashboard configuration |
| Application flow | controller -> `dashboardConfigCommandService` |

## `PUT /api/v1/profiles/dashboard-configs/user/{userId}/defaults`

**Update dashboard defaults** - Replaces the site and temperature range the dashboard of the caller's own account opens on. Accepts `If-Match: "<version>"` (`409 CONCURRENT_MODIFICATION_CONFLICT` when stale).

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/DashboardConfigsController.java` - method `updateDefaults` |
| Authentication / authorization | caller must be the account in the path/body (`user_id`) |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>`, `If-Match: "<version>"` (optional) |
| Path parameters | `userId` (Long; Java `userId`) |
| Query parameters | none |
| Request body | `UpdateDashboardDefaultsResource` - [`requests/UpdateDashboardDefaultsResource.json`](requests/UpdateDashboardDefaultsResource.json), schema [`UpdateDashboardDefaultsResource.schema.json`](../../schemas/profiles/UpdateDashboardDefaultsResource.schema.json) |
| Declared statuses / responses | `200` - `DashboardConfigResource` ([`responses/DashboardConfigResource.json`](responses/DashboardConfigResource.json)) - Dashboard defaults updated<br>`400` - error body - Invalid input data<br>`403` - error body - Forbidden - the caller is not this account<br>`404` - error body - The account has no dashboard configuration |<br>`409` - error body - CONCURRENT_MODIFICATION_CONFLICT - If-Match names a version other than the current one (`details` gives the current version); a malformed If-Match is `400`
| Application flow | controller -> `dashboardConfigCommandService` |

## `GET /api/v1/profiles/owners`

**Get all owners** - Retrieves every ice track owner profile.

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/OwnerProfilesController.java` - method `getAllOwners` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `OwnerProfileResource` ([`responses/OwnerProfileResource.json`](responses/OwnerProfileResource.json)) - Owners found |
| Application flow | controller -> n/a |

## `GET /api/v1/profiles/owners/{ownerId}`

**Get owner by ID** - Retrieves an ice track owner profile by its unique identifier.

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/OwnerProfilesController.java` - method `getOwnerById` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `ownerId` (Long; Java `ownerId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `OwnerProfileResource` ([`responses/OwnerProfileResource.json`](responses/OwnerProfileResource.json)) - Owner found<br>`404` - error body - Owner not found |
| Application flow | controller -> `ownerQueryService` |

## `GET /api/v1/profiles/owners/user/{userId}`

**Get owner by user ID** - Retrieves the ice track owner profile bound to a platform account.

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/OwnerProfilesController.java` - method `getOwnerByUserId` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `userId` (Long; Java `userId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `OwnerProfileResource` ([`responses/OwnerProfileResource.json`](responses/OwnerProfileResource.json)) - Owner found<br>`404` - error body - No owner is bound to the account |
| Application flow | controller -> `ownerQueryService` |

## `PUT /api/v1/profiles/owners/{ownerId}`

**Update an owner** - Replaces the name, contact details and RUC of the caller's own owner profile. The email address belongs to the platform account and cannot be changed here. Accepts `If-Match: "<version>"` (`409 CONCURRENT_MODIFICATION_CONFLICT` when stale; `400` when malformed).

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/OwnerProfilesController.java` - method `updateOwner` |
| Authentication / authorization | OWNER_ROLE and the owner profile must be the caller's own |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>`, `If-Match: "<version>"` (optional) |
| Path parameters | `ownerId` (Long; Java `ownerId`) |
| Query parameters | none |
| Request body | `UpdateOwnerResource` - [`requests/UpdateOwnerResource.json`](requests/UpdateOwnerResource.json), schema [`UpdateOwnerResource.schema.json`](../../schemas/profiles/UpdateOwnerResource.schema.json) |
| Declared statuses / responses | `200` - `OwnerProfileResource` ([`responses/OwnerProfileResource.json`](responses/OwnerProfileResource.json)) - Owner updated<br>`400` - error body - Invalid input data, such as a RUC that is not 11 digits<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the caller is not this owner |<br>`409` - error body - CONCURRENT_MODIFICATION_CONFLICT - If-Match names a version other than the current one (`details` gives the current version); a malformed If-Match is `400`
| Application flow | controller -> `ownerCommandService` |

## `GET /api/v1/profiles/technicians`

**Get all technicians** - Retrieves the technician directory for owners. Email, phone and address are null except for technicians actively assigned to one of the caller's service requests.

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/TechnicianProfilesController.java` - method `getAllTechnicians` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `TechnicianProfileResource` ([`responses/TechnicianProfileResource.json`](responses/TechnicianProfileResource.json)) - Technicians found |
| Application flow | controller -> `technicianQueryService` |

## `GET /api/v1/profiles/technicians/{technicianId}`

**Get technician by ID** - Retrieves a maintenance technician profile by its unique identifier.

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/TechnicianProfilesController.java` - method `getTechnicianById` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `technicianId` (Long; Java `technicianId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `TechnicianProfileResource` ([`responses/TechnicianProfileResource.json`](responses/TechnicianProfileResource.json)) - Technician found<br>`404` - error body - Technician not found |
| Application flow | controller -> `technicianQueryService` |

## `GET /api/v1/profiles/technicians/{technicianId}/public`

**Get the public profile of a technician** - Retrieves a technician's name, speciality and certification number together with completed_services and average_rating. average_rating is null, and rating_available false, until the technician's first review. Email, phone and address are never included. The statistics are a read model updated shortly after each completion or review, so they may lag a few seconds behind.

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/TechnicianProfilesController.java` - method `getTechnicianPublicProfile` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `technicianId` (Long; Java `technicianId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `TechnicianPublicProfileResource` ([`responses/TechnicianPublicProfileResource.json`](responses/TechnicianPublicProfileResource.json)) - Technician found<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the caller is not an owner<br>`404` - error body - TECHNICIAN_NOT_FOUND - no technician carries that ID |
| Application flow | controller -> `technicianQueryService` |

## `GET /api/v1/profiles/technicians/user/{userId}`

**Get technician by user ID** - Retrieves the maintenance technician profile bound to a platform account.

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/TechnicianProfilesController.java` - method `getTechnicianByUserId` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `userId` (Long; Java `userId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `TechnicianProfileResource` ([`responses/TechnicianProfileResource.json`](responses/TechnicianProfileResource.json)) - Technician found<br>`404` - error body - No technician is bound to the account |
| Application flow | controller -> `technicianQueryService` |

## `PUT /api/v1/profiles/technicians/{technicianId}`

**Update a technician** - Replaces the name, contact details, speciality and certification number of the caller's own technician profile. The email address belongs to the platform account and cannot be changed here.

| Field | Value |
|---|---|
| Bounded context | Profiles |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/profiles/interfaces/rest/TechnicianProfilesController.java` - method `updateTechnician` |
| Authentication / authorization | TECHNICIAN_ROLE and the technician profile must be the caller's own |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `technicianId` (Long; Java `technicianId`) |
| Query parameters | none |
| Request body | `UpdateTechnicianResource` - [`requests/UpdateTechnicianResource.json`](requests/UpdateTechnicianResource.json), schema [`UpdateTechnicianResource.schema.json`](../../schemas/profiles/UpdateTechnicianResource.schema.json) |
| Declared statuses / responses | `200` - `TechnicianProfileResource` ([`responses/TechnicianProfileResource.json`](responses/TechnicianProfileResource.json)) - Technician updated<br>`400` - error body - Invalid input data, such as a malformed certification number<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the caller is not this technician |
| Application flow | controller -> `technicianCommandService` |
