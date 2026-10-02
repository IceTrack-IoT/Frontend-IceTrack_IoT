import { BaseApiEndpoint } from '@shared/infrastructure/api/base-api-endpoint';
import { User } from '@iam/domain/model/user.entity';
import { UserResource, UserResponse } from '@iam/infrastructure/api/user.response';
import { UserAssembler } from '@iam/infrastructure/api/user-assembler';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { catchError, Observable } from 'rxjs';
import type { SignInWithGoogleRequest } from '@iam/infrastructure/api/sign-in-with-google.request';
import type { AuthenticatedUserResource } from '@iam/infrastructure/api/authenticated-user.response';
import type { CurrentUserResource } from '@iam/infrastructure/api/current-user.response';
import type { RefreshTokenResource } from '@iam/infrastructure/api/refresh-token.request';
import { publicAuthenticationContext } from '@iam/infrastructure/http/authentication-http-context';

/**
 * UserApiEndpoint is responsible for handling API operations related to User entities.
 *
 * Authentication commands propagate the raw HttpErrorResponse so their error codes can be mapped.
 */
export class UserApiEndpoint extends BaseApiEndpoint<User, UserResource, UserResponse, UserAssembler> {
  private readonly googleVerifyEndpointUrl =
    `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderAuthenticationGoogleVerifyEndpointPath}`;
  private readonly refreshTokenEndpointUrl =
    `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderRefreshTokensEndpointPath}`;
  private readonly logoutEndpointUrl =
    `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderLogoutEndpointPath}`;
  private readonly currentUserEndpointUrl =
    `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderMeEndpointPath}`;

  constructor(http: HttpClient) {
    super(http, `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderUsersEndpointPath}`,
      new UserAssembler());
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
    return this.http.get<CurrentUserResource>(this.currentUserEndpointUrl).pipe(
      catchError(this.handleError('Failed to fetch the current user'))
    );
  }
}
