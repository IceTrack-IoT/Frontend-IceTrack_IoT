# IAM (Identity and Access Management) - request and response contracts

Generated from the REST resource records under `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources`. Property names are the **serialized** names: Jackson runs with `SNAKE_CASE` (`JacksonConfiguration`, `spring.jackson.property-naming-strategy`), so the Java component `fullName` is the JSON property `full_name`.

Legend: **Required** = enforced by Bean Validation (`@NotNull` / `@NotBlank`). Optional properties may be omitted or `null`. A resource marked `@JsonInclude(NON_NULL)` **omits** null properties; every other resource writes them as `null`.

## `AuthenticatedUserResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/AuthenticatedUserResource.java`
- Example: [`responses/AuthenticatedUserResource.json`](responses/AuthenticatedUserResource.json) | JSON Schema: [`schemas/iam/AuthenticatedUserResource.schema.json`](../../schemas/iam/AuthenticatedUserResource.schema.json)
- Used by: `POST /api/v1/authentication/sign-in/local`, `POST /api/v1/authentication/google/verify`, `POST /api/v1/authentication/google/link`, `POST /api/v1/authentication/google/complete-registration/owner`, `POST /api/v1/authentication/google/complete-registration/technician`, `POST /api/v1/authentication/refresh-token`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | User unique identifier |
| `username` | string | no |  | User username |
| `role` | string | no |  | documented values: `OWNER_ROLE`, `TECHNICIAN_ROLE`; Role of the account |
| `provider` | string | no |  | documented values: `LOCAL`, `GOOGLE`; User identity provider |
| `token` | string | no |  | Short-lived JWT Bearer access token for authentication |
| `refresh_token` | string | no |  | Single-use refresh token, exchanged at /api/v1/authentication/refresh-token for a new token pair |

## `AuthErrorResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/AuthErrorResource.java`
- Example: [`responses/AuthErrorResource.json`](responses/AuthErrorResource.json) | JSON Schema: [`schemas/iam/AuthErrorResource.schema.json`](../../schemas/iam/AuthErrorResource.schema.json)
- Used by: `POST /api/v1/authentication/refresh-token`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `timestamp` | string | no |  | Instant the error occurred, ISO-8601 in UTC |
| `status` | integer | no |  | HTTP status code |
| `error` | string | no |  | HTTP status reason phrase |
| `code` | string | no |  | documented values: `REFRESH_TOKEN_RECENTLY_ROTATED`, `REFRESH_TOKEN_REPLAY_DETECTED`, `REFRESH_TOKEN_EXPIRED`, `REFRESH_TOKEN_REVOKED`, `REFRESH_TOKEN_INVALID`; Machine-readable reason. Only REFRESH_TOKEN_RECENTLY_ROTATED is recoverable, by retrying once with the latest refresh token; every other code ends the session |
| `message` | string | no |  | Human-readable description of the error |

## `CompleteGoogleOwnerRegistrationResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/CompleteGoogleOwnerRegistrationResource.java`
- Example: [`requests/CompleteGoogleOwnerRegistrationResource.json`](requests/CompleteGoogleOwnerRegistrationResource.json) | JSON Schema: [`schemas/iam/CompleteGoogleOwnerRegistrationResource.schema.json`](../../schemas/iam/CompleteGoogleOwnerRegistrationResource.schema.json)
- Used by: `POST /api/v1/authentication/google/complete-registration/owner`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id_token` | string | yes | not blank | Google OIDC id_token issued to the frontend |
| `username` | string | yes | not blank | Desired username, unique on the platform. The Google email is never used as username. |
| `phone` | string | yes | not blank | Phone number, optionally prefixed by the country code and a space |
| `street` | string | yes | not blank | Street of the address |
| `number` | string | no (documented as required but not enforced) |  | Street number or apartment |
| `city` | string | yes | not blank | City of the address |
| `postal_code` | string | yes | not blank | Postal code of the address |
| `country` | string | yes | not blank | Country of the address |
| `ruc` | integer | yes |  | 11 digit taxpayer registration number (RUC) |

## `CompleteGoogleTechnicianRegistrationResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/CompleteGoogleTechnicianRegistrationResource.java`
- Example: [`requests/CompleteGoogleTechnicianRegistrationResource.json`](requests/CompleteGoogleTechnicianRegistrationResource.json) | JSON Schema: [`schemas/iam/CompleteGoogleTechnicianRegistrationResource.schema.json`](../../schemas/iam/CompleteGoogleTechnicianRegistrationResource.schema.json)
- Used by: `POST /api/v1/authentication/google/complete-registration/technician`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id_token` | string | yes | not blank | Google OIDC id_token issued to the frontend |
| `username` | string | yes | not blank | Desired username, unique on the platform. The Google email is never used as username. |
| `phone` | string | yes | not blank | Phone number, optionally prefixed by the country code and a space |
| `street` | string | yes | not blank | Street of the address |
| `number` | string | no (documented as required but not enforced) |  | Street number or apartment |
| `city` | string | yes | not blank | City of the address |
| `postal_code` | string | yes | not blank | Postal code of the address |
| `country` | string | yes | not blank | Country of the address |
| `speciality` | string | yes | not blank | Technician speciality |
| `certification_number` | string | yes | not blank | Technician certification number |

