import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type RedirectFunction, type UrlTree } from '@angular/router';
import { firstValueFrom, type Observable, of, Subject } from 'rxjs';
import { IamStore } from '@iam/application/iam-store';
import { User } from '@iam/domain/model/user.entity';
import { AuthProvider } from '@iam/domain/value-objects/auth-provider';
import { Role } from '@iam/domain/value-objects/role';
import { authenticatedLandingRedirect } from './authenticated-landing.redirect';

class FakeIamStore {
  readonly currentUser = signal<User | null>(null);
  restoration: Observable<void> = of(undefined);
  whenSessionResolved(): Observable<void> {
    return this.restoration;
  }
}

describe('authenticatedLandingRedirect', () => {
  let store: FakeIamStore;

  function signInAs(role: Role): void {
    store.currentUser.set(new User({ id: 1, username: 'user', role, provider: AuthProvider.LOCAL }));
  }

  function redirect(): Observable<string | UrlTree> {
    return TestBed.runInInjectionContext(() =>
      authenticatedLandingRedirect({} as Parameters<RedirectFunction>[0]),
    ) as Observable<string | UrlTree>;
  }

  beforeEach(() => {
    store = new FakeIamStore();
    TestBed.configureTestingModule({ providers: [{ provide: IamStore, useValue: store }] });
  });

  it('redirects to sign-in without a session', async () => {
    expect(await firstValueFrom(redirect())).toBe('/iam/login');
  });

  it('redirects owners to the dashboard', async () => {
    signInAs(Role.OWNER_ROLE);

    expect(await firstValueFrom(redirect())).toBe('/dashboard');
  });

  it('redirects technicians to the technician redirect', async () => {
    signInAs(Role.TECHNICIAN_ROLE);

    expect(await firstValueFrom(redirect())).toBe('/iam/technician-redirect');
  });

  it('redirects unsupported roles to the unauthorized view', async () => {
    signInAs('ADMIN_ROLE' as unknown as Role);

    expect(await firstValueFrom(redirect())).toBe('/iam/unauthorized');
  });

  it('decides only once the session restoration completes', () => {
    const restoration = new Subject<void>();
    store.restoration = restoration;
    const targets: (string | UrlTree)[] = [];

    redirect().subscribe((target) => targets.push(target));
    signInAs(Role.TECHNICIAN_ROLE);
    expect(targets).toEqual([]);

    restoration.next();
    expect(targets).toEqual(['/iam/technician-redirect']);
  });
});
