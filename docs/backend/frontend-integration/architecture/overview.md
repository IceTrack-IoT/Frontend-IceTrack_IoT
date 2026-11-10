# Architecture overview

## Package layout (verified against the repository)

```text
pe.edu.upc.ice.track.platform
├── IceTrackPlatformApplication
├── shared/              kernel: ApplicationError/Result, GlobalExceptionHandler, ErrorResource, Jackson,
│                        i18n (Accept-Language en/es), transactional outbox, async executors, OpenAPI
├── iam/ profiles/ assets/ device/ monitoring/ notifications/ reporting/ service/request/
│   ├── application/
│   │   ├── commandservices/        public command service interfaces
│   │   ├── queryservices/          public query service interfaces
│   │   └── internal/
│   │       ├── commandservices/    *Impl classes
│   │       ├── queryservices/
│   │       ├── eventhandlers/      domain/integration event handlers, schedulers
│   │       └── outboundservices/
│   │           ├── acl/            ExternalService classes -> other contexts' Facades
│   │           └── <provider>/     ports to technical providers (geocoding, storage, push, tokens ...)
│   ├── domain/                     aggregates, entities, value objects, events, policies, repositories (interfaces)
│   ├── infrastructure/             JPA adapters, security config, provider adapters (Google, FCM, GCS)
│   └── interfaces/
│       ├── rest/ (controllers, resources, transform)
│       ├── acl/   inbound Facades (+ small result records)
│       └── events/ integration event records (published through the outbox)
```

`device`, `profiles`, `monitoring`, `service.request` also expose `interfaces/events`. Contexts without a given folder simply do not need it (for example `iam` has no `interfaces/events`).

## Layers

| Layer | Responsibility | Frontend relevance |
|---|---|---|
| Domain | Aggregates (`Equipment`, `Site`, `Device`, `ServiceRequest`, `Alert`, `Report`, ...), value objects (`TemperatureThreshold`, `Ruc`, `GeoLocation`), policies (`CoveragePolicy`, `PinDistancePolicy`), state machines (equipment status, device status, service status, alert status) | Defines the allowed state transitions the API answers with `409` |
| Application | Command services (writes) and query services (reads) return `Result<T, ApplicationError>` or `Optional`; event handlers; ExternalService classes | Defines which `ApplicationError.code` the client receives |
| Infrastructure | JPA persistence adapters, `WebSecurityConfiguration` and `EdgeSecurityConfiguration` (two security chains), JWT/refresh/Google token services, `GoogleMapsGeocodingAdapter`, `GcsReportFileStorage`, `FcmPushGateway`, SSE registry | Defines authentication behavior and third-party calls |
| Interfaces | Controllers, request/response record resources, assemblers (`*FromResourceAssembler`, `*FromEntityAssembler`, `ResponseEntityAssembler`, `ErrorResponseAssembler`), inbound Facades, integration events | The only layer a frontend sees |

## Generic request path

```text
HTTP request
  -> security filter chain  (edge chain by API key  OR  user chain: SignInRateLimitFilter -> BearerAuthorizationRequestFilter)
  -> @PreAuthorize (method security: role / "self" checks)
  -> Controller method           (Bean Validation on @Valid @RequestBody resource)
  -> *CommandFromResourceAssembler  (resource -> command / query)
  -> Command or Query service        (application)
       -> domain aggregate (rules, state machine)  -> Repository interface -> JPA adapter -> PostgreSQL
       -> ExternalService -> other context's Facade   (when ownership / lookups across contexts are needed)
       -> domain event published (Spring events) -> handlers -> outbox row (integration events)
  <- Result<T, ApplicationError>
  -> ResponseEntityAssembler.toResponseEntityFromResult(...)   (success -> status + resource, failure -> ErrorResponseAssembler)
HTTP response
```

Per-endpoint application services are listed in each `api/<context>/endpoints.md` ("Application flow") and per-context flows in `bounded-contexts/<context>.md`.

## Security chains

Two `SecurityFilterChain` beans, evaluated in order:

1. **Edge chain** (`device/infrastructure/authorization/EdgeSecurityConfiguration`, `@Order(1)`): matches `POST /api/v1/telemetry`, `POST /api/v1/telemetry/events` and `/api/v1/devices/me/**`. Requires authority `DEVICE_ROLE` obtained by `ApiKeyAuthenticationFilter` from the `X-API-Key` header. A failure is `401` with an **empty body**.
2. **User chain** (`iam/infrastructure/authorization/sfs/configuration/WebSecurityConfiguration`): CORS open, CSRF off, stateless. Public: `/api/v1/authentication/**` (except `/me`), `/error`, Swagger paths, and `GET /api/v1/telemetry/stream`. Everything else `authenticated()`. Role checks are `@PreAuthorize` on controller methods. A missing or invalid bearer token is `401` with the standard error body.

## Asynchronous behavior the frontend can observe

| Mechanism | Effect on the API |
|---|---|
| Report generation (`ReportGenerationWorker`, `@Async("reportTaskExecutor")` after commit) | `POST /api/v1/reports` answers `202` immediately; poll `GET /api/v1/reports/{id}` until `COMPLETED` or `FAILED` |
| Transactional outbox + `OutboxEventDispatcher` (every 2 s, at least once, max 10 attempts). Used only by the **Service Request** context (`ServiceRequestOutboxEventHandler`) | Effects of service-request changes on other contexts (assignment/rejection/cancellation notifications, technician metrics, equipment `config_version` bumps for edge grants) appear a few seconds after the originating call |
| In-process Spring integration events (monitoring, device, profiles) | Delivered synchronously inside the publisher's transaction, except listeners marked `@Async` / `@TransactionalEventListener(AFTER_COMMIT)` (maintenance-window notifications, SSE dispatch, push) |
| Notification push (`@Async` on `applicationTaskExecutor`) | FCM push after the notification row exists |
| SSE telemetry stream | Server pushes readings and alert status changes to owners |
| Schedulers | Refresh-token purge (daily 03:00), maintenance-window expiry sweep (every 60 s) |

## Read models

Technician statistics (`completed_services`, `average_rating`) are an asynchronous projection (`TechnicianMetricsProjector`) fed by service-request integration events, so they can lag a few seconds behind a completion or review.
