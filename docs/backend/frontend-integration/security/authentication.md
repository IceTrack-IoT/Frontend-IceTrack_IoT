# Authentication and authorization

Sources: `iam/interfaces/rest/AuthenticationController`, `iam/application/internal/commandservices/UserCommandServiceImpl`, `iam/infrastructure/tokens/**`, `iam/infrastructure/authorization/sfs/**`, `iam/infrastructure/security/SignInRateLimitFilter`, `device/infrastructure/authorization/**`, `application.properties`.

## 1. Required headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
```

`Authorization` is only needed outside `/api/v1/authentication/**` (except `GET /api/v1/authentication/me`, which needs it). The scheme must be exactly `Bearer ` (capital B, one space); anything else is treated as no token.

## 2. Tokens

| Token | Format | Lifetime | Where it comes from | Where it goes |
|---|---|---|---|---|
| Access token | JWT signed HS512. Claims: `sub` = username, `iat`, `exp`, `role` (`OWNER_ROLE` or `TECHNICIAN_ROLE`). No other claims | `JWT_EXPIRATION_MINUTES`, default **30 min** | Response property **`token`** (not `access_token`) | `Authorization: Bearer` |
| Refresh token | Opaque random string, stored server-side only as a SHA-256 digest | `REFRESH_TOKEN_EXPIRATION_DAYS`, default **7 days**, single use (rotated on every refresh) | Response property **`refresh_token`** | Body of `POST /api/v1/authentication/refresh-token` and `/logout` |

Facts the frontend must respect:

- The access token is validated statelessly and **cannot be revoked** before it expires. `logout` only revokes the refresh token; discard the access token on the client.
- The backend does not trust the `role` claim. On every request it reloads the account by `sub` and takes authorities from the database. The frontend may read `role` for UI routing, but the response body property `role` (and `GET /api/v1/authentication/me`) is the supported source.
- Do not log, persist in `localStorage`/cookies without protection, or put tokens in URLs. The only credential allowed in a URL is the short-lived stream ticket (see [telemetry-sse](../integrations/telemetry-sse.md)).
- Web: keep the access token in memory and the refresh token in the most protected storage you have. Mobile: use the OS secure store (Keychain / Keystore). The backend sets no cookies.

### Authenticated user response

Every sign-in, Google exchange and refresh returns `AuthenticatedUserResource` ([contract](../api/iam/contracts.md)):

```json
{
  "id": 1,
  "username": "john.doe",
  "role": "OWNER_ROLE",
  "provider": "LOCAL",
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "refresh_token": "x6Kx3Jm0m3o6bRz9P4lXg0f1a2Y8sQ7cV5nT1wE9rU4"
}
```

`id` is the **user account id**, not the owner or technician profile id. Profile ids are different numbers (see `GET /api/v1/profiles/owners/user/{userId}` and `.../technicians/user/{userId}`); owner and technician profile ids are what other resources reference (`owner_id`, `technician_id`, `technician_profile_id`).

## 3. Username and password sign-in

`POST /api/v1/authentication/sign-in/local` with `{ "username", "password", "channel" }`.

- `username` may be the username **or the profile email** (case-insensitive when it contains `@`).
- `channel`: `WEB` admits only `OWNER_ROLE`; `MOBILE` admits only `TECHNICIAN_ROLE`.
- Unknown account and wrong password are indistinguishable: `401 BAD_CREDENTIALS`, same response time (the code hashes a dummy password for unknown accounts).
- Accounts created through Google have no local password and also answer `401 BAD_CREDENTIALS` here.
- Wrong channel: `403 ROLE_CHANNEL_MISMATCH`, with `details` such as `This account must sign in through the mobile application`.
- No token is issued on any failure.

Registration: `POST /api/v1/authentication/sign-up/owner` (creates the account with `OWNER_ROLE` and the owner profile including `ruc`) or `/sign-up/technician` (`TECHNICIAN_ROLE`, `speciality`, `certification_number`). The role is implied by the path and never sent. The response is `201 UserResource` **without tokens**; sign in afterwards. Conflicts (username or email taken) are `409 USER_CONFLICT`; a profile rule violation is `400 VALIDATION_ERROR` or `409 PROFILE_CONFLICT`. Local sign-up enforces a password policy: 8 to 64 characters with at least one uppercase letter, one lowercase letter and one digit; otherwise `400 VALIDATION_ERROR` with `Field password: must be 8 to 64 characters with at least one uppercase letter, one lowercase letter and one digit`. Mirror the rule in the form for immediate feedback. Accounts created before the policy keep their passwords; sign-in does not check the policy.

## 4. Refresh flow

`POST /api/v1/authentication/refresh-token` with `{ "refresh_token", "channel"? }`. `channel` is optional; if sent it must equal the channel the session was opened with, otherwise `403 ROLE_CHANNEL_MISMATCH` and the presented token stays valid.

The call is anonymous (the access token may already be expired). It returns a new `AuthenticatedUserResource`; **store the new `refresh_token` immediately**, the old one is now spent.

Rejections are `401` with this body (`AuthErrorResource`, different from the standard error body):

```json
{ "timestamp": "2026-10-01T12:00:00Z", "status": 401, "error": "Unauthorized", "code": "REFRESH_TOKEN_RECENTLY_ROTATED", "message": "..." }
```

| `code` | Meaning | What the client does |
|---|---|---|
| `REFRESH_TOKEN_RECENTLY_ROTATED` | The same token was already rotated less than `REFRESH_TOKEN_REUSE_GRACE_SECONDS` (default 20 s) ago, typically two tabs refreshing at once | Wait briefly, read the latest refresh token from shared storage, retry **once** |
| `REFRESH_TOKEN_REPLAY_DETECTED` | A rotated token was presented after the grace period. **All sessions of the account were revoked** | Clear everything, force sign-in, optionally warn the user |
| `REFRESH_TOKEN_EXPIRED` | Past its 7-day life | Sign in again |
| `REFRESH_TOKEN_REVOKED` | Logged out or revoked | Sign in again |
| `REFRESH_TOKEN_INVALID` | Unknown token | Sign in again |

Recommended pattern: an HTTP interceptor that, on a `401` from any other endpoint, performs **one** serialized refresh (single-flight, so concurrent requests share it), then replays the failed request once; if the refresh fails, sign the user out.

`POST /api/v1/authentication/logout` with `{ "refresh_token" }` answers `204` with no body, also for unknown or already revoked tokens (idempotent). A missing `refresh_token` is `400`.

## 5. Current user

`GET /api/v1/authentication/me` returns `CurrentUserResource` `{ id, username, email, role, provider }`. `email` is resolved from the profile.

## 6. Throttling of credential endpoints

`sign-in/local`, `google/verify` and `google/link` are throttled by `SignInRateLimitFilter`: every `401` counts against the client IP address and, for `sign-in/local`, also against the submitted username/email. After `SIGN_IN_RATE_LIMIT_MAX_FAILURES` (default 5) failures within `SIGN_IN_RATE_LIMIT_WINDOW_MINUTES` (default 5) the endpoint answers `429 TOO_MANY_REQUESTS` with a `Retry-After` header (seconds) until the window ends. A successful sign-in clears the account counter but not the address counter. Counters live in memory per instance. In a browser, `Retry-After` is only readable if the server exposes it for CORS (it does not), so fall back to the 5-minute default.

## 7. Roles and what they can reach

See [api/role-access-matrix.md](../api/role-access-matrix.md) for every endpoint grouped by role. Summary:

| Capability | `OWNER_ROLE` (web) | `TECHNICIAN_ROLE` (mobile) |
|---|---|---|
| Sites (create, update, change address, list) | yes | read only the site of an active assignment |
| Equipment (register, update, threshold, status, list) | yes | read only units with an active assignment (`PENDING`, `ACCEPTED`, `IN_PROGRESS`) |
| Devices (pair, unpair, rotate key, revoke) | yes | no |
| Alerts (read) / lifecycle (acknowledge, resolve, dismiss) | read + lifecycle | read only |
| Alert policy | read + update | read |
| Telemetry history | yes | active-assignment units only |
| Telemetry stream (SSE) | yes | no |
| Maintenance windows (list) | yes | no |
| Service requests | create, assign, cancel, list own | list assigned, accept, reject, start, regenerate edge grant |
| Interventions | read per equipment | register (completes the request), read per equipment |
| Reviews | submit, update | read the review about them |
| Reports | yes | no |
| Notifications and device tokens | yes (own) | yes (own) |
| Own profile | update owner profile | update technician profile |
| Dashboard configuration | own account | own account (endpoint is account-scoped, not owner-only) |
| Technician directory | list, public profile | own profile |

"Own" and "reachable" are enforced in the application layer: a resource that exists but is not reachable by the caller usually answers **404** (not 403), so its existence is not disclosed.

## 8. Device authentication (edge, not a frontend channel)

Boards send `X-API-Key: it_dev_...` on `POST /api/v1/telemetry`, `POST /api/v1/telemetry/events` and `GET /api/v1/devices/me/config`. The key is issued once by `POST /api/v1/devices` or `POST /api/v1/devices/{id}/rotate-api-key` (only its digest is stored). A missing, unknown, revoked or malformed key answers `401` with an empty body. A user JWT is not accepted on these routes and a device key is not accepted anywhere else. When a payload names `equipment_id` or `device_id`, it must match the key's device (otherwise `403 ACCESS_DENIED`).
