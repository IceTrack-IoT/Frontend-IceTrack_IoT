# Service Request Management - REST endpoints

Every endpoint below was discovered from the controllers named in its entry. "Declared statuses" are the `@ApiResponse` codes the controller documents. Statuses produced by shared handlers apply to every endpoint (see [../../errors/error-contract.md](../../errors/error-contract.md)): `400` for unreadable bodies, failed validation and bad parameter types; `401` for a missing or invalid bearer token; `403` for method-security denials; `500` for unexpected errors.

Base URL: see [../../README.md](../../README.md#5-base-url). All paths are relative to it. JSON bodies use `snake_case`.

| # | Method | Path | Auth | Summary |
|---|---|---|---|---|
| 1 | `GET` | `/api/v1/assets/equipments/{equipmentId}/interventions` | OWNER_ROLE or TECHNICIAN_ROLE | List the interventions of an equipment |
| 2 | `POST` | `/api/v1/interventions` | TECHNICIAN_ROLE | Register an intervention |
| 3 | `POST` | `/api/v1/reviews` | OWNER_ROLE | Submit a review |
| 4 | `PUT` | `/api/v1/reviews/{reviewId}` | OWNER_ROLE | Update a review |
| 5 | `POST` | `/api/v1/service-requests` | OWNER_ROLE | Create a service request |
| 6 | `GET` | `/api/v1/service-requests` | OWNER_ROLE or TECHNICIAN_ROLE | List my service requests |
| 7 | `GET` | `/api/v1/service-requests/{serviceRequestId}` | OWNER_ROLE or TECHNICIAN_ROLE | Get a service request by ID |
| 8 | `PUT` | `/api/v1/service-requests/{serviceRequestId}/assign` | OWNER_ROLE | Assign a technician |
| 9 | `PUT` | `/api/v1/service-requests/{serviceRequestId}/accept` | TECHNICIAN_ROLE | Accept a service request |
| 10 | `POST` | `/api/v1/service-requests/{serviceRequestId}/edge-grant` | TECHNICIAN_ROLE | Regenerate the edge grant of a service request |
| 11 | `PUT` | `/api/v1/service-requests/{serviceRequestId}/reject` | TECHNICIAN_ROLE | Reject a service request |
| 12 | `PUT` | `/api/v1/service-requests/{serviceRequestId}/start` | TECHNICIAN_ROLE | Start a service request |
| 13 | `PUT` | `/api/v1/service-requests/{serviceRequestId}/cancel` | OWNER_ROLE | Cancel a service request |
| 14 | `GET` | `/api/v1/service-requests/{serviceRequestId}/review` | OWNER_ROLE or TECHNICIAN_ROLE | Get the review of a service request |

## `GET /api/v1/assets/equipments/{equipmentId}/interventions`

**List the interventions of an equipment** - Lists the interventions that completed service requests on a unit, most recent first. Open to the owner of the unit and to a technician assigned to an active or completed request on it.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/EquipmentInterventionsController.java` - method `getEquipmentInterventions` |
| Authentication / authorization | OWNER_ROLE or TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `equipmentId` (Long; Java `equipmentId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `InterventionResource` ([`responses/InterventionResource.json`](responses/InterventionResource.json)) - Interventions found<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is neither an owner nor a technician<br>`404` - error body - No such equipment is reachable by the caller |
| Application flow | controller -> `serviceRequestQueryService` |

## `POST /api/v1/interventions`

**Register an intervention** - Registers the technical report of an IN_PROGRESS request assigned to the authenticated technician and completes the request. Re-submitting the same client_generated_id for the same request returns the registered intervention with 200 instead of failing.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/InterventionsController.java` - method `registerIntervention` |
| Authentication / authorization | TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `RegisterInterventionResource` - [`requests/RegisterInterventionResource.json`](requests/RegisterInterventionResource.json), schema [`RegisterInterventionResource.schema.json`](../../schemas/service-request/RegisterInterventionResource.schema.json) |
| Declared statuses / responses | `201` - `InterventionResource` ([`responses/InterventionResource.json`](responses/InterventionResource.json)) - Intervention registered and service request completed<br>`200` - `InterventionResource` ([`responses/InterventionResource.json`](responses/InterventionResource.json)) - Replay of an intervention already registered<br>`400` - error body - Invalid report, such as a blank diagnosis or a completion before the start<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is not a technician<br>`404` - error body - No such service request is assigned to the caller<br>`409` - error body - INVALID_STATUS_TRANSITION, DUPLICATE_RESOURCE_CONFLICT for a client_generated_id of another request, or CONCURRENT_MODIFICATION_CONFLICT |
| Application flow | controller -> `serviceRequestCommandService` |

## `POST /api/v1/reviews`

**Submit a review** - Reviews the technician who completed one of the authenticated owner's requests. The review can be edited during the following 48 hours.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/ReviewsController.java` - method `submitReview` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `SubmitReviewResource` - [`requests/SubmitReviewResource.json`](requests/SubmitReviewResource.json), schema [`SubmitReviewResource.schema.json`](../../schemas/service-request/SubmitReviewResource.schema.json) |
| Declared statuses / responses | `201` - `ReviewResource` ([`responses/ReviewResource.json`](responses/ReviewResource.json)) - Review submitted<br>`400` - error body - Invalid input data, such as a score outside 1 to 5<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is not an owner<br>`404` - error body - No such service request is reachable by the caller<br>`409` - error body - REVIEW_NOT_ALLOWED for a request not completed, or DUPLICATE_RESOURCE_CONFLICT for a request already reviewed |
| Application flow | controller -> `reviewCommandService` |

## `PUT /api/v1/reviews/{reviewId}`

**Update a review** - Replaces the scores and the comment of one of the authenticated owner's reviews, within 48 hours of its submission.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/ReviewsController.java` - method `updateReview` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `reviewId` (Long; Java `reviewId`) |
| Query parameters | none |
| Request body | `UpdateReviewResource` - [`requests/UpdateReviewResource.json`](requests/UpdateReviewResource.json), schema [`UpdateReviewResource.schema.json`](../../schemas/service-request/UpdateReviewResource.schema.json) |
| Declared statuses / responses | `200` - `ReviewResource` ([`responses/ReviewResource.json`](responses/ReviewResource.json)) - Review updated<br>`400` - error body - Invalid input data, such as a score outside 1 to 5<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is not an owner<br>`404` - error body - No such review is reachable by the caller<br>`409` - error body - REVIEW_NOT_ALLOWED - the edit window has closed |
| Application flow | controller -> `reviewCommandService` |

## `POST /api/v1/service-requests`

**Create a service request** - Creates a maintenance or repair request for a unit of the authenticated owner. The request starts PENDING, without a technician.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/ServiceRequestsController.java` - method `createServiceRequest` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `CreateServiceRequestResource` - [`requests/CreateServiceRequestResource.json`](requests/CreateServiceRequestResource.json), schema [`CreateServiceRequestResource.schema.json`](../../schemas/service-request/CreateServiceRequestResource.schema.json) |
| Declared statuses / responses | `201` - `ServiceRequestResource` ([`responses/ServiceRequestResource.json`](responses/ServiceRequestResource.json)) - Service request created<br>`400` - error body - Invalid input data<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is not an owner<br>`404` - error body - No such equipment is reachable by the caller |
| Application flow | controller -> `serviceRequestCommandService` |

## `GET /api/v1/service-requests`

**List my service requests** - An owner lists the requests it created; a technician lists the requests assigned to it, which assigned_to=me makes explicit. Optionally filtered by one or more statuses, always paged and ordered by creation date, newest first.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/ServiceRequestsController.java` - method `listServiceRequests` |
| Authentication / authorization | OWNER_ROLE or TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | `status` (comma-separated list of ServiceStatusResource; optional; values PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELED)<br>`assigned_to` (String; optional; only the value `me` is accepted)<br>`page` (Integer; optional; default `0`, zero-based)<br>`size` (Integer; optional; default `20`, 1 to 100) |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `PagedServiceRequestResource` ([`responses/PagedServiceRequestResource.json`](responses/PagedServiceRequestResource.json)) - Service requests found<br>`400` - error body - Invalid filter or paging value, such as an unknown status, a page size above 100, or assigned_to=me sent by an owner<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is neither an owner nor a technician |
| Application flow | controller -> `serviceRequestQueryService` |

## `GET /api/v1/service-requests/{serviceRequestId}`

**Get a service request by ID** - Retrieves a request with its full status history and the maintenance windows opened on the unit while its work was in progress (maintenance_windows, oldest first, with origin, technician, start, end and closure reason). Only its owner and its assigned technician can read it.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/ServiceRequestsController.java` - method `getServiceRequestById` |
| Authentication / authorization | OWNER_ROLE or TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `serviceRequestId` (Long; Java `serviceRequestId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `ServiceRequestResource` ([`responses/ServiceRequestResource.json`](responses/ServiceRequestResource.json)) - Service request found<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is neither an owner nor a technician<br>`404` - error body - No such service request is reachable by the caller |
| Application flow | controller -> `serviceRequestQueryService` |

## `PUT /api/v1/service-requests/{serviceRequestId}/assign`

**Assign a technician** - Assigns a technician to a PENDING or ACCEPTED request, replacing the current one if any. The request goes back to PENDING until the new technician accepts it.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/ServiceRequestsController.java` - method `assignTechnician` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `serviceRequestId` (Long; Java `serviceRequestId`) |
| Query parameters | none |
| Request body | `AssignTechnicianResource` - [`requests/AssignTechnicianResource.json`](requests/AssignTechnicianResource.json), schema [`AssignTechnicianResource.schema.json`](../../schemas/service-request/AssignTechnicianResource.schema.json) |
| Declared statuses / responses | `200` - `ServiceRequestResource` ([`responses/ServiceRequestResource.json`](responses/ServiceRequestResource.json)) - Technician assigned<br>`400` - error body - Invalid input data<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is not an owner<br>`404` - error body - No such service request is reachable by the caller<br>`409` - error body - TECHNICIAN_NOT_ELIGIBLE, INVALID_STATUS_TRANSITION or CONCURRENT_MODIFICATION_CONFLICT |
| Application flow | controller -> `serviceRequestCommandService` |

## `PUT /api/v1/service-requests/{serviceRequestId}/accept`

**Accept a service request** - Accepts a PENDING request assigned to the authenticated technician and issues an edge grant for the unit's gateway. The response carries edge_grant with its plaintext token (it_grt_...), shown only here; only its SHA-256 digest is stored. The gateway learns the grant on its next configuration poll. Reassigning, canceling or completing the request revokes it.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/ServiceRequestsController.java` - method `acceptServiceRequest` |
| Authentication / authorization | TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `serviceRequestId` (Long; Java `serviceRequestId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `ServiceRequestResource` ([`responses/ServiceRequestResource.json`](responses/ServiceRequestResource.json)) - Service request accepted; edge_grant.token is shown only once<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is not a technician<br>`404` - error body - No such service request is assigned to the caller<br>`409` - error body - INVALID_STATUS_TRANSITION or CONCURRENT_MODIFICATION_CONFLICT |
| Application flow | controller -> `serviceRequestCommandService` |

## `POST /api/v1/service-requests/{serviceRequestId}/edge-grant`

**Regenerate the edge grant of a service request** - Issues a new edge grant to the assigned technician of an ACCEPTED or IN_PROGRESS request, for example after the previous token was lost, and revokes the previous grant. The new plaintext token is shown only in this response.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/ServiceRequestsController.java` - method `regenerateEdgeGrant` |
| Authentication / authorization | TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `serviceRequestId` (Long; Java `serviceRequestId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `IssuedEdgeGrantResource` ([`responses/IssuedEdgeGrantResource.json`](responses/IssuedEdgeGrantResource.json)) - New edge grant issued; token is shown only once<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - `ErrorResource` - ACCESS_DENIED - the caller is not a technician, or the request is assigned to another technician<br>`404` - `ErrorResource` - SERVICE_REQUEST_NOT_FOUND<br>`409` - `ErrorResource` - INVALID_STATUS_TRANSITION - the request is neither ACCEPTED nor IN_PROGRESS |
| Application flow | controller -> `serviceRequestCommandService` |

## `PUT /api/v1/service-requests/{serviceRequestId}/reject`

**Reject a service request** - Rejects a PENDING request assigned to the authenticated technician. The request stays PENDING without a technician, so the owner can assign another one.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/ServiceRequestsController.java` - method `rejectServiceRequest` |
| Authentication / authorization | TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `serviceRequestId` (Long; Java `serviceRequestId`) |
| Query parameters | none |
| Request body | `RejectServiceRequestResource` - [`requests/RejectServiceRequestResource.json`](requests/RejectServiceRequestResource.json), schema [`RejectServiceRequestResource.schema.json`](../../schemas/service-request/RejectServiceRequestResource.schema.json) |
| Declared statuses / responses | `200` - `ServiceRequestResource` ([`responses/ServiceRequestResource.json`](responses/ServiceRequestResource.json)) - Service request rejected<br>`400` - error body - Missing reason<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is not a technician<br>`404` - error body - No such service request is assigned to the caller<br>`409` - error body - INVALID_STATUS_TRANSITION or CONCURRENT_MODIFICATION_CONFLICT |
| Application flow | controller -> `serviceRequestCommandService` |

## `PUT /api/v1/service-requests/{serviceRequestId}/start`

**Start a service request** - Moves an ACCEPTED request assigned to the authenticated technician to IN_PROGRESS. The body is optional and carries the start instant reported by the device; repeating the call with the same instant is an idempotent no-op.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/ServiceRequestsController.java` - method `startServiceRequest` |
| Authentication / authorization | TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `serviceRequestId` (Long; Java `serviceRequestId`) |
| Query parameters | none |
| Request body | `StartServiceRequestResource` (body optional) - [`requests/StartServiceRequestResource.json`](requests/StartServiceRequestResource.json), schema [`StartServiceRequestResource.schema.json`](../../schemas/service-request/StartServiceRequestResource.schema.json) |
| Declared statuses / responses | `200` - `ServiceRequestResource` ([`responses/ServiceRequestResource.json`](responses/ServiceRequestResource.json)) - Service request started<br>`400` - error body - A start instant in the future<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is not a technician<br>`404` - error body - No such service request is assigned to the caller<br>`409` - error body - INVALID_STATUS_TRANSITION or CONCURRENT_MODIFICATION_CONFLICT |
| Application flow | controller -> `serviceRequestCommandService` |

## `PUT /api/v1/service-requests/{serviceRequestId}/cancel`

**Cancel a service request** - Cancels a PENDING or ACCEPTED request of the authenticated owner. A request whose work already started, or that is already closed, cannot be canceled.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/ServiceRequestsController.java` - method `cancelServiceRequest` |
| Authentication / authorization | OWNER_ROLE |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `serviceRequestId` (Long; Java `serviceRequestId`) |
| Query parameters | none |
| Request body | `CancelServiceRequestResource` - [`requests/CancelServiceRequestResource.json`](requests/CancelServiceRequestResource.json), schema [`CancelServiceRequestResource.schema.json`](../../schemas/service-request/CancelServiceRequestResource.schema.json) |
| Declared statuses / responses | `200` - `ServiceRequestResource` ([`responses/ServiceRequestResource.json`](responses/ServiceRequestResource.json)) - Service request canceled<br>`400` - error body - Missing reason<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is not an owner<br>`404` - error body - No such service request is reachable by the caller<br>`409` - error body - INVALID_STATUS_TRANSITION or CONCURRENT_MODIFICATION_CONFLICT |
| Application flow | controller -> `serviceRequestCommandService` |

## `GET /api/v1/service-requests/{serviceRequestId}/review`

**Get the review of a service request** - Retrieves the review of a request. Only the owner who wrote it and the technician it is about can read it.

| Field | Value |
|---|---|
| Bounded context | Service Request Management |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/ServiceRequestsController.java` - method `getServiceRequestReview` |
| Authentication / authorization | OWNER_ROLE or TECHNICIAN_ROLE |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `serviceRequestId` (Long; Java `serviceRequestId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `ReviewResource` ([`responses/ReviewResource.json`](responses/ReviewResource.json)) - Review found<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - the authenticated account is neither an owner nor a technician<br>`404` - error body - No review of that request is reachable by the caller |
| Application flow | controller -> `reviewQueryService` |
