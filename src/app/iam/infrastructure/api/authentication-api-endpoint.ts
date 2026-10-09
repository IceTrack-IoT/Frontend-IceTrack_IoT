import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import type { SignInWithGoogleRequest } from '@iam/infrastructure/api/sign-in-with-google.request';
import { Observable } from 'rxjs';
import type { AuthenticatedUserResponse } from '@iam/infrastructure/api/authenticated-user.response';
import { publicAuthenticationContext } from '@iam/infrastructure/http/authentication-http-context';
import { RefreshTokenRequest } from '@iam/infrastructure/api/refresh-token.request';
import { CurrentUserResponse } from '@iam/infrastructure/api/current-user.response';
import { catchError } from 'rxjs/operators';
import { handleError } from '@shared/infrastructure/http/handle-error-http';
import { SignInWithLocalRequest } from '@iam/infrastructure/api/sign-in-with-local.request';
import type {
  SignUpOwnerRequest,
} from '@iam/infrastructure/api/sign-up.request';
import type { UserResource } from '@iam/infrastructure/api/user.response';
import type { CompleteGoogleOwnerRegistrationRequest } from '@iam/infrastructure/api/complete-google-owner-registration.request';

export class AuthenticationApiEndpoint {
  private readonly signInLocallyEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderAuthenticationLocalEndpointPath}`;
  private readonly signUpOwnerEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderSignUpOwnerEndpointPath}`;
  private readonly googleVerifyEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderAuthenticationGoogleVerifyEndpointPath}`;
  private readonly completeGoogleOwnerRegistrationEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderCompleteRegistrationOwnerEndpointPath}`;
  private readonly refreshTokenEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderRefreshTokensEndpointPath}`;
  private readonly logoutEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderLogoutEndpointPath}`;
  private readonly currentUserEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderMeEndpointPath}`;
  constructor(protected http: HttpClient) {}

  /**
   * Sends a local sign-in request to `POST /authentication/sign-in/local`.
   * @param request The SignInWithLocalRequest containing the username and password.
   * @returns An Observable of the AuthenticatedUserResponse.
   */
  signInLocally(request: SignInWithLocalRequest): Observable<AuthenticatedUserResponse> {
    return this.http.post<AuthenticatedUserResponse>(this.signInLocallyEndpointUrl, request, {
      context: publicAuthenticationContext(),
    });
  }

  /**
   * Registers a local owner through `POST /authentication/sign-up/owner`.
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
   * @param request The SignInWithGoogleRequest containing the Google ID token.
   * @returns An Observable of the AuthenticatedUserResponse.
   */
  signInWithGoogle(request: SignInWithGoogleRequest): Observable<AuthenticatedUserResponse> {
    return this.http.post<AuthenticatedUserResponse>(this.googleVerifyEndpointUrl, request, {
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
   * Revokes the refresh token through `POST /authentication/logout`, which answers 204.
   * @param request The optional RefreshTokenRequest.
   * @returns An Observable that completes when the backend has answered.
   */
  logout(request: RefreshTokenRequest | null): Observable<void> {
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
