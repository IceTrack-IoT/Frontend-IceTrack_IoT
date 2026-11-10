# IceTrack Web Application Instructions

## Scope

This repository is the Angular web application for IceTrack. It serves authenticated business owners (`OWNER_ROLE`) who manage refrigerated assets, monitoring devices, telemetry, alerts, service requests, reviews, notifications, reports, and account/dashboard preferences.

`TECHNICIAN_ROLE` users may authenticate but have no web authorization. They are redirected to the IAM `technician-redirect` view (mobile-app QR code, instructions, sign-out) and must never see the owner shell, navigation, or owner data.

Out of scope — do not add code, routes, components, abstractions, or documentation for: SEO/public pages, ESP32 firmware, Edge API, local gateway UI or LAN-only tools, hardware behavior, backend implementation, telemetry ingestion, or event-processing internals.

## Architecture

DDD and Hexagonal Architecture per bounded context, standalone components, signals, strict TypeScript, lazy feature routes, `en`/`es` i18n.

```text
src/app/<context>/{domain,application,infrastructure,presentation}
```

| Topic | Source of truth |
|---|---|
| Layers, dependencies, naming | `.claude/rules/architecture.md` |
| UI, accessibility, responsive behavior | `.claude/rules/angular-web-ui.md` |
| Shared code | `.claude/rules/shared.md` |
| Flows, stores, errors, sensitive data | `docs/frontend/architecture/frontend-architecture.md` |

## Web bounded contexts

| Folder | Bounded context | Web responsibility |
|---|---|---|
| `iam` | IAM | Registration, login, Google OAuth, session restoration, role routing, sign-out |
| `profiles` | Profiles and Preferences | Owner/technician profile, language, dashboard card configuration, UI preferences |
| `assets` | Assets | Sites, refrigeration equipment, metadata, thermal thresholds |
| `devices` | Device Management | Pairing, paired-device state, credential rotation/revocation |
| `monitoring` | Monitoring and Alerting | Dashboard metrics, current/historical telemetry, equipment health, alerts, alert actions |
| `service-requests` | Service Requests | Creation, filtering, assignment, cancellation, tracking, intervention history, reviews |
| `notifications` | Notifications | Notification center, unread count, mark as read, dismiss |
| `reporting` | Reporting and Analytics | Search/filtering, async generation status, detail, file download |

`shared` contains only reusable, context-agnostic code. Business logic never moves to `shared` because a single screen or context reuses it.

## Before modifying code

1. Identify the owning bounded context and confirm the requirement is in web scope.
2. Inspect the existing routes, views, components, stores, use cases, contracts, ports, adapters, providers, translations, and tests.
3. Reuse the closest existing pattern and change the fewest layers needed.
4. Do not invent API contracts, domain states, permissions, or business rules.

Ask for clarification when ambiguity changes context ownership, authorization, API contracts, domain state transitions, data ownership, or the web/mobile/Edge/backend split.

## Role-based route access

- Every owner route requires an authenticated `OWNER_ROLE`; a valid session alone is not enough.
- Enforce role checks in route guards, not only inside components, and only after session restoration resolves.
- `TECHNICIAN_ROLE` attempting any owner route is redirected to `iam/technician-redirect`.
- The root authenticated route sends owners to the owner dashboard and technicians to `iam/technician-redirect`.
- `iam/technician-redirect` allows only technicians; owners are sent to the dashboard.
- No owner feature data loads before owner authorization is confirmed.
- Backend authorization remains authoritative; guards protect UX and routes, not the API.

## Global rules

- Use only the Angular, TypeScript, and package versions pinned in `package.json`.
- Add, remove, or update dependencies, Angular Material, UI libraries, CSS frameworks, or Tailwind plugins only with approval.
- Do not modify environment configuration, global providers, authentication behavior, or shared primitives unless the task requires it.
- Do not modify generated files.
- Do not use `any`; prefer `unknown` and narrow it safely.
- Do not make unrelated refactors or create abstractions before a concrete reuse need exists.

## Internationalization

- English (`en`, fallback) and Spanish (`es`), in `public/assets/i18n/en.json` and `public/assets/i18n/es.json`.
- Every user-facing string is translated and added to both files in the same change: copy, labels, validation errors, buttons, placeholders, empty/loading/error states, toasts, dialogs, tooltips, titles, and ARIA labels.
- Keys are organized by bounded context and feature.
- Keep the existing Spanish locale naming; do not introduce `es-419` unless the i18n configuration supports it.

## Completion report

Report: files created or modified; bounded context and layers affected; behavior implemented; architectural decisions; validation commands actually executed with results; tests added, updated, skipped, or not run; known limitations, assumptions, or pending backend dependencies. Never claim validation or tests passed unless they were run successfully.
