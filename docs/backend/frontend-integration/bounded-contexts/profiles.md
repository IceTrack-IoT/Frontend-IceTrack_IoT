# Profiles

Package `pe.edu.upc.ice.track.platform.profiles`. API: [../api/profiles/endpoints.md](../api/profiles/endpoints.md), contracts: [../api/profiles/contracts.md](../api/profiles/contracts.md).

## Responsibilities

Owner and technician profiles (contact data, RUC, speciality, certification), per-account dashboard configuration (cards, default site, default temperature range), and the technician statistics read model (`completed_services`, `average_rating`).

## Package organization (actual)

```text
profiles/
  application/commandservices   DashboardConfigCommandService, OwnerCommandService, TechnicianCommandService
  application/queryservices     DashboardConfigQueryService, OwnerQueryService, TechnicianQueryService
  application/internal/eventhandlers  OwnerCreatedEventHandler, TechnicianCreatedEventHandler, TechnicianMetricsProjector
  application/internal/outboundservices/acl   ExternalIamService -> IamContextFacade; ExternalServiceRequestService -> ServiceRequestContextFacade
  domain/model/aggregates   Profile (base), OwnerProfile, TechnicianProfile, DashboardConfig
  domain/model/entities     DashboardCard
  domain/model/valueobjects EmailAddress, PersonName, Phone, Ruc, Speciality, StreetAddress, TemperatureRange, CardType, CardLayoutItem
  domain/model/readmodels, factories, events (OwnerCreatedEvent, TechnicianCreatedEvent)
  infrastructure/persistence/jpa (adapters, assemblers, converters, embeddables, entities, repositories)
  interfaces/acl/ProfilesContextFacade
  interfaces/events   OwnerCreatedIntegrationEvent, TechnicianCreatedIntegrationEvent
  interfaces/rest     OwnerProfilesController, TechnicianProfilesController, DashboardConfigsController, authorization/ProfileAccessEvaluator + ProfileView
```

## Domain rules visible through the API

- RUC is an 11-digit number (`Ruc` value object; violation is `400 VALIDATION_ERROR` with the English domain message).
- Certification number: 3 to 50 letters, digits, `-`, `.` or `/`, starting with a letter or digit (`@Pattern` on `UpdateTechnicianResource`, message `must be 3 to 50 letters, digits, '-', '.' or '/', starting with a letter or digit`).
- A street number is optional; `street`, `city`, `postal_code`, `country` are required (`StreetAddress`).
- Email belongs to the platform account/profile and cannot be changed through `PUT` owner/technician.
- Address: `OwnerProfileResource` answers the composed `address` and its parts (`street`, `number`, `city`, `postal_code`, `country`), built from the same `StreetAddress` value object an update validates. `number` is optional.
- Versions: `Profile.version` (owner and technician profiles, one `@Version` on the root entity) and `DashboardConfig.version` (bumped by a forced increment on every save, because card changes live in child rows). `PUT /profiles/owners/{id}`, the dashboard layout, defaults and visibility endpoints check `If-Match` through `VersionPrecondition`.
- `/me` reads: `GET /profiles/owners/me` (`OWNER_ROLE`) and `GET /profiles/dashboard-configs/me` resolve the caller from the token through `ProfileAccessEvaluator.resolveOwnerProfile` and `resolveAccountId`, so no account identifier is threaded through the client.
- Session bootstrap: `GET /api/v1/me/context` (`SessionContextController`, `SessionContextQueryServiceImpl`) reads the account through `ExternalIamService.fetchAccountByUsername` (`IamContextFacade`), the profile and dashboard configuration from this context, and for an owner the site and unit counts through `ExternalAssetsService` (`AssetContextFacade.countSitesByOwner`, `countEquipmentByOwner`). It returns `Cache-Control: no-store` and never a token.
- A dashboard has exactly the four cards `MONITORED_EQUIPMENT`, `OPEN_ALERTS`, `ACTIVE_ORDERS`, `EQUIPMENT_STATUS` with positions 1 to N without gaps or repeats; an account has at most one configuration.

## Authorization model (`ProfileAccessEvaluator`)

`ProfileView` decides what a caller sees of someone else's profile: `FULL` (own profile), `CONTACT` (email and phone, for people with an active engagement), `PUBLIC` (name, speciality, certification), `NONE` (answered as `404`). Owner profile of another owner is never visible; a technician sees an owner's name, email and phone only during an active engagement. `PUT` methods use `isOwnerSelf` / `isTechnicianSelf`; dashboard endpoints use `isAccountSelf(userId)`.

## Internal data flow, `GET /api/v1/profiles/technicians/{technicianId}/public`

`TechnicianProfilesController.getTechnicianPublicProfile` (owner only) -> `TechnicianQueryService.handle(GetTechnicianByIdQuery)` -> `TechnicianQueryService.handle(GetTechnicianMetricsQuery)` -> `TechnicianPublicProfileResourceFromEntityAssembler` -> `TechnicianPublicProfileResource` (`average_rating` null and `rating_available` false until the first review). Metrics are written asynchronously by `TechnicianMetricsProjector`, which listens to `ServiceRequestCompletedIntegrationEvent`, `ReviewSubmittedIntegrationEvent` and `ReviewUpdatedIntegrationEvent` (outbox events from service.request).

## Interfaces

Controllers: `OwnerProfilesController` (4), `TechnicianProfilesController` (5), `DashboardConfigsController` (6). Note the technician list masks email/phone/address (`null`) unless the technician is actively assigned to the caller's requests. `GET /api/v1/profiles/owners` returns **only the caller's own** owner profile as a one-element list (or empty).

## Dependencies

Outbound: `ExternalIamService` (`fetchUserIdByUsername`, `existsUserById`), `ExternalServiceRequestService` (`hasActiveEngagementBetween`). Inbound: `ProfilesContextFacade` called by iam (registration, email lookup) and by assets, device, monitoring, notifications, reporting, service.request (resolving owner/technician profile ids).
