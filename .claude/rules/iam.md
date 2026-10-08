## Web authorization policy

The IceTrack web platform is owner-only.

| Role | Web access |
|---|---|
| `OWNER_ROLE` | Authorized to access owner routes and owner data |
| `TECHNICIAN_ROLE` | Not authorized to access the web platform; redirected to `iam/technician-redirect` |
| Missing/unknown role | Not authorized; follow safe unauthorized/login behavior |

A valid authenticated session does not grant access to the owner web platform without `OWNER_ROLE`.

## Post-authentication routing

After successful local login, Google OAuth login, token refresh, or startup session restoration:

1. Resolve the authenticated user and role from `IamStore`.
2. If the user has `OWNER_ROLE`, redirect to the owner dashboard or the originally requested owner route.
3. If the user has `TECHNICIAN_ROLE`, redirect to `iam/technician-redirect`.
4. If the role is missing, invalid, or unsupported, do not render protected content; follow the safe unauthorized/session-failure flow.

This routing decision must be centralized in an IAM role-routing guard, resolver, or application-level routing policy. Do not duplicate it in login components or feature views.

## Owner route guard

Every owner application route must enforce all of the following:

- Session restoration has resolved.
- The user is authenticated.
- The authenticated user has `OWNER_ROLE`.

Expected outcomes:

| Guard condition | Navigation outcome |
|---|---|
| Session is restoring | Wait/respect existing restoration strategy; do not render owner UI |
| No valid session | Redirect to login |
| Authenticated `OWNER_ROLE` | Allow requested owner route |
| Authenticated `TECHNICIAN_ROLE` | Redirect to `iam/technician-redirect` |
| Authenticated unsupported role | Redirect to unauthorized or sign out according to existing IAM policy |

Do not use only a generic `isAuthenticated()` guard for owner routes.

## Technician redirect route

The route belongs to IAM presentation:

```text
src/app/iam/presentation/views/technician-redirect/
```

Suggested route:

```text
iam/technician-redirect
```

Rules:

- The route requires an authenticated session.
- The route is allowed only for `TECHNICIAN_ROLE`.
- An owner navigating to this route is redirected to the owner dashboard.
- An unauthenticated user is redirected to login.
- The view uses `IamStore` only; it must not inject owner-context stores or APIs.
- The view must never render the owner app shell/sidebar/navigation.
- The view displays only approved, translated guidance, an approved QR code for the mobile app, and a sign-out action.
- The mobile distribution target must come from approved project configuration, not from a hardcoded ad-hoc URL.
- Do not expose access/refresh tokens, profile data, assignments, service requests, equipment, notifications, or dashboard metrics.
