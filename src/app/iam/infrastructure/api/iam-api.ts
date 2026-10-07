import { Injectable } from '@angular/core';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import { isErrorResource, readErrorMessage } from '@shared/infrastructure/api/error.response';
import { UserApiEndpoint } from '@iam/infrastructure/api/user-api-endpoint';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { User } from '@iam/domain/model/user.entity';
import type { AuthenticationPort } from '@iam/application/ports/authentication.port';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import type { AuthenticationResult } from '@iam/application/contracts/authentication-result';
import {
  AuthenticationError,
  type AuthenticationErrorCode,
  isAuthenticationErrorCode,
} from '@iam/application/contracts/authentication-error';
import { AuthenticatedUserAssembler } from '@iam/infrastructure/api/authenticated-user-assembler';
import { UserAssembler } from '@iam/infrastructure/api/user-assembler';
import { isAuthErrorResource } from '@iam/infrastructure/api/auth-error.response';
import type { SignInWithGoogleRequest } from '@iam/infrastructure/api/sign-in-with-google.request';
import type { RefreshTokenResource } from '@iam/infrastructure/api/refresh-token.request';
import { AuthenticationApiEndpoint } from '@iam/infrastructure/api/authentication-api-endpoint';
import { LocalCredential } from '@iam/application/contracts/local-credential';
import { SignInWithLocalRequest } from '@iam/infrastructure/api/sign-in-with-local.request';
import type {
  LocalSignUp,
  OwnerSignUp,
  TechnicianSignUp,
} from '@iam/application/contracts/local-sign-up';
import type {
  SignUpOwnerRequest,
  SignUpRequest,
  SignUpTechnicianRequest,
} from '@iam/infrastructure/api/sign-up.request';
import type {
  GoogleOwnerRegistration,
  GoogleRegistrationProfile,
  GoogleTechnicianRegistration,
} from '@iam/application/contracts/google-registration';
import type { CompleteGoogleOwnerRegistrationRequest } from '@iam/infrastructure/api/complete-google-owner-registration.request';
import type { CompleteGoogleTechnicianRegistrationRequest } from '@iam/infrastructure/api/complete-google-technician-registration.request';

/**
 * ErrorResource codes with which `POST /authentication/sign-in/local` rejects a request.
 */
const LOCAL_SIGN_IN_REJECTION_CODES: readonly AuthenticationErrorCode[] = [
  'VALIDATION_ERROR',
  'USER_NOT_FOUND',
  'BUSINESS_RULE_VIOLATION',
];

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
  getUsers(): Observable<User[]> {
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
   * Signs in locally with a username and password.
   *
   * @param credential The local credential containing the username and password.
   * @returns An Observable of the AuthenticationResult.
   */
  signInLocally(credential: LocalCredential): Observable<AuthenticationResult> {
    const request: SignInWithLocalRequest = {
      username: credential.username,
      password: credential.password,
    };
    return this.authenticationEndpoint.signInLocally(request).pipe(
      map((resource) =>
        this.authenticatedUserAssembler.toAuthenticationResultFromResource(resource),
      ),
      catchError((error: unknown) => throwError(() => this.toLocalSignInError(error))),
    );
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
      catchError((error: unknown) => throwError(() => this.toRegistrationError(error))),
    );
  }

  /**
   * Registers a local technician account.
   *
   * @param signUp The technician registration data.
   * @returns An Observable of the registered User entity.
   */
  signUpTechnician(signUp: TechnicianSignUp): Observable<User> {
    const request: SignUpTechnicianRequest = {
      ...this.toSignUpRequest(signUp),
      speciality: signUp.speciality,
      certification_number: signUp.certificationNumber,
    };
    return this.authenticationEndpoint.signUpTechnician(request).pipe(
      map((resource) => this.userAssembler.toEntityFromResource(resource)),
      catchError((error: unknown) => throwError(() => this.toRegistrationError(error))),
    );
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
    return this.authenticationEndpoint.completeGoogleOwnerRegistration(request).pipe(
      map((resource) =>
        this.authenticatedUserAssembler.toAuthenticationResultFromResource(resource),
      ),
      catchError((error: unknown) => throwError(() => this.toRegistrationError(error))),
    );
  }

  /**
   * Completes the registration of an unregistered Google account as a technician.
   *
   * @param credential The Google credential rejected with `GOOGLE_ACCOUNT_NOT_FOUND`.
   * @param registration The technician onboarding data.
   * @returns An Observable of the AuthenticationResult of the new account.
   */
  completeGoogleTechnicianRegistration(
    credential: GoogleCredential,
    registration: GoogleTechnicianRegistration,
  ): Observable<AuthenticationResult> {
    const request: CompleteGoogleTechnicianRegistrationRequest = {
      ...this.toGoogleRegistrationRequest(credential, registration),
      speciality: registration.speciality,
      certification_number: registration.certificationNumber,
    };
    return this.authenticationEndpoint.completeGoogleTechnicianRegistration(request).pipe(
      map((resource) =>
        this.authenticatedUserAssembler.toAuthenticationResultFromResource(resource),
      ),
      catchError((error: unknown) => throwError(() => this.toRegistrationError(error))),
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
   * Maps local sign-in rejections to AuthenticationError using only the ErrorResource `code`, for any
   * 4xx status (the status of `BUSINESS_RULE_VIOLATION` is not part of the confirmed contract):
   * - `VALIDATION_ERROR` (400): blank fields or a wrong username/password;
   * - `USER_NOT_FOUND` (404): no user matches the username;
   * - `BUSINESS_RULE_VIOLATION`: the account is federated and must sign in with its provider.
   * The backend message is kept for display only. Anything else falls back to toAuthenticationError.
   */
  private toLocalSignInError(error: unknown): unknown {
    if (
      error instanceof HttpErrorResponse &&
      error.status >= 400 &&
      error.status < 500 &&
      isErrorResource(error.error)
    ) {
      const body = error.error;
      const code = LOCAL_SIGN_IN_REJECTION_CODES.find((rejection) => rejection === body.code);
      if (code !== undefined) {
        return new AuthenticationError(
          code,
          readErrorMessage(body) ?? 'The backend rejected the local sign-in request.',
        );
      }
    }
    return this.toAuthenticationError(error);
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
      phone: profile.phone,
      street: profile.street,
      number: profile.number,
      city: profile.city,
      postal_code: profile.postalCode,
      country: profile.country,
    };
  }

  /**
   * Maps any 4xx rejection of a registration request (local sign-up or Google registration
   * completion, e.g. 400 invalid form or ID token, 409 username/email/profile already taken) to
   * AuthenticationError, keeping the backend message for display. The code is kept only when it is a
   * known AuthenticationErrorCode.
   *
   * TODO: Confirm the registration error codes with the backend (e.g. the 409 conflict code).
   */
  private toRegistrationError(error: unknown): unknown {
    if (!(error instanceof HttpErrorResponse) || error.status < 400 || error.status >= 500) {
      return error;
    }
    const code = isErrorResource(error.error) ? error.error.code : null;
    return new AuthenticationError(
      isAuthenticationErrorCode(code) ? code : null,
      readErrorMessage(error.error) ??
        `The backend rejected the registration request (HTTP ${error.status}).`,
    );
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
      return new AuthenticationError(
        'GOOGLE_ACCOUNT_NOT_FOUND',
        'The Google account is not registered.',
      );
    }
    return error;
  }
}
