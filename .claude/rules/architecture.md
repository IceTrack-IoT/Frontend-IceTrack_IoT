---
paths:
  - "src/app/**/*.ts"
  - "src/app/**/*.html"
  - "src/app/**/*.scss"
  - "src/app/**/*.css"
---

# IceTrack Web Architecture Rules

## Required context structure

Every bounded context must follow this structure:

```text
src/app/<context>/
  domain/
  application/
  infrastructure/
  presentation/
```

The four layers have separate responsibilities.

| Layer | Responsibility | Allowed dependencies |
|---|---|---|
| `domain/` | Entities, value objects, domain rules, domain types | Pure TypeScript only |
| `application/` | Use cases, application contracts, abstract ports, signal stores | Domain and application code |
| `infrastructure/` | HTTP adapters, streaming adapters, browser storage, SDKs, assemblers, provider wiring | Domain, application, framework/external APIs |
| `presentation/` | Routes, views, components, forms, interaction behavior | Application and shared presentation code |

## Dependency direction

```text
Domain -> nothing
Application -> Domain
Infrastructure -> Domain + Application
Presentation -> Application + Shared presentation
```

This direction is non-negotiable.

## Domain rules

Files inside `domain/` must be pure TypeScript.

Domain must not import:

- `@angular/*`
- `rxjs`
- `HttpClient`
- Browser APIs
- `window`
- `document`
- `localStorage`
- `sessionStorage`
- Infrastructure code
- Presentation code
- HTTP types
- API request/response resources

Domain may contain:

- Entities.
- Value objects.
- Enumerations.
- Pure validation rules.
- Domain errors.
- Domain calculations.
- State transition invariants.

## Application rules

Application coordinates domain behavior through ports.

Application may contain:

```text
application/contracts/
application/ports/
application/use-cases/
application/state/
```

Application must not import:

- `@angular/common/http`
- `HttpClient`
- Concrete infrastructure adapters.
- Endpoint classes.
- Browser APIs.
- Storage implementations.
- Streaming SDK implementations.
- Presentation components or routes.

Rules:

- Use cases depend on abstract ports and contracts.
- Each use case has one `execute(...)` method.
- Use cases do not contain UI logic.
- Use cases must not know HTTP request/response types.
- Ports are abstract classes so they can be used as Angular DI tokens.
- Contracts are framework-independent input/output DTOs.
- Stores own UI-facing state and delegate side effects to use cases.
- Stores use signals and expose readonly state and computed selectors.
- Stores do not inject `HttpClient`, API adapters, endpoints, browser storage, or SDKs.
- Use `set()` and `update()` for signals. Never use `mutate()`.

## Infrastructure rules

Infrastructure implements application ports and owns external integration details.

Infrastructure owns:

- `HttpClient`.
- HTTP endpoint classes.
- API URL configuration.
- Request and response resource types.
- HTTP query parameter serialization.
- Streaming/SSE/WebSocket adapters, if used by the project.
- Browser APIs and browser storage.
- External SDKs.
- HTTP interceptors.
- API response mapping.
- Backend error mapping.
- Angular provider wiring.

Rules:

- Infrastructure implements application ports.
- Do not expose HTTP request/response DTOs to application or presentation.
- Use assemblers/mappers to translate API resources to domain/application models.
- Map backend errors to safe application errors.
- Read endpoint URLs from configured environment values or established endpoint configuration.
- Do not hardcode base URLs in components, stores, use cases, or templates.
- Register context dependencies through `provide<Context>()` functions when that is the established project pattern.
- Infrastructure must not depend on presentation components, templates, or routes.

## Presentation rules

Presentation includes:

```text
presentation/<context>.routes.ts
presentation/views/
presentation/components/
```

Rules:

- Views interact with application stores.
- Components use inputs, outputs, and presentation-level state.
- Components must not inject `HttpClient`.
- Components must not inject concrete API adapters or endpoint classes.
- Components must not access browser storage directly.
- Components must not map raw backend errors.
- Components must not contain domain orchestration.
- Use cases own application operations; stores coordinate state; components render and collect user intent.
- Feature routes remain lazy-loaded unless an explicit project exception exists.

## Naming conventions

Use names that express the business capability and architectural role.

Good examples:

```text
RegisterEquipmentUseCase
UpdateEquipmentThresholdUseCase
EquipmentPort
EquipmentApi
EquipmentAssembler
EquipmentStore
EquipmentListView
EquipmentThresholdFormComponent
AcknowledgeAlertUseCase
AlertTimelineComponent
GenerateThermalExcursionReportUseCase
```

Avoid vague names:

```text
Manager
Handler
Helper
Utils
DataService
ApiService
CommonService
GeneralStore
```
