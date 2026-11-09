# IAM - Identity and Access Management

Package `pe.edu.upc.ice.track.platform.iam`. API: [../api/iam/endpoints.md](../api/iam/endpoints.md), contracts: [../api/iam/contracts.md](../api/iam/contracts.md). Security narrative: [../security/authentication.md](../security/authentication.md).

## Responsibilities

Accounts, credentials, roles, sessions. Registers owners and technicians (together with their profile), signs users in with a password or a Google ID token, issues and rotates tokens, throttles credential endpoints, and exposes the current user.

## Package organization (actual)

```text
iam/
  application/commandservices        RoleCommandService, UserCommandService
  application/queryservices          RoleQueryService, UserQueryService
  application/internal/commandservices  UserCommandServiceImpl, RoleCommandServiceImpl, AuthenticationErrors
  application/internal/eventhandlers    ApplicationReadyEventHandler (seeds roles), RefreshTokenPurgeScheduler
  application/internal/outboundservices
      acl/ExternalProfileService        -> ProfilesContextFacade
      google/GoogleTokenService, GoogleUserInfo
      hashing/HashingService, tokens/TokenService, tokens/RefreshTokenService
  domain/model/aggregates/User   entities/RefreshToken, Role
  domain/model/valueobjects      AuthProvider(LOCAL, GOOGLE), ClientChannel(WEB, MOBILE), Roles(OWNER_ROLE, TECHNICIAN_ROLE),
                                 SessionTokens, ContactDetails, AuthErrorCode
  domain/exceptions/RefreshTokenException
  infrastructure/authorization/sfs   WebSecurityConfiguration, BearerAuthorizationRequestFilter, UnauthorizedRequestHandlerEntryPoint, UserDetails
  infrastructure/security            SignInRateLimitFilter, SignInAttemptRegistry
  infrastructure/tokens/jwt|google|refresh   TokenServiceImpl (HS512), GoogleTokenServiceImpl + decoder config, RefreshTokenServiceImpl
  infrastructure/hashing/bcrypt, infrastructure/persistence/jpa
  interfaces/acl/IamContextFacade
  interfaces/rest   AuthenticationController, UsersController, RolesController, AuthenticationExceptionHandler
```

## Domain

- `User` aggregate: username, password hash (absent for Google-only accounts), role, `AuthProvider`, external id (Google `sub`). `User.registeredLocally`, `registeredWithGoogle`, `linkGoogleAccount`, `hasLocalPassword`.
- `Role` entity limited to `OWNER_ROLE` and `TECHNICIAN_ROLE` (`Roles` enum; seeded on application start).
- `ClientChannel`: `WEB` admits owners, `MOBILE` admits technicians (`admits(user)`, `requiredFor(user)`, `forRole(role)`).
- `RefreshToken` entity: digest, expiry, revocation, rotation timestamp, channel; `rotate`, `isWithinGracePeriod`.

## Application

`UserCommandServiceImpl` handles: `SignInByLocalCommand`, `SignUpOwnerCommand`, `SignUpTechnicianCommand`, `SignInByGoogleCommand`, `LinkGoogleAccountCommand`, `CompleteGoogleOwnerRegistrationCommand`, `CompleteGoogleTechnicianRegistrationCommand`, `RefreshTokenCommand`, `SignOutCommand`, `PurgeExpiredRefreshTokensCommand`. Registration is transactional with profile creation: the profile is created through `ExternalProfileService`; a profile validation failure marks the transaction rollback-only and becomes `400 VALIDATION_ERROR`, a conflict becomes `409 PROFILE_CONFLICT`.

## Internal data flow, `POST /api/v1/authentication/sign-in/local`

`AuthenticationController.signIn` (bean validation on `SignInWithLocalResource`) -> `SignInByLocalCommandFromResourceAssembler` -> `UserCommandServiceImpl.handle(SignInByLocalCommand)`: find account by username or email (email resolved through `ExternalProfileService.fetchUserIdByEmail` -> `ProfilesContextFacade`) -> constant-time password check (BCrypt, dummy hash for unknown accounts) -> `enforceChannel` -> `openSession` (persists a refresh token digest, generates the HS512 access token with `role` claim) -> `ResponseEntityAssembler` -> `AuthenticatedUserResource` (`200`). Errors go through `ErrorResponseAssembler`; refresh-token errors through `AuthenticationExceptionHandler`.

## Infrastructure highlights

Stateless Spring Security chain; `SignInRateLimitFilter` before `BearerAuthorizationRequestFilter`; Google ID token validation with `NimbusJwtDecoder` (RS256, JWKS, issuer and audience validators); scheduled daily purge of expired refresh tokens.

## Interfaces

Controllers: `AuthenticationController` (10 endpoints), `UsersController` (2: own account only), `RolesController` (1: `GET /api/v1/roles` returns the role list, any authenticated user). Resources: 14 records/enums in `iam/interfaces/rest/resources`. `IamContextFacade` is the inbound ACL.

## Dependencies on other contexts

Outbound: `ExternalProfileService` -> `ProfilesContextFacade` (create owner/technician profile, email lookups). Inbound (callers of `IamContextFacade`): assets, device, monitoring, notifications, profiles, reporting, service.request, to map a token username to a user id.
