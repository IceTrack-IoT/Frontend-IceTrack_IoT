# IceTrack Platform - Frontend Integration Guide

Framework-agnostic documentation of the HTTP contract of the IceTrack backend, written for the teams building the **web application** (business owners) and the **mobile application** (field technicians). It describes the backend as implemented and was synchronized with the code after the latest remediation, which was verified with real HTTP requests against a locally running backend. Where the code and the product backlog disagree, the code is documented as the truth and the difference is listed in [diagnostics/BACKLOG_CROSSREFERENCE.md](diagnostics/BACKLOG_CROSSREFERENCE.md).

## 1. System overview

IceTrack monitors refrigeration units (display cases, cold rooms, refrigerators) with ESP32 boards that report to an on-site gateway, which forwards aggregated telemetry to this cloud API. The cloud API stores readings, raises thermal-excursion alerts, lets owners request maintenance or repair, lets technicians accept and complete that work, sends notifications, and generates reports.

| Channel | Who | Role in the token | Main capabilities |
|---|---|---|---|
| Web application | Business owner | `OWNER_ROLE` | Sites, equipment, devices, alerts, service requests, reviews, reports, dashboard, live telemetry stream |
| Mobile application | Field technician | `TECHNICIAN_ROLE` | Assignments, accept/reject/start, intervention report, equipment and telemetry reads, push token registration, edge grant |
| Edge gateway / IoT board | Device | `DEVICE_ROLE` (API key, not a user) | Telemetry ingestion, edge events, configuration polling. Documented because it shares the API, but it is not a frontend channel |

## 2. Technology stack (from `pom.xml`)

Java 26, Spring Boot 4.1.1 (Spring Framework 7, Jackson 3), Spring Security (stateless), Spring Data JPA with PostgreSQL, jjwt 0.13 (HS512 access tokens), Spring OAuth2 resource-server module (used only to validate Google ID tokens), springdoc OpenAPI 3.1.1, Google Cloud Storage client 2.75, Firebase Admin 9.5 (Cloud Messaging), OpenPDF and Apache POI (report rendering), ArchUnit (architecture test).

## 3. Architecture in one paragraph

Domain-Driven Design with Hexagonal Architecture. The code is split into **8 functional bounded contexts** under `pe.edu.upc.ice.track.platform.<context>` plus a `shared` kernel. Each context has `domain`, `application` (command and query services, event handlers, outbound services), `infrastructure` and `interfaces` (`rest`, `acl`, `events`). Contexts talk to each other through inbound **Facades** (`<ctx>/interfaces/acl`) called by **ExternalService** classes in the caller's `application/internal/outboundservices/acl`, and through **integration events**: in-process Spring events for most contexts, and for the Service Request context a transactional outbox delivered at least once by a scheduler. See [architecture/overview.md](architecture/overview.md) and [architecture/inter-context-communication.md](architecture/inter-context-communication.md).

## 4. Bounded context inventory

