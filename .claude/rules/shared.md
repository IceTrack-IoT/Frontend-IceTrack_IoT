---
paths:
  - "src/app/shared/**"
  - "src/app/**/*.ts"
  - "src/app/**/*.html"
  - "src/app/**/*.scss"
  - "src/app/**/*.css"
---

# Shared Code Rules

## Shared purpose

`src/app/shared/` contains only stable, reusable, cross-cutting building blocks.

Appropriate shared code includes:

- Base entity abstractions.
- Generic API base classes.
- Generic endpoint helpers.
- Generic API error utilities.
- Generic assemblers.
- Generic utility types.
- Common UI primitives.
- Application shell and layout.
- Navigation primitives.
- Icon primitives.
- Generic buttons.
- Generic dialogs.
- Generic empty/loading/error components.
- Generic table, pagination, and filter primitives.
- Language switcher.
- Styling tokens and shared visual utilities.

## What does not belong in shared

Do not add the following to `shared`:

- Equipment business rules.
- Site workflows.
- Device pairing behavior.
- Device credential logic.
- Telemetry models specific to monitoring.
- Alert lifecycle logic.
- Service request workflows.
- Technician assignment logic.
- Service review logic.
- Report generation flows.
- Notification business behavior.
- Authentication/session flows.
- Context-specific stores.
- Context-specific endpoints/adapters.
- Context-specific translations.
- A component used by only one feature.

If it belongs to one bounded context, keep it in that bounded context.

## Before adding shared code

Before creating a shared utility/component:

1. Search existing shared primitives.
2. Confirm it is used by at least two contexts or is an unambiguous cross-cutting concern.
3. Ensure it does not import context-specific domain, application, infrastructure, or presentation code.
4. Ensure its API is generic and stable.
5. Do not generalize a feature-specific component prematurely.

## Shared UI rules

Shared components:

- Must not inject context-specific stores.
- Must not import context infrastructure.
- Must not contain business decisions.
- Must receive data via inputs and emit user intent via outputs.
- Must support translations where they display user-facing text.
- Must meet accessibility requirements.
- Must remain responsive.
- Must not hardcode owner, technician, asset, device, alert, or report-specific behavior.

## Shared infrastructure rules

Shared infrastructure may provide generic helpers, but must not own business endpoint semantics.

Rules:

- Reuse base APIs/endpoints/assemblers when appropriate.
- Keep context-specific paths, resources, error codes, and request mapping within the owning context.
- Do not add context-specific conditionals to a shared base class.
- Prefer a context-local adapter over complicating shared code for a one-off requirement.