## `CurrentUserResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/CurrentUserResource.java`
- Example: [`responses/CurrentUserResource.json`](responses/CurrentUserResource.json) | JSON Schema: [`schemas/iam/CurrentUserResource.schema.json`](../../schemas/iam/CurrentUserResource.schema.json)
- Used by: `GET /api/v1/authentication/me`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | User unique identifier |
| `username` | string | no |  | User username |
| `email` | string | no |  | User email address |
| `role` | string | no |  | documented values: `OWNER_ROLE`, `TECHNICIAN_ROLE`; User role |
| `provider` | string | no |  | documented values: `LOCAL`, `GOOGLE`; User identity provider |

## `LinkGoogleAccountResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/LinkGoogleAccountResource.java`
- Example: [`requests/LinkGoogleAccountResource.json`](requests/LinkGoogleAccountResource.json) | JSON Schema: [`schemas/iam/LinkGoogleAccountResource.schema.json`](../../schemas/iam/LinkGoogleAccountResource.schema.json)
- Used by: `POST /api/v1/authentication/google/link`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id_token` | string | yes | not blank | Google OIDC id_token issued to the frontend |
| `password` | string | yes | not blank; max length 255 | Current local password of the account whose profile uses the Google email |
| `channel` | string enum | yes |  | values: `WEB`, `MOBILE`; Client application: WEB for owners, MOBILE for technicians |

## `RefreshTokenResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/RefreshTokenResource.java`
- Example: [`requests/RefreshTokenResource.json`](requests/RefreshTokenResource.json) | JSON Schema: [`schemas/iam/RefreshTokenResource.schema.json`](../../schemas/iam/RefreshTokenResource.schema.json)
- Used by: `POST /api/v1/authentication/refresh-token`, `POST /api/v1/authentication/logout`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `refresh_token` | string | yes | not blank | Opaque refresh token; single use, rotated on every refresh |
| `channel` | string enum | no |  | values: `WEB`, `MOBILE`; Client application the refresh comes from; when present it must be the channel the session was opened from. Ignored by logout.; nullable |

## `RoleResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/RoleResource.java`
- Example: [`responses/RoleResource.json`](responses/RoleResource.json) | JSON Schema: [`schemas/iam/RoleResource.schema.json`](../../schemas/iam/RoleResource.schema.json)
- Used by: `GET /api/v1/roles`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Role unique identifier |
| `name` | string | no |  | documented values: `OWNER_ROLE`, `TECHNICIAN_ROLE`; Role name |

## `SignInWithGoogleResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/SignInWithGoogleResource.java`
- Example: [`requests/SignInWithGoogleResource.json`](requests/SignInWithGoogleResource.json) | JSON Schema: [`schemas/iam/SignInWithGoogleResource.schema.json`](../../schemas/iam/SignInWithGoogleResource.schema.json)
- Used by: `POST /api/v1/authentication/google/verify`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id_token` | string | yes | not blank | Google OIDC id_token issued to the frontend |
| `channel` | string enum | yes |  | values: `WEB`, `MOBILE`; Client application: WEB for owners, MOBILE for technicians |

