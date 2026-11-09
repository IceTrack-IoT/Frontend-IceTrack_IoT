# Security reference

Complements [authentication.md](authentication.md) and [../errors/error-contract.md](../errors/error-contract.md).

## Request authentication matrix

| Route group | Filter chain | Credential | Failure |
|---|---|---|---|
| `/api/v1/authentication/**` except `/me`, `/error`, `/v3/api-docs/**`, `/swagger-ui*`, `/swagger-resources/**`, `/webjars/**` | user chain, `permitAll` | none | n/a (credential endpoints answer 400/401/403/404/409/429 themselves) |
| `GET /api/v1/authentication/me` and every other `/api/v1/**` route not listed below | user chain, `authenticated()` | `Authorization: Bearer` | `401` standard body |
| `GET /api/v1/telemetry/stream` | user chain, `permitAll` | `?ticket=` (single-use, 60 s) checked by the controller | `401` standard body |
| `POST /api/v1/telemetry`, `POST /api/v1/telemetry/events`, any method on `/api/v1/devices/me/**` | edge chain (`@Order(1)`) | `X-API-Key`, authority `DEVICE_ROLE` | `401`, empty body |

Method security (`@EnableMethodSecurity`) adds `@PreAuthorize` per endpoint: `hasAuthority('OWNER_ROLE')`, `hasAuthority('TECHNICIAN_ROLE')`, both, or SpEL checks against `ProfileAccessEvaluator` (`isOwnerSelf`, `isTechnicianSelf`, `isAccountSelf`). A denial is `403 ACCESS_DENIED`. Endpoints with no `@PreAuthorize` (only a valid token is required at the method level): `GET /users`, `GET /users/{id}`, `GET /roles`, all five `/notifications` reads/updates, both `/notifications/device-tokens` calls, and the four profile reads `GET /profiles/owners/{id}`, `/owners/user/{id}`, `/technicians/{id}`, `/technicians/user/{id}` (the profile reads are scoped by `ProfileView`; `NONE` answers 404). Authentication endpoints and edge routes are covered by the security chains above.

## Authorization is also enforced by data scoping

| Principle | Examples |
|---|---|
| The owner is derived from the token, never from the payload | `RegisterSiteResource` has no owner field; reports, sites and equipment are scoped to the caller |
| A resource the caller cannot reach answers `404`, not `403` | Equipment, sites, alerts, service requests, reports |
| A technician reaches a unit or site only while holding an active assignment (`PENDING`, `ACCEPTED`, `IN_PROGRESS`) | `GET /assets/equipments/{id}`, telemetry history, alert reads |
| Profile data is masked by relationship (`ProfileView`: `FULL`, `CONTACT`, `PUBLIC`, `NONE`) | Technician directory hides email, phone and address except for technicians actively assigned to the caller's requests; an owner profile is visible to a technician only during an active engagement |
| `GET /api/v1/users`, `GET /api/v1/users/{id}` return only the caller's own account | |
| `GET /api/v1/profiles/owners` returns only the caller's own owner profile | |
| Dashboard configuration is account-scoped (`user_id` must be the caller's) | |
| Device credentials: payload `equipment_id` / `device_id` must match the authenticated key's device | |

## Secrets and configuration names (values are never documented)

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Base64 HS512 key (>= 64 bytes) signing access tokens; startup fails if missing or short |
| `JWT_EXPIRATION_MINUTES`, `REFRESH_TOKEN_EXPIRATION_DAYS`, `REFRESH_TOKEN_REUSE_GRACE_SECONDS`, `REFRESH_TOKEN_PURGE_CRON` | Token lifetimes |
| `GOOGLE_CLIENT_ID` | Audience the Google ID token must carry |
| `SIGN_IN_RATE_LIMIT_MAX_FAILURES`, `SIGN_IN_RATE_LIMIT_WINDOW_MINUTES` | Sign-in throttling |
| `ADDRESS_VALIDATION_SECRET` | Base64 HS256 key (>= 32 bytes) signing address validation tokens; separate from the user JWT key |
| `google.maps.api-key` | Google Maps Geocoding key (server-side only) |
| `GCS_CREDENTIALS_PATH`, `reporting.storage.gcs.*` | Google Cloud Storage service account for reports |
| `PUSH_PROVIDER`, `FCM_PROJECT_ID`, `FCM_CREDENTIALS_PATH` | Firebase Cloud Messaging |
| `EDGE_GRANT_TTL_HOURS` | Lifetime of technician edge grants (default 24 h) |
| `SPRING_DATASOURCE_*` | Database |

None of these reach the frontend. The frontend only holds the Google **client** id used to start Google sign-in.

## Token and secret shapes worth recognizing

| Prefix | Meaning | Shown |
|---|---|---|
| `it_dev_...` | Device API key | once, in the pairing / rotation response |
| `it_grt_...` | Technician edge grant | once, in the accept / regenerate response |
| `st_...` | Telemetry stream ticket | once, in the ticket response |

## Security considerations for frontend developers

1. Treat `401` on `sign-in/local`, `google/verify`, `google/link` as a failed attempt: repeated failures lock the address/account out for the window.
2. CORS allows every origin, so browser-side protections do not replace token handling. Never place tokens in URLs (except the stream ticket), local storage without need, or analytics payloads.
3. `GET /telemetry/stream` is an EventSource; tickets are single-use and 60 s long. Request a fresh ticket for every (re)connection.
4. `Retry-After` and `ETag` are not exposed to cross-origin browser code.
5. Report `download_url` and the maps `navigation_url` are plain URLs; the report URL is a V4 signed Google Cloud Storage URL valid for 15 minutes and must not be cached or shared.
6. All transport security (HTTPS/TLS) is a deployment concern; the application itself listens on plain HTTP.
