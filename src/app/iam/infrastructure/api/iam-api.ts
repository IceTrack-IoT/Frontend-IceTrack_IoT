import { Injectable } from '@angular/core';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import { isErrorResource } from '@shared/infrastructure/api/error.response';
import { UserApiEndpoint } from '@iam/infrastructure/api/user-api-endpoint';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { User } from '@iam/domain/model/user.entity';
import type { AuthenticationPort } from '@iam/application/ports/authentication.port';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import type { AuthenticationResult } from '@iam/application/contracts/authentication-result';
import {
  AuthenticationError,
  isAuthenticationErrorCode,
} from '@iam/application/contracts/authentication-error';
import { AuthenticatedUserAssembler } from '@iam/infrastructure/api/authenticated-user-assembler';
import { UserAssembler } from '@iam/infrastructure/api/user-assembler';
import { isAuthErrorResource } from '@iam/infrastructure/api/auth-error.response';
import type { SignInWithGoogleRequest } from '@iam/infrastructure/api/sign-in-with-google.request';
import type { RefreshTokenResource } from '@iam/infrastructure/api/refresh-token.request';
import { AuthenticationApiEndpoint } from '@iam/infrastructure/api/authentication-api-endpoint';

/**
 * IamApi is a service that provides methods to interact with the User API endpoint.
 * It implements the IAM AuthenticationPort.
 */
@Injectable({
  providedIn: 'root',
})
export class IamApi extends BaseApi implements AuthenticationPort {
  private readonly usersEndpoint: UserApiEndpoint;
  private readonly authenticationEndpoint: AuthenticationApiEndpoint;
  private readonly userAssembler = new UserAssembler();
  private readonly authenticatedUserAssembler = new AuthenticatedUserAssembler();

  /**
   * Creates an instance of IamApi.
   * @param http The HTTP client to use for making requests.
   */
  constructor(http: HttpClient) {
    super();
    this.usersEndpoint = new UserApiEndpoint(http);
    this.authenticationEndpoint = new AuthenticationApiEndpoint(http);
  }

  /**
   * Retrieves all users from the API.
   * @returns An Observable of an array of User entities.
   */
  getUsers(): Observable<User[]>{
    return this.usersEndpoint.getAll();
  }

  /**
   * Retrieves a user by ID from the API.
   * @param user The User entity containing the ID to fetch.
   * @returns An Observable of the User entity.
   */
  createUser(user: User): Observable<User> {
    return this.usersEndpoint.create(user);
  }

  /**
   * Updates a user in the API.
   *
   * @param user The User entity to update.
   */
  updateUser(user: User): Observable<User> {
    return this.usersEndpoint.update(user, user.id);
  }

  /**
   * Deletes a user by ID from the API.
   *
   * @param id The ID of the user to delete.
   */
  deleteUser(id: number): Observable<void> {
    return this.usersEndpoint.delete(id);
  }

  /**
   * Signs in with a Google credential. The Google ID token is only forwarded to the backend.
   *
   * @param credential The Google credential containing the ID token.
   * @returns An Observable of the AuthenticationResult.
   */
  signInWithGoogle(credential: GoogleCredential): Observable<AuthenticationResult> {
    const request: SignInWithGoogleRequest = { id_token: credential.idToken };
    return this.authenticationEndpoint.signInWithGoogle(request).pipe(
      map((resource) =>
        this.authenticatedUserAssembler.toAuthenticationResultFromResource(resource),
      ),
      catchError((error: unknown) => throwError(() => this.toAuthenticationError(error))),
    );
  }

  /**
   * Rotates the token pair with the given refresh token.
   *
   * @param refreshToken The current refresh token.
   * @returns An Observable of the AuthenticationResult with the new token pair.
   */
  refreshSession(refreshToken: string): Observable<AuthenticationResult> {
    const request: RefreshTokenResource = { refresh_token: refreshToken };
    return this.authenticationEndpoint.refreshToken(request).pipe(
      map((resource) =>
        this.authenticatedUserAssembler.toAuthenticationResultFromResource(resource),
      ),
      catchError((error: unknown) => throwError(() => this.toAuthenticationError(error))),
    );
  }

  /**
   * Revokes the refresh token on the backend.
   *
   * @param refreshToken The current refresh token, or null when none is known.
   */
  logout(refreshToken: string | null): Observable<void> {
    const request: RefreshTokenResource | null =
      refreshToken === null ? null : { refresh_token: refreshToken };
    return this.authenticationEndpoint.logout(request).pipe(map(() => undefined));
  }

  /**
   * Retrieves the authenticated user.
   *
   * @returns An Observable of the User entity.
   */
  getCurrentUser(): Observable<User> {
    return this.authenticationEndpoint
      .getCurrentUser()
      .pipe(map((resource) => this.userAssembler.toEntityFromCurrentUserResource(resource)));
  }

  /**
   * Maps definitive backend rejections to AuthenticationError using only the machine-readable `code`.
   * Any other error (network, server, unexpected status) is returned unchanged as transient.
   */
  private toAuthenticationError(error: unknown): unknown {
    if (!(error instanceof HttpErrorResponse)) {
      return error;
    }
    if (error.status === 401) {
      const code = isAuthErrorResource(error.error) ? error.error.code : null;
      return new AuthenticationError(
        isAuthenticationErrorCode(code) ? code : null,
        'The backend rejected the authentication request.',
      );
    }
    if (
      error.status === 404 &&
      isErrorResource(error.error) &&
      error.error.code === 'GOOGLE_ACCOUNT_NOT_FOUND'
    ) {
      return new AuthenticationError('GOOGLE_ACCOUNT_NOT_FOUND', 'The Google account is not registered.');
    }
    return error;
  }
}
