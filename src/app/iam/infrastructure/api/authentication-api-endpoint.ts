import type { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '@env/environment';
import { handleError } from '@shared/infrastructure/http/handle-error-http';
import { publicAuthenticationContext } from '@iam/infrastructure/http/authentication-http-context';
import type { AuthenticatedUserResponse } from '@iam/infrastructure/api/authenticated-user.response';
import type { CompleteGoogleOwnerRegistrationRequest } from '@iam/infrastructure/api/complete-google-owner-registration.request';
import type { CurrentUserResponse } from '@iam/infrastructure/api/current-user.response';
import type { LinkGoogleAccountRequest } from '@iam/infrastructure/api/link-google-account.request';
import type { RefreshTokenRequest } from '@iam/infrastructure/api/refresh-token.request';
import type { SignInWithGoogleRequest } from '@iam/infrastructure/api/sign-in-with-google.request';
import type { SignInWithLocalRequest } from '@iam/infrastructure/api/sign-in-with-local.request';
import type { SignUpOwnerRequest } from '@iam/infrastructure/api/sign-up.request';
import type { UserResource } from '@iam/infrastructure/api/user.response';

/**
 * AuthenticationApiEndpoint sends the requests of the IAM `AuthenticationController`. Every
 * `POST /authentication/...` endpoint is anonymous: it never carries the bearer token and its 401 never
 * triggers a session refresh.
 */
export class AuthenticationApiEndpoint {
  private readonly signInLocallyEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderAuthenticationLocalEndpointPath}`;
  private readonly signUpOwnerEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderSignUpOwnerEndpointPath}`;
  private readonly googleVerifyEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderAuthenticationGoogleVerifyEndpointPath}`;
  private readonly linkGoogleAccountEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderLinkGoogleAccountEndpointPath}`;
  private readonly completeGoogleOwnerRegistrationEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderCompleteRegistrationOwnerEndpointPath}`;
  private readonly refreshTokenEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderRefreshTokensEndpointPath}`;
  private readonly logoutEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderLogoutEndpointPath}`;
  private readonly currentUserEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderMeEndpointPath}`;

  constructor(protected http: HttpClient) {}

  /**
   * Sends a local sign-in request to `POST /authentication/sign-in/local`.
   * @param request The SignInWithLocalRequest containing the username, password and channel.
   * @returns An Observable of the AuthenticatedUserResponse.
   */
  signInLocally(request: SignInWithLocalRequest): Observable<AuthenticatedUserResponse> {
    return this.http.post<AuthenticatedUserResponse>(this.signInLocallyEndpointUrl, request, {
      context: publicAuthenticationContext(),
    });
  }

  /**
   * Registers a local owner through `POST /authentication/sign-up/owner`, which answers 201.
   * @param request The SignUpOwnerRequest.
   * @returns An Observable of the registered UserResource.
   */
  signUpOwner(request: SignUpOwnerRequest): Observable<UserResource> {
    return this.http.post<UserResource>(this.signUpOwnerEndpointUrl, request, {
      context: publicAuthenticationContext(),
    });
  }

  /**
   * Sends a Google ID token to `POST /authentication/google/verify`.
   * @param request The SignInWithGoogleRequest containing the Google ID token and channel.
   * @returns An Observable of the AuthenticatedUserResponse.
   */
  signInWithGoogle(request: SignInWithGoogleRequest): Observable<AuthenticatedUserResponse> {
    return this.http.post<AuthenticatedUserResponse>(this.googleVerifyEndpointUrl, request, {
      context: publicAuthenticationContext(),
    });
  }

  /**
   * Links a Google identity to an existing password account through
   * `POST /authentication/google/link`.
   * @param request The LinkGoogleAccountRequest containing the Google ID token, password and channel.
   * @returns An Observable of the AuthenticatedUserResponse of the linked account.
   */
  linkGoogleAccount(request: LinkGoogleAccountRequest): Observable<AuthenticatedUserResponse> {
    return this.http.post<AuthenticatedUserResponse>(this.linkGoogleAccountEndpointUrl, request, {
      context: publicAuthenticationContext(),
    });
  }

  /**
   * Completes a Google owner registration through
   * `POST /authentication/google/complete-registration/owner`, which answers 201.
   * @param request The CompleteGoogleOwnerRegistrationRequest.
   * @returns An Observable of the AuthenticatedUserResponse of the new account.
   */
  completeGoogleOwnerRegistration(
    request: CompleteGoogleOwnerRegistrationRequest,
  ): Observable<AuthenticatedUserResponse> {
    return this.http.post<AuthenticatedUserResponse>(
      this.completeGoogleOwnerRegistrationEndpointUrl,
      request,
      { context: publicAuthenticationContext() },
    );
  }

  /**
   * Rotates the token pair through `POST /authentication/refresh-token`.
   * @param request The RefreshTokenRequest containing the current refresh token.
   * @returns An Observable of the AuthenticatedUserResponse with the new token pair.
   */
  refreshToken(request: RefreshTokenRequest): Observable<AuthenticatedUserResponse> {
    return this.http.post<AuthenticatedUserResponse>(this.refreshTokenEndpointUrl, request, {
      context: publicAuthenticationContext(),
    });
  }

  /**
   * Revokes the refresh token through `POST /authentication/logout`, which answers 204 with no body.
   * @param request The RefreshTokenRequest containing the refresh token to revoke.
   * @returns An Observable that completes when the backend has answered.
   */
  logout(request: RefreshTokenRequest): Observable<void> {
    return this.http.post<void>(this.logoutEndpointUrl, request, {
      context: publicAuthenticationContext(),
    });
  }

  /**
   * Retrieves the authenticated user through the protected `GET /authentication/me`.
   * @returns An Observable of the CurrentUserResponse.
   */
  getCurrentUser(): Observable<CurrentUserResponse> {
    return this.http
      .get<CurrentUserResponse>(this.currentUserEndpointUrl)
      .pipe(catchError(handleError('Failed to fetch the current user')));
  }
}
