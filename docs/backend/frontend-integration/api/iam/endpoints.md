# IAM (Identity and Access Management) - REST endpoints

Every endpoint below was discovered from the controllers named in its entry. "Declared statuses" are the `@ApiResponse` codes the controller documents. Statuses produced by shared handlers apply to every endpoint (see [../../errors/error-contract.md](../../errors/error-contract.md)): `400` for unreadable bodies, failed validation and bad parameter types; `401` for a missing or invalid bearer token; `403` for method-security denials; `500` for unexpected errors.

Base URL: see [../../README.md](../../README.md#5-base-url). All paths are relative to it. JSON bodies use `snake_case`.

| # | Method | Path | Auth | Summary |
|---|---|---|---|---|
| 1 | `POST` | `/api/v1/authentication/sign-in/local` | Anonymous (no token) | Sign in with local credentials |
| 2 | `POST` | `/api/v1/authentication/sign-up/owner` | Anonymous (no token) | Sign up an owner with local credentials |
| 3 | `POST` | `/api/v1/authentication/sign-up/technician` | Anonymous (no token) | Sign up a technician with local credentials |
| 4 | `POST` | `/api/v1/authentication/google/verify` | Anonymous (no token) | Verify a Google id_token and sign in a registered account |
| 5 | `POST` | `/api/v1/authentication/google/link` | Anonymous (no token) | Link a Google account to an existing password account |
| 6 | `POST` | `/api/v1/authentication/google/complete-registration/owner` | Anonymous (no token) | Complete the registration of a Google account as an owner |
| 7 | `POST` | `/api/v1/authentication/google/complete-registration/technician` | Anonymous (no token) | Complete the registration of a Google account as a technician |
| 8 | `POST` | `/api/v1/authentication/refresh-token` | Anonymous (no token) | Refresh the session tokens |
| 9 | `POST` | `/api/v1/authentication/logout` | Anonymous (no token) | Sign out |
| 10 | `GET` | `/api/v1/authentication/me` | Authenticated (any valid bearer token) | Get the current user |
| 11 | `GET` | `/api/v1/roles` | Authenticated (any valid bearer token) | Get all roles |
| 12 | `GET` | `/api/v1/users` | Authenticated (any valid bearer token) | Get my account |
| 13 | `GET` | `/api/v1/users/{userId}` | Authenticated (any valid bearer token) | Get user by ID |

## `POST /api/v1/authentication/sign-in/local`

**Sign in with local credentials** - Authenticates a user with username (or profile email, matched case-insensitively) and password, on the client channel the request comes from, and returns the platform bearer token. An unknown account and a wrong password are answered identically, in the same time. WEB admits only OWNER_ROLE accounts and MOBILE only TECHNICIAN_ROLE accounts.

| Field | Value |
|---|---|
| Bounded context | IAM (Identity and Access Management) |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/AuthenticationController.java` - method `signIn` |
| Authentication / authorization | Anonymous (no token) |
| Headers | `Accept: application/json`, `Content-Type: application/json` |
| Path parameters | none |
| Query parameters | none |
| Request body | `SignInWithLocalResource` - [`requests/SignInWithLocalResource.json`](requests/SignInWithLocalResource.json), schema [`SignInWithLocalResource.schema.json`](../../schemas/iam/SignInWithLocalResource.schema.json) |
| Declared statuses / responses | `200` - `AuthenticatedUserResource` ([`responses/AuthenticatedUserResource.json`](responses/AuthenticatedUserResource.json)) - User authenticated successfully<br>`400` - `ErrorResource` - VALIDATION_ERROR - username, password or channel missing, or an unknown channel<br>`401` - `ErrorResource` - BAD_CREDENTIALS - invalid username, email, or password<br>`403` - `ErrorResource` - ROLE_CHANNEL_MISMATCH - valid credentials, but the account must use the other application<br>`429` - `ErrorResource` - TOO_MANY_REQUESTS - too many failed attempts from this address or for this account; see the Retry-After header |
| Application flow | controller -> `userCommandService` |

## `POST /api/v1/authentication/sign-up/owner`

**Sign up an owner with local credentials** - Registers an account with OWNER_ROLE and creates its owner profile (RUC included) atomically.

| Field | Value |
|---|---|
| Bounded context | IAM (Identity and Access Management) |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/AuthenticationController.java` - method `signUpOwner` |
| Authentication / authorization | Anonymous (no token) |
| Headers | `Accept: application/json`, `Content-Type: application/json` |
| Path parameters | none |
| Query parameters | none |
| Request body | `SignUpOwnerResource` - [`requests/SignUpOwnerResource.json`](requests/SignUpOwnerResource.json), schema [`SignUpOwnerResource.schema.json`](../../schemas/iam/SignUpOwnerResource.schema.json) |
| Declared statuses / responses | `201` - `UserResource` ([`responses/UserResource.json`](responses/UserResource.json)) - Owner registered successfully<br>`400` - error body - Invalid input data, such as a missing field or a RUC that is not 11 digits<br>`409` - error body - Conflict - username, email or profile already taken |
| Application flow | controller -> `userCommandService` |

## `POST /api/v1/authentication/sign-up/technician`

**Sign up a technician with local credentials** - Registers an account with TECHNICIAN_ROLE and creates its technician profile (speciality and certification number included) atomically.

| Field | Value |
|---|---|
| Bounded context | IAM (Identity and Access Management) |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/AuthenticationController.java` - method `signUpTechnician` |
| Authentication / authorization | Anonymous (no token) |
| Headers | `Accept: application/json`, `Content-Type: application/json` |
| Path parameters | none |
| Query parameters | none |
| Request body | `SignUpTechnicianResource` - [`requests/SignUpTechnicianResource.json`](requests/SignUpTechnicianResource.json), schema [`SignUpTechnicianResource.schema.json`](../../schemas/iam/SignUpTechnicianResource.schema.json) |
| Declared statuses / responses | `201` - `UserResource` ([`responses/UserResource.json`](responses/UserResource.json)) - Technician registered successfully<br>`400` - error body - Invalid input data, such as a missing speciality or certification number<br>`409` - error body - Conflict - username, email or profile already taken |
| Application flow | controller -> `userCommandService` |

## `POST /api/v1/authentication/google/verify`

**Verify a Google id_token and sign in a registered account** - Validates the Google OIDC id_token obtained by the frontend. Returns the platform bearer token when the Google account is registered and its role matches the channel, 404 GOOGLE_ACCOUNT_NOT_FOUND when the onboarding form must be completed first, or 409 ACCOUNT_LINK_REQUIRED when the verified email belongs to an account registered with a password, which must then be linked through /google/link. An email Google has not verified is never matched against existing accounts.

| Field | Value |
|---|---|
| Bounded context | IAM (Identity and Access Management) |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/AuthenticationController.java` - method `verifyGoogleAccount` |
| Authentication / authorization | Anonymous (no token) |
| Headers | `Accept: application/json`, `Content-Type: application/json` |
| Path parameters | none |
| Query parameters | none |
| Request body | `SignInWithGoogleResource` - [`requests/SignInWithGoogleResource.json`](requests/SignInWithGoogleResource.json), schema [`SignInWithGoogleResource.schema.json`](../../schemas/iam/SignInWithGoogleResource.schema.json) |
| Declared statuses / responses | `200` - `AuthenticatedUserResource` ([`responses/AuthenticatedUserResource.json`](responses/AuthenticatedUserResource.json)) - Google account registered; user signed in<br>`400` - `ErrorResource` - VALIDATION_ERROR - id_token or channel missing, or an unknown channel<br>`401` - `ErrorResource` - INVALID_TOKEN - the id_token is forged, expired, malformed, not addressed to this application, or its email is not verified<br>`403` - `ErrorResource` - ROLE_CHANNEL_MISMATCH - the account must use the other application<br>`404` - `ErrorResource` - GOOGLE_ACCOUNT_NOT_FOUND - onboarding completion is required<br>`409` - `ErrorResource` - ACCOUNT_LINK_REQUIRED - confirm the existing account's password through /google/link<br>`429` - `ErrorResource` - TOO_MANY_REQUESTS - too many failed attempts from this address; see the Retry-After header |
| Application flow | controller -> `userCommandService` |

## `POST /api/v1/authentication/google/link`

**Link a Google account to an existing password account** - Answers 409 ACCOUNT_LINK_REQUIRED from /google/verify: re-verifies the Google id_token, checks the password of the account whose profile uses the verified Google email, links the Google identity to it and returns the platform bearer token. A missing account and a wrong password are both 401 BAD_CREDENTIALS. A Google identity already linked simply signs its account in.

| Field | Value |
|---|---|
| Bounded context | IAM (Identity and Access Management) |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/AuthenticationController.java` - method `linkGoogleAccount` |
| Authentication / authorization | Anonymous (no token) |
| Headers | `Accept: application/json`, `Content-Type: application/json` |
| Path parameters | none |
| Query parameters | none |
| Request body | `LinkGoogleAccountResource` - [`requests/LinkGoogleAccountResource.json`](requests/LinkGoogleAccountResource.json), schema [`LinkGoogleAccountResource.schema.json`](../../schemas/iam/LinkGoogleAccountResource.schema.json) |
| Declared statuses / responses | `200` - `AuthenticatedUserResource` ([`responses/AuthenticatedUserResource.json`](responses/AuthenticatedUserResource.json)) - Google identity linked; user signed in<br>`400` - `ErrorResource` - VALIDATION_ERROR - id_token, password or channel missing, or an unknown channel<br>`401` - `ErrorResource` - INVALID_TOKEN - the id_token is rejected; or BAD_CREDENTIALS - no password account uses the email, or the password is wrong<br>`403` - `ErrorResource` - ROLE_CHANNEL_MISMATCH - the account must use the other application; nothing is linked<br>`429` - `ErrorResource` - TOO_MANY_REQUESTS - too many failed attempts from this address; see the Retry-After header |
| Application flow | controller -> `userCommandService` |

## `POST /api/v1/authentication/google/complete-registration/owner`

**Complete the registration of a Google account as an owner** - Re-verifies the Google id_token, creates the account with OWNER_ROLE and its owner profile atomically, then returns the platform bearer token. An already registered Google account is signed in only when it holds OWNER_ROLE; otherwise 403 ROLE_CHANNEL_MISMATCH.

| Field | Value |
|---|---|
| Bounded context | IAM (Identity and Access Management) |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/AuthenticationController.java` - method `completeGoogleOwnerRegistration` |
| Authentication / authorization | Anonymous (no token) |
| Headers | `Accept: application/json`, `Content-Type: application/json` |
| Path parameters | none |
| Query parameters | none |
| Request body | `CompleteGoogleOwnerRegistrationResource` - [`requests/CompleteGoogleOwnerRegistrationResource.json`](requests/CompleteGoogleOwnerRegistrationResource.json), schema [`CompleteGoogleOwnerRegistrationResource.schema.json`](../../schemas/iam/CompleteGoogleOwnerRegistrationResource.schema.json) |
| Declared statuses / responses | `201` - `AuthenticatedUserResource` ([`responses/AuthenticatedUserResource.json`](responses/AuthenticatedUserResource.json)) - Owner account and profile created; user signed in<br>`400` - error body - Invalid onboarding form, such as a RUC that is not 11 digits<br>`401` - error body - INVALID_TOKEN - the Google id_token is rejected<br>`403` - error body - ROLE_CHANNEL_MISMATCH - the Google account is already registered as a technician<br>`409` - error body - Conflict - username, email or profile already taken; or ACCOUNT_LINK_REQUIRED - the verified email belongs to an account registered with a password |
| Application flow | controller -> `userCommandService` |

## `POST /api/v1/authentication/google/complete-registration/technician`

**Complete the registration of a Google account as a technician** - Re-verifies the Google id_token, creates the account with TECHNICIAN_ROLE and its technician profile atomically, then returns the platform bearer token. An already registered Google account is signed in only when it holds TECHNICIAN_ROLE; otherwise 403 ROLE_CHANNEL_MISMATCH.

| Field | Value |
|---|---|
| Bounded context | IAM (Identity and Access Management) |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/AuthenticationController.java` - method `completeGoogleTechnicianRegistration` |
| Authentication / authorization | Anonymous (no token) |
| Headers | `Accept: application/json`, `Content-Type: application/json` |
| Path parameters | none |
| Query parameters | none |
| Request body | `CompleteGoogleTechnicianRegistrationResource` - [`requests/CompleteGoogleTechnicianRegistrationResource.json`](requests/CompleteGoogleTechnicianRegistrationResource.json), schema [`CompleteGoogleTechnicianRegistrationResource.schema.json`](../../schemas/iam/CompleteGoogleTechnicianRegistrationResource.schema.json) |
| Declared statuses / responses | `201` - `AuthenticatedUserResource` ([`responses/AuthenticatedUserResource.json`](responses/AuthenticatedUserResource.json)) - Technician account and profile created; user signed in<br>`400` - error body - Invalid onboarding form, such as a missing speciality or certification number<br>`401` - error body - INVALID_TOKEN - the Google id_token is rejected<br>`403` - error body - ROLE_CHANNEL_MISMATCH - the Google account is already registered as an owner<br>`409` - error body - Conflict - username, email or profile already taken; or ACCOUNT_LINK_REQUIRED - the verified email belongs to an account registered with a password |
| Application flow | controller -> `userCommandService` |

## `POST /api/v1/authentication/refresh-token`

**Refresh the session tokens** - Rotates the refresh token: revokes the presented one and returns a new access token and a new refresh token. Rejections are 401 responses whose `code` tells the client what to do: REFRESH_TOKEN_RECENTLY_ROTATED - a concurrent request already rotated it; retry once with the latest refresh token. REFRESH_TOKEN_REPLAY_DETECTED - reused after the grace period; every session of the account has been revoked. REFRESH_TOKEN_EXPIRED, REFRESH_TOKEN_REVOKED, REFRESH_TOKEN_INVALID - sign in again. The new session keeps the channel the original one was opened from; an optional `channel` must match it, otherwise 403 ROLE_CHANNEL_MISMATCH and the presented token stays valid.

| Field | Value |
|---|---|
| Bounded context | IAM (Identity and Access Management) |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/AuthenticationController.java` - method `refreshToken` |
| Authentication / authorization | Anonymous (no token) |
| Headers | `Accept: application/json`, `Content-Type: application/json` |
| Path parameters | none |
| Query parameters | none |
| Request body | `RefreshTokenResource` - [`requests/RefreshTokenResource.json`](requests/RefreshTokenResource.json), schema [`RefreshTokenResource.schema.json`](../../schemas/iam/RefreshTokenResource.schema.json) |
| Declared statuses / responses | `200` - `AuthenticatedUserResource` ([`responses/AuthenticatedUserResource.json`](responses/AuthenticatedUserResource.json)) - Session refreshed<br>`400` - error body - The refresh token is missing, or the channel is unknown<br>`401` - `AuthErrorResource` - The refresh token was rejected; see `code`<br>`403` - `ErrorResource` - ROLE_CHANNEL_MISMATCH - the session belongs to the other application |
| Application flow | controller -> `userCommandService` |

## `POST /api/v1/authentication/logout`

**Sign out** - Revokes the refresh token so that it can no longer be exchanged; presenting it later is answered with REFRESH_TOKEN_REVOKED. The short-lived access token is stateless and remains valid until it expires; clients must discard it.

| Field | Value |
|---|---|
| Bounded context | IAM (Identity and Access Management) |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/AuthenticationController.java` - method `signOut` |
| Authentication / authorization | Anonymous (no token) |
| Headers | `Accept: application/json`, `Content-Type: application/json` |
| Path parameters | none |
| Query parameters | none |
| Request body | `RefreshTokenResource` (body optional) - [`requests/RefreshTokenResource.json`](requests/RefreshTokenResource.json), schema [`RefreshTokenResource.schema.json`](../../schemas/iam/RefreshTokenResource.schema.json) |
| Declared statuses / responses | `204` - no JSON body (Signed out)<br>`400` - error body - The refresh token is missing |
| Application flow | controller -> `userCommandService` |

## `GET /api/v1/authentication/me`

**Get the current user** - Returns the identity and roles of the account the bearer token was issued to.

| Field | Value |
|---|---|
| Bounded context | IAM (Identity and Access Management) |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/AuthenticationController.java` - method `getCurrentUser` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `CurrentUserResource` ([`responses/CurrentUserResource.json`](responses/CurrentUserResource.json)) - Current user retrieved successfully<br>`401` - error body - Unauthorized - JWT token required or invalid |
| Application flow | controller -> `userQueryService` |

## `GET /api/v1/roles`

**Get all roles** - Retrieves a list of all available system roles.

| Field | Value |
|---|---|
| Bounded context | IAM (Identity and Access Management) |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/RolesController.java` - method `getAllRoles` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `RoleResource` ([`responses/RoleResource.json`](responses/RoleResource.json)) - Roles retrieved successfully<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - Insufficient permissions |
| Application flow | controller -> `roleQueryService` |

## `GET /api/v1/users`

**Get my account** - Returns a list holding only the authenticated caller's own account. Other accounts are never listed.

| Field | Value |
|---|---|
| Bounded context | IAM (Identity and Access Management) |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/UsersController.java` - method `getAllUsers` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - JSON array of `UserResource` ([`responses/UserResource.json`](responses/UserResource.json)) - Users retrieved successfully<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - Insufficient permissions |
| Application flow | controller -> `userQueryService` |

## `GET /api/v1/users/{userId}`

**Get user by ID** - Retrieves the caller's own account by its unique identifier; any other identifier answers 404.

| Field | Value |
|---|---|
| Bounded context | IAM (Identity and Access Management) |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/UsersController.java` - method `getUserById` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `userId` (Long; Java `userId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `UserResource` ([`responses/UserResource.json`](responses/UserResource.json)) - User retrieved successfully<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - Forbidden - Insufficient permissions<br>`404` - error body - USER_NOT_FOUND - not the caller's own identifier |
| Application flow | controller -> `userQueryService` |
