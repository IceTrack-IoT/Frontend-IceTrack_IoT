# IceTrack Web Application Instructions

## Scope

This repository contains the Angular web application for IceTrack.
The web application is exclusively intended for authenticated business owners with the `OWNER_ROLE`.
The web application allows owners to manage refrigerated assets, monitoring devices, telemetry, alerts, service requests, service reviews, notifications, reports, and account/dashboard preferences.
Technicians may have a valid IceTrack account and may authenticate successfully, but they are not authorized to use the web platform.
When an authenticated user has `TECHNICIAN_ROLE`, the application must redirect the user to the IAM `technician-redirect` view. This view provides the QR code and instructions to access the mobile application. It must not expose owner data, navigation, dashboard modules, or any operational web feature.

Out of scope:
- SEO, public acquisition flows, and public content pages.
- ESP32 firmware.
- Edge API implementation.
- Local gateway UI or LAN-only technician tools.
- Hardware LED, buzzer, Wi-Fi, or physical device behavior.
- Backend implementation, cloud telemetry ingestion, and event processing internals.

Do not add code, routes, components, abstractions, or documentation for out-of-scope concerns unless explicitly requested.

## Project architecture

The Angular web application follows:

- Domain-Driven Design (DDD).
- Hexagonal Architecture.
- Bounded contexts.
- Standalone Angular components.
- Signals-based state management.
- Strict TypeScript.
- Lazy-loaded feature routes.
- Internationalization in English and Spanish.

Each bounded context follows this structure:

```text
src/app/<context>/
  domain/
  application/
  infrastructure/
  presentation/
```

Read `.claude/rules/architecture.md` before creating or modifying application code.

## Web bounded contexts

The web application uses these bounded contexts:

| Folder | Bounded Context | Web responsibility |
|---|---|---|
| `iam` | IAM | Registration, login, Google OAuth, session restoration, authorization, sign-out |
| `profiles` | Profiles and Preferences Management | Owner/technician profile data, language, dashboard card configuration, UI preferences |
| `assets` | Assets Management | Sites, refrigeration equipment, equipment metadata, thermal thresholds, maintenance-related asset data |
| `devices` | Device Management | Device pairing, paired-device state, credential rotation/revocation, device lifecycle visibility |
| `monitoring` | Monitoring and Alerting | Dashboard metrics, current/historical telemetry, equipment health, thermal/connectivity alerts, alert actions |
| `service-requests` | Service Request Management | Service request creation, filtering, assignment, cancellation, tracking, intervention history, reviews |
| `notifications` | Notifications | Notification center, unread count, mark as read, dismiss notifications |
| `reporting` | Reporting & Analytics | Report search/filtering, asynchronous generation status, report detail, file download |

`shared` contains only reusable, context-agnostic code.

Do not place business logic in `shared` merely because it is reused by one screen or one context.

## Before modifying code

Before implementing any task:

1. Identify the bounded context that owns the requirement.
2. Confirm that the requirement belongs to the web scope.
3. Inspect the relevant routes, components, store, use cases, contracts, ports, adapters, providers, translations, and tests.
4. Reuse the closest existing implementation pattern.
5. Identify the affected layers: domain, application, infrastructure, and/or presentation.
6. Implement the smallest coherent change that satisfies the user story.
7. Do not invent API contracts, domain states, permissions, or business rules that are not documented or already implemented.

Ask for clarification before implementation only if ambiguity changes:

- Context ownership.
- User authorization.
- API contract.
- Domain state transition.
- Data ownership.
- A requirement that could belong to mobile, Edge, backend, or web.

## User roles in web scope
### OWNER_ROLE

`OWNER_ROLE` is the only role authorized to access the IceTrack web platform.
Owners may access documented web capabilities:
- Dashboard and dashboard configuration.
- Sites and refrigeration equipment.
- Equipment temperature thresholds.
- Monitoring-device pairing and device credential lifecycle actions.
- Current and historical telemetry.
- Thermal and connectivity alerts.
- Service request creation, tracking, cancellation, and technician assignment.
- Technician profile consultation for assignment decisions.
- Equipment intervention history.
- Service reviews.
- Notification center.
- Reports, report generation status, and downloads.
- Language and user preferences.

