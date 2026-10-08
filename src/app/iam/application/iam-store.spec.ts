import { TestBed } from '@angular/core/testing';
import { NEVER, Subject } from 'rxjs';
import { IamStore } from '@iam/application/iam-store';
import type { ClientSession } from '@iam/application/state/client-session';
import { CompleteGoogleRegistrationUseCase } from '@iam/application/use-cases/complete-google-registration.use-case';
import { LoadCurrentUserUseCase } from '@iam/application/use-cases/load-current-user.use-case';
import { RefreshClientSessionUseCase } from '@iam/application/use-cases/refresh-client-session.use-case';
import { RestoreClientSessionUseCase } from '@iam/application/use-cases/restore-client-session.use-case';
import { SignInLocallyUseCase } from '@iam/application/use-cases/sign-in-locally.use-case';
import { SignInWithGoogleUseCase } from '@iam/application/use-cases/sign-in-with-google.use-case';
import { SignOutUseCase } from '@iam/application/use-cases/sign-out.use-case';
import { SignUpOwnerUseCase } from '@iam/application/use-cases/sign-up-owner.use-case';
import { SynchronizeClientSessionUseCase } from '@iam/application/use-cases/synchronize-client-session.use-case';

describe('IamStore.whenSessionResolved', () => {
  let restoration: Subject<ClientSession | null>;
  let store: IamStore;

  beforeEach(() => {
    restoration = new Subject<ClientSession | null>();
    TestBed.configureTestingModule({
      providers: [
        { provide: RestoreClientSessionUseCase, useValue: { execute: () => restoration } },
        { provide: SynchronizeClientSessionUseCase, useValue: { execute: () => NEVER } },
        { provide: RefreshClientSessionUseCase, useValue: {} },
        { provide: SignInLocallyUseCase, useValue: {} },
        { provide: SignUpOwnerUseCase, useValue: {} },
        { provide: SignInWithGoogleUseCase, useValue: {} },
        { provide: CompleteGoogleRegistrationUseCase, useValue: {} },
        { provide: LoadCurrentUserUseCase, useValue: {} },
        { provide: SignOutUseCase, useValue: {} },
      ],
    });
    store = TestBed.inject(IamStore);
  });

  it('resolves immediately when no restoration is running', () => {
    let resolved = false;

    store.whenSessionResolved().subscribe(() => (resolved = true));

    expect(resolved).toBe(true);
  });

  it('resolves once the running restoration completes', () => {
    store.restoreSession();
    let resolved = false;

    store.whenSessionResolved().subscribe(() => (resolved = true));
    TestBed.tick();
    expect(resolved).toBe(false);

    restoration.next(null);
    restoration.complete();
    TestBed.tick();
    expect(resolved).toBe(true);
  });
});