## `SignInWithLocalResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/SignInWithLocalResource.java`
- Example: [`requests/SignInWithLocalResource.json`](requests/SignInWithLocalResource.json) | JSON Schema: [`schemas/iam/SignInWithLocalResource.schema.json`](../../schemas/iam/SignInWithLocalResource.schema.json)
- Used by: `POST /api/v1/authentication/sign-in/local`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `username` | string | yes | not blank; max length 255 | Username, or the email address of the account's profile (matched case-insensitively) |
| `password` | string | yes | not blank; max length 255 | User password |
| `channel` | string enum | yes |  | values: `WEB`, `MOBILE`; Client application: WEB for owners, MOBILE for technicians |

## `SignUpOwnerResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/SignUpOwnerResource.java`
- Example: [`requests/SignUpOwnerResource.json`](requests/SignUpOwnerResource.json) | JSON Schema: [`schemas/iam/SignUpOwnerResource.schema.json`](../../schemas/iam/SignUpOwnerResource.schema.json)
- Used by: `POST /api/v1/authentication/sign-up/owner`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `username` | string | yes | not blank | Desired username |
| `password` | string | yes | not blank; 8 to 64 characters; at least one uppercase letter, one lowercase letter and one digit (pattern `^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$`) | User password |
| `email` | string | yes | not blank; email format | User email address; it also identifies the profile |
| `full_name` | string | yes | not blank | Full name of the account holder |
| `phone` | string | yes | not blank | Phone number, optionally prefixed by the country code and a space |
| `street` | string | yes | not blank | Street of the address |
| `number` | string | no (documented as required but not enforced) |  | Street number or apartment |
| `city` | string | yes | not blank | City of the address |
| `postal_code` | string | yes | not blank | Postal code of the address |
| `country` | string | yes | not blank | Country of the address |
| `ruc` | integer | yes |  | 11 digit taxpayer registration number (RUC) |

## `SignUpTechnicianResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/SignUpTechnicianResource.java`
- Example: [`requests/SignUpTechnicianResource.json`](requests/SignUpTechnicianResource.json) | JSON Schema: [`schemas/iam/SignUpTechnicianResource.schema.json`](../../schemas/iam/SignUpTechnicianResource.schema.json)
- Used by: `POST /api/v1/authentication/sign-up/technician`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `username` | string | yes | not blank | Desired username |
| `password` | string | yes | not blank; 8 to 64 characters; at least one uppercase letter, one lowercase letter and one digit (pattern `^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$`) | User password |
| `email` | string | yes | not blank; email format | User email address; it also identifies the profile |
| `full_name` | string | yes | not blank | Full name of the account holder |
| `phone` | string | yes | not blank | Phone number, optionally prefixed by the country code and a space |
| `street` | string | yes | not blank | Street of the address |
| `number` | string | no (documented as required but not enforced) |  | Street number or apartment |
| `city` | string | yes | not blank | City of the address |
| `postal_code` | string | yes | not blank | Postal code of the address |
| `country` | string | yes | not blank | Country of the address |
| `speciality` | string | yes | not blank | Technician speciality |
| `certification_number` | string | yes | not blank | Technician certification number |

## `UserResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/UserResource.java`
- Example: [`responses/UserResource.json`](responses/UserResource.json) | JSON Schema: [`schemas/iam/UserResource.schema.json`](../../schemas/iam/UserResource.schema.json)
- Used by: `POST /api/v1/authentication/sign-up/owner`, `POST /api/v1/authentication/sign-up/technician`, `GET /api/v1/users`, `GET /api/v1/users/{userId}`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | User unique identifier |
| `username` | string | no |  | User username |
| `role` | string | no |  | documented values: `OWNER_ROLE`, `TECHNICIAN_ROLE`; Role of the account |
| `provider` | string | no |  | documented values: `LOCAL`, `GOOGLE`; User identity provider |

## Enumerations

- `ClientChannelResource`: `WEB`, `MOBILE`  
  source: `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/ClientChannelResource.java`