| Context | Package | Controllers | Endpoints | Document |
|---|---|---|---|---|
| Identity and Access Management | `iam` | `AuthenticationController`, `UsersController`, `RolesController` | 13 | [bounded-contexts/iam.md](bounded-contexts/iam.md), [api/iam/endpoints.md](api/iam/endpoints.md) |
| Profiles | `profiles` | `OwnerProfilesController`, `TechnicianProfilesController`, `DashboardConfigsController` | 15 | [bounded-contexts/profiles.md](bounded-contexts/profiles.md), [api/profiles/endpoints.md](api/profiles/endpoints.md) |
| Assets | `assets` | `EquipmentController`, `SiteController` | 13 | [bounded-contexts/assets.md](bounded-contexts/assets.md), [api/assets/endpoints.md](api/assets/endpoints.md) |
| Device Management | `device` | `DeviceController`, `EdgeConfigurationController` | 7 | [bounded-contexts/device.md](bounded-contexts/device.md), [api/device/endpoints.md](api/device/endpoints.md) |
| Monitoring and Alerting | `monitoring` | `AlertsController`, `AlertPoliciesController`, `TelemetryController`, `TelemetryStreamController`, `EdgeEventsController`, `MaintenanceWindowsController` | 13 | [bounded-contexts/monitoring.md](bounded-contexts/monitoring.md), [api/monitoring/endpoints.md](api/monitoring/endpoints.md) |
| Notifications | `notifications` | `NotificationsController`, `DeviceTokensController` | 7 | [bounded-contexts/notifications.md](bounded-contexts/notifications.md), [api/notifications/endpoints.md](api/notifications/endpoints.md) |
| Reporting | `reporting` | `ReportsController` | 3 | [bounded-contexts/reporting.md](bounded-contexts/reporting.md), [api/reporting/endpoints.md](api/reporting/endpoints.md) |
| Service Request Management | `service.request` | `ServiceRequestsController`, `InterventionsController`, `ReviewsController`, `EquipmentInterventionsController` | 14 | [bounded-contexts/service-request.md](bounded-contexts/service-request.md), [api/service-request/endpoints.md](api/service-request/endpoints.md) |
| **Total** | | **23 controllers** | **85** | [api/endpoint-inventory.md](api/endpoint-inventory.md) |

`shared` is a kernel (error contract, Jackson, i18n, outbox, async), not a context.

## 5. Base URL

- Local development: `http://localhost:8080` (`server.port` defaults to `8080`, overridable with `PORT`).
- The OpenAPI descriptor (`OpenApiConfiguration`) lists a production server `https://platform-icetrackiot-production.up.railway.app/`. That value is declared in source but was not verified against a running deployment; treat the production base URL as **a configuration value to confirm with the backend team**.
- All endpoints live under `/api/v1/...`. There is no context path.
- Swagger UI at `/swagger-ui.html` and the OpenAPI JSON at `/v3/api-docs` are public.

## 6. Authentication overview

| Mechanism | Used by | Header / parameter | Details |
|---|---|---|---|
| Bearer access token (JWT, HS512) | Web and mobile | `Authorization: Bearer <token>` | [security/authentication.md](security/authentication.md) |
| Opaque refresh token (single use, rotated) | Web and mobile | JSON body of `POST /api/v1/authentication/refresh-token` | same |
| Google ID token | Web and mobile sign-in | JSON body `id_token` | [integrations/google-oauth.md](integrations/google-oauth.md) |
| Telemetry stream ticket | Web live dashboard | `?ticket=` on the SSE URL | [integrations/telemetry-sse.md](integrations/telemetry-sse.md) |
| Device API key | IoT gateway | `X-API-Key` | [bounded-contexts/device.md](bounded-contexts/device.md) |

Sign-in endpoints take a `channel` (`WEB` for owners, `MOBILE` for technicians). Valid credentials on the wrong channel are rejected with `403 ROLE_CHANNEL_MISMATCH` and no token is issued.

## 7. Conventions that apply everywhere

| Topic | Rule |
|---|---|
| Endpoint paths | `kebab-case` under `/api/v1`. Path variables are Java camelCase names but only appear as `{value}` placeholders (for example `{equipmentId}`); they do not affect the URL. |
| JSON property names | `snake_case` for every request and response (Jackson `SNAKE_CASE`). Verified by serializing the compiled `NotificationResource` (`is_read`) and `DashboardCardResource` (`is_visible`). |
| Enum values | Upper snake case strings, sent and received verbatim (`IN_PROGRESS`). Unknown values are rejected with `400`. |
| Identifiers | Numeric (`int64`). Only device telemetry identifiers (`reading_uid`, `event_uid`, `client_generated_id`) are UUIDs, generated by the client for idempotency. |
| Timestamps | Every moment is an ISO 8601 instant in UTC with a trailing `Z`. Request bodies and query parameters must carry `Z` or an explicit offset; zone-less values and numbers are rejected with `400`. See [guides/frontend-conventions.md](guides/frontend-conventions.md). |
| Errors | `{ "code", "message", "details" }`: `code` and `message` are always present, `details` may be absent. A few special shapes exist; see [errors/error-contract.md](errors/error-contract.md). |
| Language | `Accept-Language` is honored for `en` (default) and `es`; it localizes the error `message`. |
| CORS | All origins, methods GET/POST/PUT/PATCH/DELETE, all request headers. No response header is exposed to browsers. |

