import { inject, Injectable } from '@angular/core';
import {
  catchError,
  defer,
  filter,
  finalize,
  map,
  type Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
  throwError,
  timeout,
} from 'rxjs';
import {
  AuthenticationError,
  isAuthenticationError,
} from '@iam/application/contracts/authentication-error';
import type { AuthenticationResult } from '@iam/application/contracts/authentication-result';
import { AuthenticationPort } from '@iam/application/ports/iam.port';
import { SessionStoragePort } from '@iam/application/ports/session-storage.port';
import { SessionSyncPort } from '@iam/application/ports/session-sync.port';
import { TokenExpirationPort } from '@iam/application/ports/token-expiration.port';
import {
  isAccessTokenExpired,
  resolveAccessTokenExpiresAt,
} from '@iam/application/state/access-token-expiration';
import { type ClientSession, createClientSession } from '@iam/application/state/client-session';

/**
 * Maximum time to wait for another tab to persist a refresh token it has just rotated. This is a local
 * coordination bound, unrelated to the backend concurrent-refresh grace window.
 */
const ROTATED_REFRESH_TOKEN_WAIT_MS = 5_000;

/**
 * Rotates the platform token pair using the newest persisted refresh token.
 *
 * - Runs at most one refresh request at a time in this tab; concurrent callers share it.
 * - Persists the rotated session before broadcasting `refresh-completed` to other tabs.
 * - Recovers once from `REFRESH_TOKEN_RECENTLY_ROTATED` with the newest refresh token persisted by
 *   another tab. Every other AuthenticationError is definitive: the persisted session is cleared and
 *   `session-cleared` is broadcast.
 * - Transient errors (network, server) leave the persisted session untouched.
 */
@Injectable({
  providedIn: 'root',
})
export class RefreshClientSessionUseCase {
  private readonly authentication = inject(AuthenticationPort);
  private readonly clientSessionStorage = inject(SessionStoragePort);
  private readonly sessionSync = inject(SessionSyncPort);
  private readonly tokenExpiration = inject(TokenExpirationPort);

  private inFlightRefresh: Observable<ClientSession> | null = null;

  /**
   * Rotates the token pair unconditionally (e.g. silent refresh at startup).
   * @returns An Observable of the refreshed client session.
   */
  execute(): Observable<ClientSession> {
    return defer(() => this.sharedRefresh());
  }

  /**
   * Obtains a usable session after the backend rejected an access token. When the persisted session
   * already holds a different, unexpired access token (another tab refreshed), it is returned without
   * rotating the token pair again.
   * @param rejectedAccessToken - The access token the backend rejected, or null when none was sent.
   * @returns An Observable of the usable client session.
   */
  executeAfterRejectedAccessToken(rejectedAccessToken: string | null): Observable<ClientSession> {
    return defer(() => {
      const stored = this.clientSessionStorage.load();
      if (
        stored !== null &&
        stored.accessToken !== rejectedAccessToken &&
        !isAccessTokenExpired(stored, Date.now())
      ) {
        return of(stored);
      }
      return this.sharedRefresh();
    });
  }

  private sharedRefresh(): Observable<ClientSession> {
    this.inFlightRefresh ??= this.refresh().pipe(
      finalize(() => (this.inFlightRefresh = null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.inFlightRefresh;
  }

  private refresh(): Observable<ClientSession> {
    return defer(() => {
      const stored = this.clientSessionStorage.load();
      if (stored === null) {
        return throwError(
          () => new AuthenticationError(null, 'There is no persisted session to refresh.'),
        );
      }
      this.sessionSync.publish('refresh-started');
      return this.authentication.refreshSession(stored.refreshToken).pipe(
        catchError((error: unknown) =>
          isAuthenticationError(error, 'REFRESH_TOKEN_RECENTLY_ROTATED')
            ? this.retryWithRotatedRefreshToken(stored.refreshToken, error)
            : throwError(() => error),
        ),
        map((result) => this.toClientSession(result)),
        tap((session) => {
          this.clientSessionStorage.save(session);
          this.sessionSync.publish('refresh-completed');
        }),
        catchError((error: unknown) => {
          if (isAuthenticationError(error)) {
            this.clientSessionStorage.clear();
            this.sessionSync.publish('session-cleared');
          }
          return throwError(() => error);
        }),
      );
    });
  }

  /**
   * Retries the refresh exactly once with the refresh token another tab rotated and persisted. The
   * already-used refresh token is never sent again, since replaying it can revoke every session.
   */
  private retryWithRotatedRefreshToken(
    usedRefreshToken: string,
    rotationError: AuthenticationError,
  ): Observable<AuthenticationResult> {
    return this.awaitNewerRefreshToken(usedRefreshToken).pipe(
      switchMap((refreshToken) =>
        refreshToken === null
          ? throwError(() => rotationError)
          : this.authentication.refreshSession(refreshToken),
      ),
    );
  }

  private awaitNewerRefreshToken(usedRefreshToken: string): Observable<string | null> {
    const readNewerRefreshToken = (): string | null => {
      const refreshToken = this.clientSessionStorage.load()?.refreshToken ?? null;
      return refreshToken !== usedRefreshToken ? refreshToken : null;
    };
    const newerRefreshToken = readNewerRefreshToken();
    if (newerRefreshToken !== null) {
      return of(newerRefreshToken);
    }
    return this.sessionSync.events.pipe(
      filter((event) => event === 'refresh-completed'),
      take(1),
      map(readNewerRefreshToken),
      timeout({ first: ROTATED_REFRESH_TOKEN_WAIT_MS, with: () => of(null) }),
    );
  }

  private toClientSession(result: AuthenticationResult): ClientSession {
    const declaredExpiresAt = this.tokenExpiration.readExpiresAt(result.accessToken);
    return createClientSession(result, resolveAccessTokenExpiresAt(declaredExpiresAt, Date.now()));
  }
}
