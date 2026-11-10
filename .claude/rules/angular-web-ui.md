---
paths:
  - "src/app/**/presentation/**/*.ts"
  - "src/app/**/presentation/**/*.html"
  - "src/app/**/presentation/**/*.scss"
  - "src/app/**/presentation/**/*.css"
  - "src/app/shared/presentation/**/*.ts"
  - "src/app/shared/presentation/**/*.html"
  - "src/app/shared/presentation/**/*.scss"
  - "src/app/shared/presentation/**/*.css"
---

# IceTrack Angular Web UI Rules

## Angular conventions

- Use the Angular version pinned in `package.json`.
- Use standalone components.
- Do not add `standalone: true` unless the installed Angular version or project conventions require it.
- Use `inject()` instead of constructor injection.
- Use `input()` and `output()` instead of `@Input()` and `@Output()`.
- Use signals for local state.
- Use `computed()` for derived state.
- Use `effect()` only to synchronize with an imperative external concern.
- Do not use `signal.mutate()`; use `set()` or `update()`.
- Use native control flow: `@if`, `@for`, and `@switch`.
- Use a stable `track` expression in `@for` loops.
- Use typed Reactive Forms.
- Do not use template-driven forms.
- Do not use `ngClass`; use class bindings.
- Do not use `ngStyle`; use style bindings.
- Do not use `@HostBinding` or `@HostListener`; define host behavior through the `host` metadata object.
- Use `NgOptimizedImage` for applicable static images.
- Use the `async` pipe when an observable is rendered directly in a template.

## Web-only UX

Build for the authenticated IceTrack web platform.

Do not create UI for:

- Landing page content.
- Marketing sections.
- Download-mobile-app prompts.
- Mobile-only workflows.
- Offline mobile queues.
- Mobile push-notification registration.
- Edge gateway diagnostics.
- ESP32 installation/configuration flows.
- Local network-only device tools.

Technician field execution belongs to the mobile application and is out of scope for web UI unless explicitly requested.

## Component responsibilities

Views:

- Compose a feature screen.
- Read state from application stores.
- Trigger store actions.
- Own route-level layout and view composition.

Components:

- Render focused UI elements.
- Receive data through `input()`.
- Emit user intent through `output()`.
- Remain independent of infrastructure.
- Avoid business orchestration.
- Avoid direct route-authorization decisions.

Do not inject APIs, endpoints, `HttpClient`, storage adapters, or streaming adapters in a component.

## Mandatory UI states

Every data-loading view or section must support relevant states:

- Loading.
- Error.
- Empty.
- Populated/success.
- Submitting or pending mutation.
- Disabled action, where applicable.
- Unauthorized or unavailable state, where applicable.

Do not render blank content while an asynchronous result is unresolved.

Use existing shared components and patterns before creating new primitives for:

- Layout.
- Navigation.
- Icons.
- Buttons.
- Tables.
- Cards.
- Forms.
- Loaders.
- Empty states.
- Inline errors.
- Toasts.
- Confirmation dialogs.
- Pagination.
- Filters.

## Responsive design

The web platform must work on:

- Small laptop screens.
- Desktop screens.
- Large desktop screens.
- Narrow browser windows.

Rules:

- Use responsive layouts; do not assume a fixed desktop width.
- Do not rely on hover-only actions.
- Preserve usable touch targets for touch-enabled laptops/tablets.
- Provide a responsive strategy for wide data tables.
- Prefer CSS media/container queries over JavaScript viewport checks.
- Avoid horizontal page overflow.
- Keep critical actions visible without hover.

## Accessibility

Target WCAG 2.1 AA or better.

Rules:

- Use semantic HTML first.
- Use one meaningful page-level `h1`.
- Preserve a logical heading hierarchy.
- Every form field needs a visible label or accessible name.
- Associate validation errors with inputs.
- Use buttons for actions and links for navigation.
- Keep keyboard navigation and visible focus intact.
- Preserve logical tab order.
- Do not use color as the only status indicator.
- Maintain sufficient contrast.
- Provide accessible text alternatives for meaningful images/icons.
- Mark decorative graphics appropriately.
- Use `aria-live` carefully for asynchronous errors and status changes.
- Manage focus for dialogs and significant route-level state changes.
- Do not introduce known AXE or WCAG AA violations.

## Styles

- Follow the existing styling system.
- Reuse established design tokens, spacing, typography, colors, and breakpoints.
- Scope feature styles to components.
- Do not create global feature styles without an explicit need.
- Avoid `!important`.
- Avoid deep selector nesting.
- Avoid brittle selectors based on DOM structure.