## 8. Documentation map

| Area | Where |
|---|---|
| Architecture | [architecture/overview.md](architecture/overview.md), [architecture/inter-context-communication.md](architecture/inter-context-communication.md) |
| One document per bounded context | [bounded-contexts/](bounded-contexts/) |
| Endpoint catalog (per context, with full HTTP contract) | `api/<context>/endpoints.md`; consolidated: [api/endpoint-inventory.md](api/endpoint-inventory.md); by role: [api/role-access-matrix.md](api/role-access-matrix.md) |
| Request / response contracts | `api/<context>/contracts.md` (property tables) and `api/<context>/requests/*.json`, `api/<context>/responses/*.json`, `api/<context>/nested/*.json` (examples). Enumerations: [api/enums.md](api/enums.md) |
| JSON Schemas | [schemas/](schemas/) (one `<Resource>.schema.json` per record, grouped by context) |
| Security | [security/authentication.md](security/authentication.md), [security/security-reference.md](security/security-reference.md) |
| Third-party integrations | [integrations/](integrations/): Google OAuth, Google Maps, Google Cloud Storage, Firebase Cloud Messaging, telemetry SSE |
| Sequence diagrams | [flows/sequence-diagrams.md](flows/sequence-diagrams.md) |
| Errors | [errors/error-contract.md](errors/error-contract.md) |
| Frontend guidance | [guides/frontend-conventions.md](guides/frontend-conventions.md), [guides/web-owner-guide.md](guides/web-owner-guide.md), [guides/mobile-technician-guide.md](guides/mobile-technician-guide.md) |
| Diagnostics | [diagnostics/BACKLOG_CROSSREFERENCE.md](diagnostics/BACKLOG_CROSSREFERENCE.md), [diagnostics/KNOWN_LIMITATIONS.md](diagnostics/KNOWN_LIMITATIONS.md) |

## 9. How this documentation was produced

The endpoint tables, property tables, JSON examples and JSON Schemas were generated by a script that parses the controllers (`@RequestMapping`, `@*Mapping`, `@PreAuthorize`, `@RequestParam`, `@PathVariable`, `@RequestBody`, `@ApiResponse`) and the REST resource records (Bean Validation annotations and `@Schema` examples) under `interfaces/rest`. JSON examples come from the `@Schema(example = ...)` text in the resource classes, so they show the intended shape, not live data. Narrative documents were written from the application services, security configuration, facades, adapters and event handlers. The two behaviors that depend on library defaults were checked by running small programs against the already-compiled classes and the Spring and Jackson jars in the local Maven cache: JSON property naming of `is_*` record components, and parsing of `LocalDateTime` query parameters.

Runtime verification: the application was later started locally (Java 26, `dev` profile, disposable PostgreSQL database) and 81 of the 85 endpoints were exercised with real HTTP requests in end-to-end workflows (accounts, sites, equipment, device pairing, edge telemetry and events, alerts, maintenance windows, service request lifecycle, notifications, dashboard, reports). Response bodies were compared with the JSON Schemas in [schemas/](schemas/). The four Google sign-in endpoints were not re-tested (validated separately by the team). Google Cloud Storage uploads and signed downloads and Firebase Cloud Messaging submission were exercised against the real providers; edge traffic came from an HTTP client simulating the gateway. Authorization rules, asynchronous timing and the database design were not part of this verification.
