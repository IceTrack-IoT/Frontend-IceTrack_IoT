import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type CanMatchFn, type GuardResult, provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, type Observable, of, Subject } from 'rxjs';
import { IamStore } from '@iam/application/iam-store';
import { User } from '@iam/domain/model/user.entity';
import { AuthProvider } from '@iam/domain/value-objects/auth-provider';
import { Role } from '@iam/domain/value-objects/role';
import { ownerOnlyGuard } from './owner-only.guard';

class FakeIamStore {
  readonly currentUser = signal<User | null>(null);
  restoration: Observable<void> = of(undefined);
  whenSessionResolved(): Observable<void> {
    return this.restoration;
  }
}

describe('ownerOnlyGuard', () => {
  let store: FakeIamStore;

  function signInAs(role: Role): void {
    store.currentUser.set(new User({ id: 1, username: 'user', role, provider: AuthProvider.LOCAL }));
  }

  function runGuard(): Observable<GuardResult> {
    return TestBed.runInInjectionContext(() =>
      ownerOnlyGuard({}, [], {} as Parameters<CanMatchFn>[2]),
    ) as Observable<GuardResult>;
  }

  async function decision(): Promise<boolean | string> {
    const result = await firstValueFrom(runGuard());
    return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result === true;
  }

  beforeEach(() => {
    store = new FakeIamStore();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: IamStore, useValue: store }],
    });
  });

  it('redirects to sign-in without a session', async () => {
    expect(await decision()).toBe('/iam/login');
  });

  it('allows owners', async () => {
    signInAs(Role.OWNER_ROLE);

    expect(await decision()).toBe(true);
  });

  it('redirects technicians to the technician redirect', async () => {
    signInAs(Role.TECHNICIAN_ROLE);

    expect(await decision()).toBe('/iam/technician-redirect');
  });

  it('redirects unsupported roles to the unauthorized view', async () => {
    signInAs('ADMIN_ROLE' as unknown as Role);

    expect(await decision()).toBe('/iam/unauthorized');
  });

  it('decides only once the session restoration completes', () => {
    const restoration = new Subject<void>();
    store.restoration = restoration;
    const decisions: GuardResult[] = [];

    runGuard().subscribe((result) => decisions.push(result));
    signInAs(Role.OWNER_ROLE);
    expect(decisions).toEqual([]);

    restoration.next();
    expect(decisions).toEqual([true]);
  });
});
