import { inject } from '@angular/core';
import { HttpErrorResponse, type HttpInterceptorFn, type HttpRequest } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { IamStore } from '@iam/application/iam-store';
import {
  RETRIED_AFTER_REFRESH,
  SKIP_AUTHENTICATION,
  SKIP_REFRESH,
} from '@iam/infrastructure/http/authentication-http-context';

const apiBaseUrl = environment.iceTrackProviderApiBaseUrl;
const authenticationBaseUrl = `${apiBaseUrl}/authentication/`;

/**
 * Attaches the platform bearer token to protected API requests and, on their first 401, waits for the
 * shared session refresh and retries the original request exactly once.
 *
 * Public authentication endpoints (every `POST /authentication/...`) never carry a bearer token and
 * never trigger a refresh. Tokens are obtained from the IAM application layer, never from storage.
 */
export const authenticationInterceptor: HttpInterceptorFn = (request, next) => {
  if (!requiresAuthentication(request)) {
    return next(request);
  }
  const iamStore = inject(IamStore);
  const accessToken = iamStore.accessToken();

  return next(withBearerToken(request, accessToken)).pipe(
    catchError((error: unknown) => {
      if (!canRefreshAfter(error, request)) {
        return throwError(() => error);
      }
      request.context.set(RETRIED_AFTER_REFRESH, true);
      return iamStore.refreshSession(accessToken).pipe(
        catchError(() => throwError(() => error)),
        switchMap((session) => next(withBearerToken(request, session.accessToken))),
      );
    }),
  );
};

function requiresAuthentication(request: HttpRequest<unknown>): boolean {
  return (
    isPlatformApiRequest(request) &&
    !isPublicAuthenticationRequest(request) &&
    !request.context.get(SKIP_AUTHENTICATION)
  );
}

function isPlatformApiRequest(request: HttpRequest<unknown>): boolean {
  return request.url === apiBaseUrl || request.url.startsWith(`${apiBaseUrl}/`);
}

function isPublicAuthenticationRequest(request: HttpRequest<unknown>): boolean {
  return request.method === 'POST' && request.url.startsWith(authenticationBaseUrl);
}

function canRefreshAfter(error: unknown, request: HttpRequest<unknown>): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 401 &&
    !request.context.get(SKIP_REFRESH) &&
    !request.context.get(RETRIED_AFTER_REFRESH)
  );
}

function withBearerToken(
  request: HttpRequest<unknown>,
  accessToken: string | null,
): HttpRequest<unknown> {
  return accessToken === null
    ? request
    : request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
}
