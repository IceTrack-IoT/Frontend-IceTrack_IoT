# IceTrack Web Frontend Architecture

## Architecture model

The Angular web application follows Domain-Driven Design and Hexagonal Architecture per bounded context.

```text
src/app/<context>/
  domain/
  application/
  infrastructure/
  presentation/
```

The goal is to isolate business concepts from Angular, HTTP, browser APIs, streaming transports, and UI details.

## Layer responsibilities

### Domain

Domain contains pure business concepts:

```text
entities
value objects
domain enums
domain errors
pure state transition rules
pure validation
```

Examples:

```text
Equipment
TemperatureThreshold
MonitoringAlert
ServiceRequest
ServiceRequestStatus
Review
DashboardCardConfiguration
```

Domain must not contain Angular, RxJS, browser, HTTP, API resource, or UI code.

### Application

Application coordinates capabilities with ports.

```text
contracts
ports
use-cases
state
stores
```

Examples:

```text
GetEquipmentListUseCase
UpdateEquipmentThresholdUseCase
PairDeviceUseCase
GetDashboardMetricsUseCase
SubscribeToTelemetryUseCase
AcknowledgeAlertUseCase
CreateServiceRequestUseCase
GenerateReportUseCase
```

Application must depend on ports and domain contracts, not concrete API adapters.

### Infrastructure

Infrastructure integrates with external systems:

```text
HTTP adapters
endpoint classes
request/response DTOs
assemblers
streaming adapters
browser storage
SDKs
provider wiring
interceptors
```

Infrastructure maps transport data into domain/application data and maps errors into safe application errors.

### Presentation

Presentation renders the web platform:

```text
routes
views
components
forms
view models
interaction logic
```

Presentation injects stores and uses application contracts. It must not inject `HttpClient`, endpoint classes, API adapters, or storage adapters.

## Dependency direction

```text
Domain -> nothing
Application -> Domain
Infrastructure -> Domain + Application
Presentation -> Application + Shared presentation
```

## Standard read flow

```text
Lazy route
  -> View
  -> Store
  -> Use case
  -> Application port
  -> Infrastructure adapter
  -> HTTP or stream transport
  -> Assembler
  -> Domain model/application output
  -> Store signal update
  -> Template render
```

## Standard mutation flow

```text
User interaction
  -> Typed Reactive Form or component event
  -> Store action
  -> Use case
  -> Application port
  -> Infrastructure adapter
  -> Backend API
  -> Result/error mapping
  -> Store state update
  -> Translated UI feedback
```

## Live telemetry flow

```text
Monitoring view opens
  -> Store loads initial dashboard/telemetry state through use case
  -> Monitoring infrastructure stream adapter connects when supported
  -> Adapter maps incoming event to application/domain-safe event
  -> Store updates relevant signals
  -> Dashboard/chart/alert UI rerenders
```

The stream is not a substitute for initial loading or backend-authoritative state.

## Store conventions

Stores expose UI-ready state.

Recommended state:

```text
data
selectedItem
loading
submitting
error
errorCode
lastUpdatedAt
```

Stores must:

- Use private writable signals.
- Expose readonly signals.
- Use `computed()` for derived selectors.
- Delegate asynchronous work to use cases.
- Not directly use `HttpClient`.
- Not directly access browser storage.
- Use `set()` and `update()`, not `mutate()`.

## Error handling

| Layer | Responsibility |
|---|---|
| Infrastructure | Map raw HTTP, streaming, SDK, and backend errors to safe application errors |
| Application | Coordinate operation result and state transitions |
| Store | Expose structured failure/loading/success state |
| Presentation | Render translated, safe, accessible feedback |

Do not render raw backend error payloads in the UI.

## Route conventions

- Routes belong to the owning context presentation layer.
- Feature routes are lazy-loaded.
- Protected routes follow IAM guard conventions.
- Components do not decide authorization redirects.
- Public routes are limited to approved IAM authentication routes.
- The landing page is outside this application.

## UI conventions

Every web screen must account for:

- Loading.
- Empty data.
- Errors.
- Populated data.
- Pending mutations.
- Responsive viewport behavior.
- Keyboard interaction.
- WCAG AA accessibility.
- English and Spanish translations.

## Sensitive data

The frontend must treat the following as sensitive:

- Passwords.
- Access tokens.
- Refresh tokens.
- Google ID tokens.
- Device API keys/credentials.
- Personal contact details where applicable.

Rules:

- Do not log sensitive values.
- Do not persist device API keys in browser storage.
- Do not expose tokens in UI, route parameters, error messages, or analytics.
- Follow IAM storage/interceptor patterns for session credentials.
- Display newly rotated device credentials only according to the backend contract and only when needed.
