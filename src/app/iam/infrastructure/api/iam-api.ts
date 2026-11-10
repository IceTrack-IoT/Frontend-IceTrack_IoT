import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import { isErrorResource } from '@shared/infrastructure/api/error.response';
import type { User } from '@iam/domain/model/user.entity';
import type { AuthenticationPort } from '@iam/application/ports/iam.port';
import type { AuthenticationResult } from '@iam/application/contracts/authentication-result';
import {
  AuthenticationError,
  isAuthenticationErrorCode,
} from '@iam/application/contracts/authentication-error';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import type {
  GoogleOwnerRegistration,
  GoogleRegistrationProfile,
} from '@iam/application/contracts/google-registration';
import type { LocalCredential } from '@iam/application/contracts/local-credential';
import type { LocalSignUp, OwnerSignUp } from '@iam/application/contracts/local-sign-up';
import { isAuthErrorResponse } from '@iam/infrastructure/api/auth-error.response';
import { AuthenticatedUserAssembler } from '@iam/infrastructure/api/authenticated-user-assembler';
import type { AuthenticatedUserResponse } from '@iam/infrastructure/api/authenticated-user.response';
import { AuthenticationApiEndpoint } from '@iam/infrastructure/api/authentication-api-endpoint';
import { WEB_CLIENT_CHANNEL } from '@iam/infrastructure/api/client-channel.resource';
import type { CompleteGoogleOwnerRegistrationRequest } from '@iam/infrastructure/api/complete-google-owner-registration.request';
import type { LinkGoogleAccountRequest } from '@iam/infrastructure/api/link-google-account.request';
import type { RefreshTokenRequest } from '@iam/infrastructure/api/refresh-token.request';
import type { SignInWithGoogleRequest } from '@iam/infrastructure/api/sign-in-with-google.request';
import type { SignInWithLocalRequest } from '@iam/infrastructure/api/sign-in-with-local.request';
import type { SignUpOwnerRequest, SignUpRequest } from '@iam/infrastructure/api/sign-up.request';
import { UserAssembler } from '@iam/infrastructure/api/user-assembler';

/**
 * IamApi implements the IAM AuthenticationPort against the backend authentication endpoints.
 *
 * Every sign-in and refresh is sent with the `WEB` channel, which admits only owner accounts.
 */
@Injectable({
  providedIn: 'root',
})
export class IamApi extends BaseApi implements AuthenticationPort {
  private readonly authenticationEndpoint = new AuthenticationApiEndpoint(inject(HttpClient));
  private readonly userAssembler = new UserAssembler();
  private readonly authenticatedUserAssembler = new AuthenticatedUserAssembler();

  /**
   * Signs in locally with a username (or profile email) and password.
   *
   * @param credential The local credential containing the username and password.
   * @returns An Observable of the AuthenticationResult.
   */
  signInLocally(credential: LocalCredential): Observable<AuthenticationResult> {
    const request: SignInWithLocalRequest = {
      username: credential.username,
      password: credential.password,
      channel: WEB_CLIENT_CHANNEL,
    };
    return this.toAuthenticationResult(this.authenticationEndpoint.signInLocally(request));
  }

  /**
   * Registers a local owner account.
   *
   * @param signUp The owner registration data.
   * @returns An Observable of the registered User entity.
   */
  signUpOwner(signUp: OwnerSignUp): Observable<User> {
    const request: SignUpOwnerRequest = { ...this.toSignUpRequest(signUp), ruc: signUp.ruc };
    return this.authenticationEndpoint.signUpOwner(request).pipe(
      map((resource) => this.userAssembler.toEntityFromResource(resource)),
      catchError((error: unknown) => throwError(() => this.toAuthenticationError(error))),
    );
  }

  /**
   * Signs in with a Google credential. The Google ID token is only forwarded to the backend.
   *
   * @param credential The Google credential containing the ID token.
   * @returns An Observable of the AuthenticationResult.
   */
  signInWithGoogle(credential: GoogleCredential): Observable<AuthenticationResult> {
    const request: SignInWithGoogleRequest = {
      id_token: credential.idToken,
      channel: WEB_CLIENT_CHANNEL,
    };
    return this.toAuthenticationResult(this.authenticationEndpoint.signInWithGoogle(request));
  }

