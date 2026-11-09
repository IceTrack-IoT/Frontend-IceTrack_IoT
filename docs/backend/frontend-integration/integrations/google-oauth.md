# Google OAuth 2.0 (Google Sign-In)

Sources: `iam/interfaces/rest/AuthenticationController`, `iam/application/internal/commandservices/UserCommandServiceImpl`, `iam/application/internal/outboundservices/google/GoogleTokenService`, `iam/infrastructure/tokens/google/services/GoogleTokenServiceImpl`, `iam/infrastructure/tokens/google/configuration/GoogleTokenDecoderConfiguration`, `application.properties` (`authorization.google.*`).

## What the backend does and does not do

The backend **never talks to Google's OAuth endpoints and never sees an authorization code or client secret**. The frontend performs the whole Google login, obtains a Google **ID token** (an OIDC JWT), and sends it to IceTrack. The backend validates the ID token offline against Google's published signing keys (`https://www.googleapis.com/oauth2/v3/certs`, Spring Security `NimbusJwtDecoder`), then issues IceTrack's **own** tokens. No Google secret is needed or documented.

| | Google ID token | IceTrack access token |
|---|---|---|
| Issued by | Google | IceTrack backend |
| Obtained by | Frontend (Google Sign-In SDK / Google Identity Services / native SDK) | `google/verify`, `google/link` or `google/complete-registration/*` response property `token` |
| Sent as | JSON body property `id_token` on the `/google/*` endpoints only | `Authorization: Bearer` on every other call |
| Validated | `iss` in `https://accounts.google.com` / `accounts.google.com`, signature (JWKS), expiry, audience = `GOOGLE_CLIENT_ID`, `email` present, `email_verified` true | HS512 signature and expiry |
| Reusable | Only inside its short Google lifetime; send it once per call | Until it expires (30 min) |

## Responsibilities

| Frontend | Backend |
|---|---|
| Configure Google Sign-In with the same OAuth **client id** that is set as `GOOGLE_CLIENT_ID` on the server | Validate the ID token (signature, issuer, expiry, audience, verified email) |
| Start Google login (web: Google Identity Services button/One Tap; mobile: Google native sign-in) and obtain `id_token` | Decide between sign-in, onboarding or account link |
| Send `{ id_token, channel }` to `POST /api/v1/authentication/google/verify` | Check that the account's role matches the channel |
| Show the role-selection onboarding form when told the account is unknown | Create account + profile atomically on completion |
| Ask for the existing password when told to link | Verify the password and link the Google identity |
| Store `token` and `refresh_token` after success | Issue IceTrack tokens and a refresh token bound to the channel |

## Endpoints

| Step | Endpoint | Body | Success | Failures |
|---|---|---|---|---|
| 1 Verify | `POST /api/v1/authentication/google/verify` | `SignInWithGoogleResource` `{ id_token, channel }` | `200 AuthenticatedUserResource` | `400` missing field/unknown channel; `401 INVALID_TOKEN`; `403 ROLE_CHANNEL_MISMATCH`; `404 GOOGLE_ACCOUNT_NOT_FOUND`; `409 ACCOUNT_LINK_REQUIRED`; `429` |
| 2a Onboard owner | `POST /api/v1/authentication/google/complete-registration/owner` | `CompleteGoogleOwnerRegistrationResource` `{ id_token, username, phone, street, number, city, postal_code, country, ruc }` | `201 AuthenticatedUserResource` | `400`; `401 INVALID_TOKEN`; `403 ROLE_CHANNEL_MISMATCH`; `409` |
| 2b Onboard technician | `POST /api/v1/authentication/google/complete-registration/technician` | `CompleteGoogleTechnicianRegistrationResource` (same fields with `speciality`, `certification_number` instead of `ruc`) | `201 AuthenticatedUserResource` | same |
| 3 Link | `POST /api/v1/authentication/google/link` | `LinkGoogleAccountResource` `{ id_token, password, channel }` | `200 AuthenticatedUserResource` | `400`; `401 INVALID_TOKEN` or `BAD_CREDENTIALS`; `403 ROLE_CHANNEL_MISMATCH`; `429` |

Contracts: [../api/iam/contracts.md](../api/iam/contracts.md). Full signatures: [../api/iam/endpoints.md](../api/iam/endpoints.md).

## Decision logic inside `google/verify` (`UserCommandServiceImpl.handle(SignInByGoogleCommand)`)

1. Validate the ID token. Any failure is `401 INVALID_TOKEN` with the generic `Unable to authenticate with Google` (the cause is only logged).
2. Look up an account already linked to the Google `sub`.
   - Found: check the channel (`WEB` for owners, `MOBILE` for technicians); mismatch is `403 ROLE_CHANNEL_MISMATCH`; otherwise open a session and return `200`.
3. Not linked and the email is verified: if the platform already has a profile with that email (an account registered with a password), answer `409 ACCOUNT_LINK_REQUIRED`. **It is never linked silently.**
4. Otherwise `404 GOOGLE_ACCOUNT_NOT_FOUND` and nothing is persisted: show the onboarding form.

An unverified Google email is rejected earlier (`require-verified-email` is on), so step 3 never matches on an unverified email.

### Onboarding (`google/complete-registration/*`)

The ID token is validated again. If the Google identity is already registered, the call simply signs it in (only if the role matches the endpoint's role, else `403 ROLE_CHANNEL_MISMATCH`). Otherwise it creates the account (`provider: GOOGLE`, no local password) with the role implied by the path and its profile, in one transaction, and signs in. Profile data comes from two places: `full_name` and `email` are taken from the Google ID token (`name`/`email`), everything else from the form. The desired `username` is required (blank is `400`; taken is `409 USER_CONFLICT`). `ACCOUNT_LINK_REQUIRED` can also appear here if a password account owns the email.

### Link (`google/link`)

Used after `409 ACCOUNT_LINK_REQUIRED`. The account is resolved from the **verified Google email**, never from the request. The user must present that account's current password. Missing account and wrong password are both `401 BAD_CREDENTIALS`. A Google identity that is already linked just signs its account in. On success the Google subject is stored on the existing account and its `provider` becomes `GOOGLE` (`User.linkGoogleAccount`); the local password is kept, so password sign-in keeps working. Tokens are returned.

## Sequence

See [../flows/sequence-diagrams.md#google-authentication](../flows/sequence-diagrams.md#google-authentication).

## Errors

| Status | Code | Meaning | UI |
|---|---|---|---|
| 401 | `INVALID_TOKEN` | Forged, expired, malformed, wrong audience, unverified email, or no email/subject | "Could not sign in with Google, try again"; get a fresh ID token |
| 403 | `ROLE_CHANNEL_MISMATCH` | Role does not match `channel` | Send the user to the other application |
| 404 | `GOOGLE_ACCOUNT_NOT_FOUND` | New Google user | Show role selection and the onboarding form |
| 409 | `ACCOUNT_LINK_REQUIRED` | Password account exists for this email | Ask for that account's password and call `google/link` |
| 409 | `USER_CONFLICT` / `PROFILE_CONFLICT` | Username or profile taken | Ask for another username |
| 429 | `TOO_MANY_REQUESTS` | Throttled (see [authentication](../security/authentication.md#6-throttling-of-credential-endpoints)) | Wait |

## Operational note

`authorization.google.client-id` defaults to the literal `google-client-id` when `GOOGLE_CLIENT_ID` is not set, and startup does not fail (an empty value only logs a warning and rejects every token). With the placeholder no real Google ID token has a matching audience, so every `/google/*` call answers `401 INVALID_TOKEN`. Confirm the deployed client id matches the client id configured in the frontend.
