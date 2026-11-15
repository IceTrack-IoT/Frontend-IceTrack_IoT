# Assets - REST endpoints

Every endpoint below was discovered from the controllers named in its entry. "Declared statuses" are the `@ApiResponse` codes the controller documents. Statuses produced by shared handlers apply to every endpoint (see [../../errors/error-contract.md](../../errors/error-contract.md)): `400` for unreadable bodies, failed validation and bad parameter types; `401` for a missing or invalid bearer token; `403` for method-security denials; `500` for unexpected errors.

Base URL: see [../../README.md](../../README.md#5-base-url). All paths are relative to it. JSON bodies use `snake_case`.

| # | Method | Path | Auth | Summary |
|---|---|---|---|---|
| 1 | `POST` | `/api/v1/assets/equipments` | OWNER_ROLE | Register an equipment |
| 2 | `GET` | `/api/v1/assets/equipments` | OWNER_ROLE | List my equipment |
| 3 | `GET` | `/api/v1/assets/equipments/{equipmentId}` | OWNER_ROLE or TECHNICIAN_ROLE | Get an equipment by ID |
| 4 | `PUT` | `/api/v1/assets/equipments/{equipmentId}` | OWNER_ROLE | Update an equipment |
| 5 | `PUT` | `/api/v1/assets/equipments/{equipmentId}/threshold` | OWNER_ROLE | Change the temperature threshold |
| 6 | `PUT` | `/api/v1/assets/equipments/{equipmentId}/status` | OWNER_ROLE | Change the equipment status |
| 7 | `POST` | `/api/v1/assets/sites/validate-address` | OWNER_ROLE | Verify a site address |
| 8 | `POST` | `/api/v1/assets/sites` | OWNER_ROLE | Register a site |
| 9 | `GET` | `/api/v1/assets/sites` | OWNER_ROLE | List my sites |
| 10 | `GET` | `/api/v1/assets/sites/{siteId}` | OWNER_ROLE or TECHNICIAN_ROLE | Get a site by ID |
| 11 | `GET` | `/api/v1/assets/sites/{siteId}/equipments` | OWNER_ROLE or TECHNICIAN_ROLE | List the equipment of a site |
| 12 | `PUT` | `/api/v1/assets/sites/{siteId}` | OWNER_ROLE | Update a site |
| 13 | `PUT` | `/api/v1/assets/sites/{siteId}/address` | OWNER_ROLE | Change the address of a site |
| 14 | `GET` | `/api/v1/assets/equipments/directory` | OWNER_ROLE | Get my equipment directory |
| 15 | `POST` | `/api/v1/assets/sites/{siteId}/geocoding/retry` | OWNER_ROLE | Retry locating a site |

Every `EquipmentResource` returned by these endpoints carries the read-only `site_name` of the unit's site.

**Retries and concurrent edits.** `POST /assets/equipments` and `POST /assets/sites` accept an optional `Idempotency-Key` header (a UUID): a retry with the same key and body is answered from the first result with `Idempotent-Replayed: true`; the same key with another body, or while the first request runs, answers `409 IDEMPOTENCY_KEY_CONFLICT`. The five `PUT` endpoints accept `If-Match: "<version>"` with the `version` of the resource being edited; a stale version answers `409 CONCURRENT_MODIFICATION_CONFLICT`, `details` naming the current version.

## `POST /api/v1/assets/equipments`

**Register an equipment** - Registers a refrigeration unit at a site of the authenticated owner. The unit starts ACTIVE and disconnected, and its uid must be unique across the platform. Accepts an optional `Idempotency-Key` header (UUID): a retry with the same key and body answers the first result with `Idempotent-Replayed: true`; another body under the same key answers `409 IDEMPOTENCY_KEY_CONFLICT`.

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/EquipmentController.java` - method `registerEquipment` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `RegisterEquipmentResource` - [`requests/RegisterEquipmentResource.json`](requests/RegisterEquipmentResource.json), schema [`RegisterEquipmentResource.schema.json`](../../schemas/assets/RegisterEquipmentResource.schema.json) |
| Declared statuses / responses | `201` - `EquipmentResource` ([`responses/EquipmentResource.json`](responses/EquipmentResource.json)) - Equipment registered<br>`400` - error body - Invalid input data, such as a threshold outside 0 to 30 °C or whose minimum is not below its maximum<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account has no owner profile<br>`404` - error body - No such site is reachable by the caller<br>`409` - error body - The uid is already used by another unit |
| Application flow | controller -> `equipmentCommandService` |

## `GET /api/v1/assets/equipments`

**List my equipment** - Lists the equipment of the authenticated owner showing at least name, type, uid and status, optionally searched by name or uid and filtered by status, type and site. Every filter combines with the others and only ever narrows the caller's own units. Supplying both page and size returns a page wrapper with the total count instead of a plain array.

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/EquipmentController.java` - method `getMyEquipment` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | `search` (String; optional)<br>`status` (StatusEquipmentResource; optional; values ACTIVE, MAINTENANCE, REPAIR, DEACTIVATED)<br>`equipment_type` (EquipmentTypeResource; optional; values DISPLAY_CASE, COLD_ROOM, REFRIGERATOR, OTHER)<br>`site_id` (Long; optional)<br>`page` (Integer; optional)<br>`size` (Integer; optional) |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `EquipmentResource` ([`responses/EquipmentResource.json`](responses/EquipmentResource.json)); **or** `PagedEquipmentResource` when both `page` and `size` are sent - Equipment found<br>`400` - error body - Invalid filter or paging value, such as an unknown status or a page size above 100<br>`401` - error body - Unauthorized - no owner identity on the request<br>`403` - error body - Forbidden - the authenticated account is not an owner |
| Application flow | controller -> `equipmentQueryService` |

## `GET /api/v1/assets/equipments/directory`

**Get my equipment directory** - Returns the identity of every unit of the authenticated owner - id, uid, name, type, status and site, with the site name - sorted by name, unpaged. It carries no telemetry, threshold or configuration version, so it only changes when a unit or a site is created, renamed or changes status. The `ETag` header identifies the answer; sending it back in `If-None-Match` answers `304` with an empty body while nothing changed.

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/EquipmentController.java` - method `getMyEquipmentDirectory` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>`, `If-None-Match` (optional) |
| Path parameters | none |
| Query parameters | `site_id` (Long; optional)<br>`status` (comma-separated `StatusEquipmentResource`; optional; values ACTIVE, MAINTENANCE, REPAIR, DEACTIVATED) |
| Request body | none (no JSON request body) |
| Response headers | `ETag` (quoted digest of the answer), `Cache-Control: no-cache, private`, `Vary: Authorization` |
| Declared statuses / responses | `200` - JSON array of `EquipmentDirectoryEntryResource` - Directory found; the ETag header identifies it<br>`304` - no JSON body (Directory unchanged since the ETag in If-None-Match)<br>`400` - error body - Invalid filter value, such as an unknown status<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is not an owner<br>`404` - error body - SITE_NOT_FOUND - no such site is reachable by the caller |
| Application flow | controller -> `equipmentQueryService` |

## `GET /api/v1/assets/equipments/{equipmentId}`

**Get an equipment by ID** - Retrieves the full detail of an equipment unit. Owners can only read their own units; technicians can only read units they hold an active service request on (assigned, accepted or in progress). Any other unit answers 404.

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/EquipmentController.java` - method `getEquipmentById` |
| Authentication / authorization | OWNER_ROLE or TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `equipmentId` (Long; Java `equipmentId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `EquipmentResource` ([`responses/EquipmentResource.json`](responses/EquipmentResource.json)) - Equipment found<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is neither an owner nor a technician<br>`404` - error body - No such equipment is reachable by the caller |
| Application flow | controller -> `equipmentQueryService` |

## `PUT /api/v1/assets/equipments/{equipmentId}`

**Update an equipment** - Replaces the name, type and preventive maintenance interval of one of the authenticated owner's units. The uid, the site and the threshold are not editable here. Accepts `If-Match: "<version>"`: a stale version answers `409 CONCURRENT_MODIFICATION_CONFLICT`, and a malformed header `400`.

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/EquipmentController.java` - method `updateEquipment` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>`, `If-Match: "<version>"` (optional) |
| Path parameters | `equipmentId` (Long; Java `equipmentId`) |
| Query parameters | none |
| Request body | `UpdateEquipmentResource` - [`requests/UpdateEquipmentResource.json`](requests/UpdateEquipmentResource.json), schema [`UpdateEquipmentResource.schema.json`](../../schemas/assets/UpdateEquipmentResource.schema.json) |
| Declared statuses / responses | `200` - `EquipmentResource` ([`responses/EquipmentResource.json`](responses/EquipmentResource.json)) - Equipment updated<br>`400` - error body - Invalid input data, such as a non-positive maintenance interval<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account has no owner profile<br>`404` - error body - No such equipment is reachable by the caller |<br>`409` - error body - CONCURRENT_MODIFICATION_CONFLICT - If-Match names a version other than the current one (`details` gives the current version); a malformed If-Match is `400`
| Application flow | controller -> `equipmentCommandService` |

## `PUT /api/v1/assets/equipments/{equipmentId}/threshold`

**Change the temperature threshold** - Replaces the acceptable temperature band of one of the authenticated owner's units. Both bounds must lie within 0 to 30 °C and the minimum must be strictly below the maximum; otherwise the request is rejected with 400, the previous band stays active and no domain event is emitted. An accepted band increments config_version, returned in the response, so the unit's edge gateway downloads it on its next poll. Accepts `If-Match: "<version>"` (`409 CONCURRENT_MODIFICATION_CONFLICT` when stale).

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/EquipmentController.java` - method `changeThreshold` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>`, `If-Match: "<version>"` (optional) |
| Path parameters | `equipmentId` (Long; Java `equipmentId`) |
| Query parameters | none |
| Request body | `ChangeThresholdResource` - [`requests/ChangeThresholdResource.json`](requests/ChangeThresholdResource.json), schema [`ChangeThresholdResource.schema.json`](../../schemas/assets/ChangeThresholdResource.schema.json) |
| Declared statuses / responses | `200` - `EquipmentResource` ([`responses/EquipmentResource.json`](responses/EquipmentResource.json)) - Threshold updated<br>`400` - error body - Invalid band: a bound outside 0 to 30 °C, or a minimum greater than or equal to its maximum<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account has no owner profile<br>`404` - error body - No such equipment is reachable by the caller |<br>`409` - error body - CONCURRENT_MODIFICATION_CONFLICT - If-Match names a version other than the current one (`details` gives the current version); a malformed If-Match is `400`
| Application flow | controller -> `equipmentCommandService` |

## `PUT /api/v1/assets/equipments/{equipmentId}/status`

**Change the equipment status** - Moves one of the caller's own equipment units to a new lifecycle status. Owner only: technicians cannot change a unit's status directly. Allowed transitions: ACTIVE to MAINTENANCE, REPAIR or DEACTIVATED; MAINTENANCE to ACTIVE, REPAIR or DEACTIVATED; REPAIR to ACTIVE or DEACTIVATED; DEACTIVATED to ACTIVE. Maintenance is only entered from ACTIVE, and a deactivated unit must be reactivated first. Re-sending the current status is a no-op. A forbidden transition is rejected with 409. Accepts `If-Match: "<version>"` (`409 CONCURRENT_MODIFICATION_CONFLICT` when stale).

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/EquipmentController.java` - method `changeStatus` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>`, `If-Match: "<version>"` (optional) |
| Path parameters | `equipmentId` (Long; Java `equipmentId`) |
| Query parameters | none |
| Request body | `ChangeStatusResource` - [`requests/ChangeStatusResource.json`](requests/ChangeStatusResource.json), schema [`ChangeStatusResource.schema.json`](../../schemas/assets/ChangeStatusResource.schema.json) |
| Declared statuses / responses | `200` - `EquipmentResource` ([`responses/EquipmentResource.json`](responses/EquipmentResource.json)) - Status changed<br>`400` - error body - Invalid input data<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is not an owner, or is an owner without an owner profile<br>`404` - error body - No such equipment is reachable by the caller<br>`409` - error body - The requested status transition is not allowed, or CONCURRENT_MODIFICATION_CONFLICT when If-Match is stale (`details` gives the current version) |
| Application flow | controller -> `equipmentCommandService` |

## `POST /api/v1/assets/sites/validate-address`

**Verify a site address** - Verifies an address with Google Maps, restricted to Metropolitan Lima and the Constitutional Province of Callao. Returns the normalized address, its coordinates and district, and a validation_token valid for 15 minutes. Nothing is saved. Callers are limited to 20 validations per minute.

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/SiteController.java` - method `validateAddress` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `ValidateAddressResource` - [`requests/ValidateAddressResource.json`](requests/ValidateAddressResource.json), schema [`ValidateAddressResource.schema.json`](../../schemas/assets/ValidateAddressResource.schema.json) |
| Declared statuses / responses | `200` - `AddressValidationResource` ([`responses/AddressValidationResource.json`](responses/AddressValidationResource.json)) - Address verified<br>`400` - error body - Invalid input data, such as a missing address<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the caller is not an owner<br>`422` - error body - ADDRESS_OUT_OF_COVERAGE, or ADDRESS_NOT_VERIFIED with up to five candidates<br>`429` - error body - TOO_MANY_REQUESTS - more than 20 validations in a minute<br>`503` - error body - GEOCODING_UNAVAILABLE - the maps service failed or timed out; Retry-After is 30 |
| Application flow | controller -> `addressValidationCommandService` |

## `POST /api/v1/assets/sites`

**Register a site** - Registers a new site for the authenticated owner at the address carried by a validation_token issued by POST /validate-address. The owner is taken from the authenticated identity and cannot be supplied in the payload. An optional pin must lie within 150 meters of the verified point. The site is saved as RESOLVED; the maps service is not queried. Accepts an optional `Idempotency-Key` header (UUID; see the retry rules in the conventions guide).

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/SiteController.java` - method `registerSite` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `RegisterSiteResource` - [`requests/RegisterSiteResource.json`](requests/RegisterSiteResource.json), schema [`RegisterSiteResource.schema.json`](../../schemas/assets/RegisterSiteResource.schema.json) |
| Declared statuses / responses | `201` - `SiteResource` ([`responses/SiteResource.json`](responses/SiteResource.json)) - Site registered<br>`400` - error body - VALIDATION_ERROR, ADDRESS_VALIDATION_REQUIRED (missing, invalid, expired or foreign token), or PIN_OUT_OF_RANGE<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account has no owner profile |
| Application flow | controller -> `siteCommandService` |

## `GET /api/v1/assets/sites`

**List my sites** - Lists every site belonging to the authenticated owner, with its name, address, contact name and contact phone number.

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/SiteController.java` - method `getMySites` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `SiteResource` ([`responses/SiteResource.json`](responses/SiteResource.json)) - Sites found<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is not an owner |
| Application flow | controller -> `siteQueryService` |

## `GET /api/v1/assets/sites/{siteId}`

**Get a site by ID** - Retrieves a site by its unique identifier. Owners can only read their own sites; technicians can only read sites where they hold an active service request. Any other site answers 404.

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/SiteController.java` - method `getSiteById` |
| Authentication / authorization | OWNER_ROLE or TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `siteId` (Long; Java `siteId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `SiteResource` ([`responses/SiteResource.json`](responses/SiteResource.json)) - Site found<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is neither an owner nor a technician<br>`404` - error body - No such site is reachable by the caller |
| Application flow | controller -> `siteQueryService` |

## `GET /api/v1/assets/sites/{siteId}/equipments`

**List the equipment of a site** - Lists the equipment installed at a site. Owners can only list their own sites; technicians only see the units of the site they hold an active service request on.

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/SiteController.java` - method `getEquipmentBySite` |
| Authentication / authorization | OWNER_ROLE or TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `siteId` (Long; Java `siteId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `EquipmentResource` ([`responses/EquipmentResource.json`](responses/EquipmentResource.json)) - Equipment found<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is neither an owner nor a technician<br>`404` - error body - No such site is reachable by the caller |
| Application flow | controller -> `equipmentQueryService`, `siteQueryService` |

## `PUT /api/v1/assets/sites/{siteId}`

**Update a site** - Replaces the name, contact name and contact phone number of one of the authenticated owner's sites. The address and coordinates are not changed here: use PUT /{siteId}/address with a validation_token. The owner of a site never changes. Accepts `If-Match: "<version>"` (`409 CONCURRENT_MODIFICATION_CONFLICT` when stale; `400` when malformed).

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/SiteController.java` - method `updateSite` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>`, `If-Match: "<version>"` (optional) |
| Path parameters | `siteId` (Long; Java `siteId`) |
| Query parameters | none |
| Request body | `UpdateSiteResource` - [`requests/UpdateSiteResource.json`](requests/UpdateSiteResource.json), schema [`UpdateSiteResource.schema.json`](../../schemas/assets/UpdateSiteResource.schema.json) |
| Declared statuses / responses | `200` - `SiteResource` ([`responses/SiteResource.json`](responses/SiteResource.json)) - Site updated<br>`400` - error body - Invalid input data<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account has no owner profile<br>`404` - error body - No such site is reachable by the caller<br>`409` - error body - The site exists but belongs to another owner |<br>`409` - error body - CONCURRENT_MODIFICATION_CONFLICT - If-Match names a version other than the current one (`details` gives the current version); a malformed If-Match is `400`
| Application flow | controller -> `siteCommandService` |

## `PUT /api/v1/assets/sites/{siteId}/address`

**Change the address of a site** - Moves one of the authenticated owner's sites to the address carried by a validation_token issued by POST /validate-address, keeping its equipment. An optional pin must lie within 150 meters of the verified point. The site is answered RESOLVED with its new location. Accepts `If-Match: "<version>"` (`409 CONCURRENT_MODIFICATION_CONFLICT` when stale).

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/SiteController.java` - method `updateSiteAddress` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>`, `If-Match: "<version>"` (optional) |
| Path parameters | `siteId` (Long; Java `siteId`) |
| Query parameters | none |
| Request body | `UpdateSiteAddressResource` - [`requests/UpdateSiteAddressResource.json`](requests/UpdateSiteAddressResource.json), schema [`UpdateSiteAddressResource.schema.json`](../../schemas/assets/UpdateSiteAddressResource.schema.json) |
| Declared statuses / responses | `200` - `SiteResource` ([`responses/SiteResource.json`](responses/SiteResource.json)) - Address changed and located<br>`400` - error body - ADDRESS_VALIDATION_REQUIRED or PIN_OUT_OF_RANGE<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account has no owner profile<br>`404` - error body - No such site is reachable by the caller<br>`409` - error body - CONCURRENT_MODIFICATION_CONFLICT - If-Match names a version other than the current one |
| Application flow | controller -> `siteCommandService` |

## `POST /api/v1/assets/sites/{siteId}/geocoding/retry`

**Retry locating a site** - Looks the site's current address up again with Google Maps. Charged to the same 20-per-minute quota as `POST /validate-address`. When the maps service cannot answer right away the site is left `PENDING` and the lookup continues in the background (after 5, 20 and 60 seconds), ending `RESOLVED`, `NOT_FOUND` or `FAILED` with `PROVIDER_UNAVAILABLE`.

| Field | Value |
|---|---|
| Bounded context | Assets |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/SiteController.java` - method `retrySiteGeocoding` |
| Authentication / authorization | OWNER_ROLE; the caller's site |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `siteId` (Long; Java `siteId`) |
| Query parameters | none |
| Request body | none |
| Declared statuses / responses | `200` - `SiteResource` - Lookup finished: `RESOLVED`, or `NOT_FOUND` with `geocoding_failure_reason` `ADDRESS_NOT_FOUND` or `OUT_OF_COVERAGE`<br>`202` - `SiteResource` with `geocoding_status: PENDING` - Lookup continues in the background<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account has no owner profile<br>`404` - error body - SITE_NOT_FOUND - no such site is reachable by the caller<br>`409` - error body - INVALID_STATUS_TRANSITION - the site is already RESOLVED<br>`429` - error body - TOO_MANY_REQUESTS - the shared quota is used up; `Retry-After: 60`<br>`503` - error body - GEOCODING_UNAVAILABLE - the maps service refused the request, the site is left `FAILED`; `Retry-After: 30` |
| Application flow | controller -> `siteCommandService` -> `GeocodingPort`; background attempts by `SiteGeocodingPendingEventHandler` |
