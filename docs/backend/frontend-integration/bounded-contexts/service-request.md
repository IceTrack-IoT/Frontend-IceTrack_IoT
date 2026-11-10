# Service Request Management

Package `pe.edu.upc.ice.track.platform.service.request` (documentation folder name `service-request`). API: [../api/service-request/endpoints.md](../api/service-request/endpoints.md), contracts: [../api/service-request/contracts.md](../api/service-request/contracts.md).

## Responsibilities

Maintenance and repair requests created by owners, technician assignment, technician acceptance/rejection/start, interventions that complete a request, owner reviews of the technician, edge grants that let a technician operate the on-site gateway, and links to maintenance windows opened during the work.

## Package organization (actual)

```text
service/request/
  application/commandservices   ServiceRequestCommandService, ReviewCommandService
  application/queryservices     ServiceRequestQueryService, ReviewQueryService
  application/internal/eventhandlers   ServiceRequestOutboxEventHandler (writes the outbox), EdgeGrantEventHandler
  application/internal/outboundservices
      acl/ExternalEquipmentService (+EquipmentRef), ExternalUserProfileService
      tokens/EdgeGrantTokenService
  domain/model/aggregates   ServiceRequest, Review, EdgeGrant
  domain/model/entities     Intervention, StatusTransition, MaintenanceWindowLink
  domain/model/valueobjects ServiceStatus, ServiceType, ServicePriority, ReviewRating, OwnerId, TechnicianProfileId, IssuedEdgeGrant ...
  infrastructure/monitoring/events/MaintenanceWindowLinkEventListener, infrastructure/tokens, infrastructure/persistence/jpa
  interfaces/acl/ServiceRequestContextFacade (+ActiveEdgeGrant, InProgressServiceRequest) ; interfaces/events/* (8 integration events)
  interfaces/rest   ServiceRequestsController, InterventionsController, ReviewsController, EquipmentInterventionsController
```

## State machine (`ServiceRequest`, `ServiceStatus`: `PENDING`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELED`)

| Action (endpoint) | Actor | From | To | Notes |
|---|---|---|---|---|
| create (`POST /service-requests`) | owner | | `PENDING` | no technician; type `PREVENTIVE_MAINTENANCE` or `REPAIR`, priority `LOW`, `MEDIUM`, `HIGH`, `URGENT`, description <=1000 |
| assign (`PUT /{id}/assign`) | owner | `PENDING`, `ACCEPTED` | `PENDING` | replaces the technician; revokes the previous edge grant; `409 TECHNICIAN_NOT_ELIGIBLE` when the technician profile does not exist (the only eligibility rule: `ProfilesContextFacade.isTechnicianEligibleForAssignment` checks the profile exists) |
| accept (`PUT /{id}/accept`) | assigned technician | `PENDING` | `ACCEPTED` | issues an **edge grant**; `edge_grant.token` is shown only here |
| reject (`PUT /{id}/reject`) | assigned technician | `PENDING` | `PENDING` (technician cleared) | `reason` required (<=500); owner can assign another |
| start (`PUT /{id}/start`) | assigned technician | `ACCEPTED` | `IN_PROGRESS` | optional body `started_at` (not in the future, else `400`); repeating with the same instant is an idempotent no-op |
| regenerate grant (`POST /{id}/edge-grant`) | assigned technician | `ACCEPTED`, `IN_PROGRESS` | unchanged | revokes the previous grant |
| register intervention (`POST /interventions`) | assigned technician | `IN_PROGRESS` | `COMPLETED` | idempotent by `client_generated_id` (same request: `200` with the stored intervention; another request: `409 DUPLICATE_RESOURCE_CONFLICT`); revokes the grant |
| cancel (`PUT /{id}/cancel`) | owner | `PENDING`, `ACCEPTED` | `CANCELED` | `reason` required (<=500); revokes the grant |

An illegal move is `409 INVALID_STATUS_TRANSITION`; concurrent writes are `409 CONCURRENT_MODIFICATION_CONFLICT` (optimistic locking; re-read and retry). A request the caller cannot see is `404`. The history of transitions (`history[]`: `from_status`, `to_status`, `actor_id`, `occurred_at`, `reason`, `technician_id`) travels with the request.

Reviews: the owner reviews the technician of a **completed** request with `communication`, `efficacy`, `performance` (each 1 to 5) and an optional `comment` (<=1000); the average is computed (`average_rating`). It can be edited for 48 hours (`editable_until`); afterwards `409 REVIEW_NOT_ALLOWED`. A second review of the same request is `409 DUPLICATE_RESOURCE_CONFLICT`; a non-completed request is `409 REVIEW_NOT_ALLOWED`.

Edge grant: opaque token `it_grt_...` (SHA-256 digest stored), default TTL 24 h (`EDGE_GRANT_TTL_HOURS`). The gateway learns its digest on its next config poll; the technician's mobile app presents the plaintext token to the gateway. It is revoked on reassignment, cancellation and completion. Any grant change bumps the equipment `config_version` (assets listener).

## Internal data flow, `PUT /api/v1/service-requests/{id}/accept`

`ServiceRequestsController.acceptServiceRequest` (`TECHNICIAN_ROLE`) -> `ServiceRequestCommandServiceImpl`: technician profile id via `ExternalUserProfileService.fetchTechnicianIdByUsername` (iam + profiles facades) -> load `ServiceRequest` assigned to that technician (else `404`) -> `ServiceRequest.accept` (state machine) -> `EdgeGrantTokenService` issues the token, `EdgeGrant` aggregate stored (digest only) -> events `ServiceRequestAcceptedEvent`, `EdgeGrantIssuedEvent` -> `ServiceRequestResourceFromEntityAssembler` with `IssuedEdgeGrantResourceFromEntityAssembler` -> `200 ServiceRequestResource` including `edge_grant`. `EdgeGrantIssuedIntegrationEvent` -> assets bumps `config_version`.

## Interfaces

Controllers: `ServiceRequestsController` (10 endpoints), `InterventionsController` (1), `ReviewsController` (2), `EquipmentInterventionsController` (1: `GET /api/v1/assets/equipments/{equipmentId}/interventions`, a path under the **assets** URL space served by this context). `ServiceRequestResource` is the central response: it embeds `history`, `intervention`, `maintenance_windows`, and `edge_grant` (the latter only when issued, `NON_NULL`).

## Dependencies

Outbound: `ExternalEquipmentService` (ownership and site of the unit via `AssetContextFacade`), `ExternalUserProfileService` (iam + profiles). Inbound: `ServiceRequestContextFacade` used by assets, device, monitoring, profiles, reporting. Publishes `TechnicianAssigned`, `ServiceRequestRejected`, `ServiceRequestCanceled`, `ServiceRequestCompleted`, `ReviewSubmitted`, `ReviewUpdated` (outbox) and `EdgeGrantIssued`, `EdgeGrantRevoked` (in-process). Subscribes to monitoring's maintenance-window events to attach windows to the in-progress request.
