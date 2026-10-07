import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import type { SignInWithGoogleRequest } from '@iam/infrastructure/api/sign-in-with-google.request';
import { Observable } from 'rxjs';
import type { AuthenticatedUserResource } from '@iam/infrastructure/api/authenticated-user.response';
import { publicAuthenticationContext } from '@iam/infrastructure/http/authentication-http-context';
import { RefreshTokenResource } from '@iam/infrastructure/api/refresh-token.request';
import { CurrentUserResource } from '@iam/infrastructure/api/current-user.response';
import { catchError } from 'rxjs/operators';
import { handleError } from '@shared/infrastructure/http/handle-error-http';
import { SignInWithLocalRequest } from '@iam/infrastructure/api/sign-in-with-local.request';

export class AuthenticationApiEndpoint {
  private readonly signInLocallyEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderAuthenticationLocalEndpointPath}`;
  private readonly googleVerifyEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderAuthenticationGoogleVerifyEndpointPath}`;
  private readonly refreshTokenEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderRefreshTokensEndpointPath}`;
  private readonly logoutEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderLogoutEndpointPath}`;
  private readonly currentUserEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderMeEndpointPath}`;
  constructor(protected http: HttpClient) {}

  /**
   * Sends a local sign-in request to `POST /authentication/sign-in/local`.
   * @param request The SignInWithLocalRequest containing the username and password.
   * @returns An Observable of the AuthenticatedUserResource.
   */
  signInLocally(request: SignInWithLocalRequest): Observable<AuthenticatedUserResource> {
    return this.http.post <AuthenticatedUserResource>(this.signInLocallyEndpointUrl, request, {
      context: publicAuthenticationContext(),
    });
  }

  /**
   * Sends a Google ID token to `POST /authentication/google/verify`.
   * @param request The SignInWithGoogleRequest containing the Google ID token.
   * @returns An Observable of the AuthenticatedUserResource.
   */
  signInWithGoogle(request: SignInWithGoogleRequest): Observable<AuthenticatedUserResource> {
    return this.http.post<AuthenticatedUserResource>(this.googleVerifyEndpointUrl, request, {
      context: publicAuthenticationContext(),
    });
  }

  /**
   * Rotates the token pair through `POST /authentication/refresh-token`.
   * @param request The RefreshTokenResource containing the current refresh token.
   * @returns An Observable of the AuthenticatedUserResource with the new token pair.
   */
  refreshToken(request: RefreshTokenResource): Observable<AuthenticatedUserResource> {
    return this.http.post<AuthenticatedUserResource>(this.refreshTokenEndpointUrl, request, {
      context: publicAuthenticationContext(),
    });
  }

  /**
   * Revokes the refresh token through `POST /authentication/logout`, which answers 204.
   * @param request The optional RefreshTokenResource.
   * @returns An Observable that completes when the backend has answered.
   */
  logout(request: RefreshTokenResource | null): Observable<void> {
    return this.http.post<void>(this.logoutEndpointUrl, request, {
      context: publicAuthenticationContext(),
    });
  }

  /**
   * Retrieves the authenticated user through the protected `GET /authentication/me`.
   * @returns An Observable of the CurrentUserResource.
   */
  getCurrentUser(): Observable<CurrentUserResource> {
    return this.http
      .get<CurrentUserResource>(this.currentUserEndpointUrl)
      .pipe(catchError(handleError('Failed to fetch the current user')));
  }
}