### TECHNICIAN_ROLE
`TECHNICIAN_ROLE` users may authenticate, but they have no authorization to access owner web routes, components, data, or navigation.
After authentication or session restoration, a technician must be redirected to:

```text
iam/technician-redirect
```

The `technician-redirect` view must:
- Explain that field operations are available through the mobile application.
- Display the approved mobile-application QR code.
- Provide translated accessible instructions.
- Provide a sign-out action.
- Avoid rendering the owner shell, owner sidebar, owner dashboard, breadcrumbs, notifications, account data, asset data, service data, or any protected feature data.
- Not provide a bypass link to owner routes.
  The QR code may only link to the approved mobile distribution URL configured by the project. Do not hardcode an unapproved URL.

### Unknown or unsupported roles

If the role is absent, invalid, unknown, or unsupported:

- Do not render protected owner content.
- Follow the established safe unauthorized/session-failure behavior.
- Redirect to the appropriate unauthorized/login route or sign out according to the existing IAM contract.

## Role-based route access

The web platform must enforce role access at navigation time.

Rules:

- Every owner feature route requires an authenticated user with `OWNER_ROLE`.
- A valid session alone is insufficient for access to owner routes.
- `TECHNICIAN_ROLE` must be redirected to `iam/technician-redirect` from any attempted owner route.
- Apply role access checks in route guards, not only inside components.
- The root authenticated route must redirect owners to the owner dashboard and technicians to `iam/technician-redirect`.
- Session restoration must complete before the role-based navigation decision.
- Components must not duplicate guard logic or implement their own role redirects.
- Do not load owner feature data before owner authorization has been confirmed.
- The `technician-redirect` route is accessible only to authenticated technician users; owners accessing it should be redirected to the dashboard.
- Backend authorization remains authoritative. Frontend guards are required for user experience and route protection, not as a substitute for API authorization.

## Global rules

- Follow the dependency rules in `.claude/rules/architecture.md`.
- Follow UI rules in `.claude/rules/angular-web-ui.md`.
- Follow bounded-context ownership in `.claude/rules/bounded-contexts.md`.
- Follow shared-code rules in `.claude/rules/shared.md`.
- Follow testing rules in `.claude/rules/testing.md`.
- Follow IAM-specific rules only when touching IAM or authentication wiring.
- Follow real-time monitoring rules only when touching telemetry streaming, live dashboard updates, or alert subscriptions.
- Use only the Angular, TypeScript, and package versions pinned in `package.json`.
- Do not add, remove, or update dependencies without approval.
- Do not add Angular Material, third-party UI libraries, CSS frameworks, or Tailwind plugins without approval.
- Do not modify environment configuration, global providers, authentication behavior, or shared primitives unless the task requires it.
- Do not modify generated files.
- Do not use `any`; prefer `unknown` and narrow it safely.
- Do not make unrelated refactors.
- Do not create abstractions before a concrete reuse need exists.

## Internationalization

The web application supports:

- English: `en`
- Spanish: `es`

Translation files:

```text
public/assets/i18n/en.json
public/assets/i18n/es.json
```

Rules:

- Every user-facing string must be translated.
- Add every new translation key to both files in the same change.
- Do not hardcode visible copy, form labels, validation errors, buttons, placeholders, empty states, loading text, error messages, toast messages, dialogs, tooltips, titles, or ARIA labels.
- Keep translation keys organized by bounded context and feature.
- English is the fallback language.
- Preserve the project convention for Spanish locale naming. Do not introduce `es-419` unless the existing i18n configuration supports it.

## Completion report

At the end of an implementation task, report:

1. Files created or modified.
2. Bounded context and layers affected.
3. User story or web behavior implemented.
4. Relevant architectural decisions.
5. Validation commands actually executed and their result.
6. Tests added, updated, skipped, or not run.
7. Known limitations, assumptions, or pending backend dependencies.

Never claim validation or tests passed unless they were run successfully.
