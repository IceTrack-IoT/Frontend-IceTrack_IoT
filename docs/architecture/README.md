# IceTrack Web Application Architecture

This directory documents only the Angular web application architecture.

## Documents

| Document | Purpose |
|---|---|
| `frontend-web-scope.md` | Web feature scope mapped to documented user stories |
| `bounded-contexts.md` | Ownership and integration boundaries of web bounded contexts |
| `frontend-architecture.md` | DDD, Hexagonal Architecture, dependency direction, layers, and data flow |
| `iam-reference.md` | Web authentication, Google OAuth, session lifecycle, guards, and protected routes |
| `realtime-monitoring.md` | Dashboard telemetry, streaming, alerts, and corrective-service handoff |

## Architecture principles

1. Bounded contexts own their business capability.
2. Domain logic stays pure and framework-independent.
3. Application code depends on ports, not infrastructure implementations.
4. Infrastructure owns HTTP, streaming, browser APIs, and external integration details.
5. Presentation consumes stores and must not access infrastructure directly.
6. The web application does not implement mobile, Edge, hardware, landing page, or backend responsibilities.
7. The UI is translated, accessible, responsive, and resilient to loading/error/empty states.
8. Shared code stays generic and cross-cutting.
