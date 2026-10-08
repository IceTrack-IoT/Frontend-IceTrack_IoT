import {
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { IamStore } from '@iam/application/iam-store';
import { AuthenticationPort } from '@iam/application/ports/iam.port';
import { SessionStoragePort } from '@iam/application/ports/session-storage.port';
import { SessionSyncPort } from '@iam/application/ports/session-sync.port';
import { TokenExpirationPort } from '@iam/application/ports/token-expiration.port';
import { IamApi } from '@iam/infrastructure/api/iam-api';
import { BrowserClientSessionStorage } from '@iam/infrastructure/storage/browser-client-session-storage';
import { BrowserSessionSync } from '@iam/infrastructure/sync/browser-session-sync';
import { JwtTokenExpiration } from '@iam/infrastructure/token/jwt-token-expiration';

/**
 * Binds the IAM application ports to their infrastructure adapters and starts the silent session
 * refresh at startup. The startup refresh does not block bootstrap; `IamStore.restoring` reports it.
 */
export function provideIam(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AuthenticationPort, useExisting: IamApi },
    { provide: SessionStoragePort, useExisting: BrowserClientSessionStorage },
    { provide: SessionSyncPort, useExisting: BrowserSessionSync },
    { provide: TokenExpirationPort, useExisting: JwtTokenExpiration },
    provideAppInitializer(() => inject(IamStore).restoreSession()),
  ]);
}
