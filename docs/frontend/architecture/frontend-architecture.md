# IceTrack Web Frontend Architecture

Layering and dependency rules are normative in `.claude/rules/architecture.md`. This document covers runtime flows and client state conventions.

## Layer summary

| Layer | Owns | Examples |
|---|---|---|
| `domain/` | Entities, value objects, enums, domain errors, pure validation and transition rules | `Equipment`, `TemperatureThreshold`, `MonitoringAlert`, `ServiceRequest`, `ServiceRequestStatus`, `Review`, `DashboardCardConfiguration` |
| `application/` | Contracts, ports, use cases, stores | `RegisterEquipmentUseCase`, `UpdateEquipmentThresholdUseCase`, `PairDeviceUseCase`, `GetDashboardMetricsUseCase`, `SubscribeToTelemetryUseCase`, `AcknowledgeAlertUseCase`, `CreateServiceRequestUseCase`, `GenerateReportUseCase` |
| `infrastructure/` | HTTP and stream adapters, resource DTOs, assemblers, storage, SDKs, interceptors, provider wiring | maps transport data into domain/application models and backend errors into safe application errors |
| `presentation/` | Routes, views, components, forms, view models, interaction logic | reads stores and application contracts only |

## Standard read flow

```text
Lazy route -> View -> Store -> Use case -> Application port
  -> Infrastructure adapter -> HTTP or stream transport -> Assembler
  -> Domain/application model -> Store signal update -> Template render
```

## Standard mutation flow

```text
User interaction -> Typed reactive form or component event -> Store action
  -> Use case -> Application port -> Infrastructure adapter -> Backend API
  -> Result/error mapping -> Store state update -> Translated UI feedback
```

## Store state

Stores expose UI-ready readonly signals and delegate asynchronous work to use cases.

Recommended shape: `data`, `selectedItem`, `loading`, `submitting`, `error`, `errorCode`, `lastUpdatedAt`. Derived values use `computed()`; writes use `set()`/`update()`.

Live telemetry reconciliation is described in `realtime-monitoring.md`.

## Error handling

| Layer | Responsibility |
|---|---|
| Infrastructure | Map raw HTTP, streaming, SDK, and backend errors to safe application errors |
| Application | Coordinate operation results and state transitions |
| Store | Expose structured failure/loading/success state |
| Presentation | Render translated, safe, accessible feedback |

Do not render raw backend error payloads.

## Route conventions

- Routes belong to the owning context's `presentation/` layer and feature routes are lazy-loaded.
- Public routes are limited to approved IAM authentication routes; the landing page is outside this application.

## Sensitive data

Treat passwords, access and refresh tokens, Google ID tokens, device API keys/credentials, and personal contact details as sensitive.

- Never log sensitive values, render tokens, put tokens in route parameters, or send them to analytics.
- Never persist device API keys in browser storage; session credentials follow the IAM storage/interceptor pattern.
- Display a newly rotated device credential only per the backend contract, once, and never after navigation, refresh, or state reset.

Screen states, responsiveness, keyboard support, WCAG 2.1 AA, and copy rules are normative in `.claude/rules/angular-web-ui.md` and `CLAUDE.md`.