  /**
   * Links a Google identity to the existing password account that uses its email.
   *
   * @param credential The Google credential rejected with `ACCOUNT_LINK_REQUIRED`.
   * @param password The current local password of the existing account.
   * @returns An Observable of the AuthenticationResult of the linked account.
   */
  linkGoogleAccount(
    credential: GoogleCredential,
    password: string,
  ): Observable<AuthenticationResult> {
    const request: LinkGoogleAccountRequest = {
      id_token: credential.idToken,
      password,
      channel: WEB_CLIENT_CHANNEL,
    };
    return this.toAuthenticationResult(this.authenticationEndpoint.linkGoogleAccount(request));
  }

  /**
   * Completes the registration of an unregistered Google account as an owner.
   *
   * @param credential The Google credential rejected with `GOOGLE_ACCOUNT_NOT_FOUND`.
   * @param registration The owner onboarding data.
   * @returns An Observable of the AuthenticationResult of the new account.
   */
  completeGoogleOwnerRegistration(
    credential: GoogleCredential,
    registration: GoogleOwnerRegistration,
  ): Observable<AuthenticationResult> {
    const request: CompleteGoogleOwnerRegistrationRequest = {
      ...this.toGoogleRegistrationRequest(credential, registration),
      ruc: registration.ruc,
    };
    return this.toAuthenticationResult(
      this.authenticationEndpoint.completeGoogleOwnerRegistration(request),
    );
  }

  /**
   * Rotates the token pair with the given refresh token. The `WEB` channel is sent so that a session
   * opened from another application is never refreshed here.
   *
   * @param refreshToken The current refresh token.
   * @returns An Observable of the AuthenticationResult with the new token pair.
   */
  refreshSession(refreshToken: string): Observable<AuthenticationResult> {
    const request: RefreshTokenRequest = {
      refresh_token: refreshToken,
      channel: WEB_CLIENT_CHANNEL,
    };
    return this.toAuthenticationResult(this.authenticationEndpoint.refreshToken(request));
  }

  /**
   * Revokes the refresh token on the backend.
   *
   * @param refreshToken The current refresh token.
   */
  logout(refreshToken: string): Observable<void> {
    const request: RefreshTokenRequest = { refresh_token: refreshToken };
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
      .pipe(map((resource) => this.userAssembler.toEntityFromCurrentUserResponse(resource)));
  }

  private toAuthenticationResult(
    response: Observable<AuthenticatedUserResponse>,
  ): Observable<AuthenticationResult> {
    return response.pipe(
      map((resource) =>
        this.authenticatedUserAssembler.toAuthenticationResultFromResponse(resource),
      ),
      catchError((error: unknown) => throwError(() => this.toAuthenticationError(error))),
    );
  }

  private toSignUpRequest(signUp: LocalSignUp): SignUpRequest {
    return {
      username: signUp.username,
      password: signUp.password,
      email: signUp.email,
      full_name: signUp.fullName,
      phone: signUp.phone,
      street: signUp.street,
      number: signUp.number,
      city: signUp.city,
      postal_code: signUp.postalCode,
      country: signUp.country,
    };
  }

  private toGoogleRegistrationRequest(
    credential: GoogleCredential,
    profile: GoogleRegistrationProfile,
  ): Omit<CompleteGoogleOwnerRegistrationRequest, 'ruc'> {
    return {
      id_token: credential.idToken,
      username: profile.username,
      phone: profile.phone,
      street: profile.street,
      number: profile.number,
      city: profile.city,
      postal_code: profile.postalCode,
      country: profile.country,
    };
  }

  /**
   * Maps a definitive backend rejection (any 4xx answer) to AuthenticationError, keeping only the
   * machine-readable `code` of the standard error body or of the refresh-token error body. The code is
   * null when the backend sent an unrecognized one. Backend messages and details are never carried over.
   * Any other error (network failure, server error) is returned unchanged as transient.
   */
  private toAuthenticationError(error: unknown): unknown {
    if (!(error instanceof HttpErrorResponse) || error.status < 400 || error.status >= 500) {
      return error;
    }
    const body: unknown = error.error;
    const code = isErrorResource(body) || isAuthErrorResponse(body) ? body.code : null;
    return new AuthenticationError(
      isAuthenticationErrorCode(code) ? code : null,
      `The backend rejected the authentication request (HTTP ${error.status}).`,
    );
  }
}
