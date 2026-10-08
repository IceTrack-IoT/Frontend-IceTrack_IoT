import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  type GuardResult,
  provideRouter,
  Router,
  type RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, type Observable, of } from 'rxjs';
import { IamStore } from '@iam/application/iam-store';
import { User } from '@iam/domain/model/user.entity';
import { AuthProvider } from '@iam/domain/value-objects/auth-provider';
import { Role } from '@iam/domain/value-objects/role';
import { technicianRedirectGuard } from './technician-redirect.guard';

class FakeIamStore {
  readonly currentUser = signal<User | null>(null);
  whenSessionResolved(): Observable<void> {
    return of(undefined);
  }
}

describe('technicianRedirectGuard', () => {
  let store: FakeIamStore;

  function signInAs(role: Role): void {
    store.currentUser.set(new User({ id: 1, username: 'user', role, provider: AuthProvider.LOCAL }));
  }

  async function decision(): Promise<boolean | string> {
    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        technicianRedirectGuard(
          {} as ActivatedRouteSnapshot,
          { url: '/iam/technician-redirect' } as RouterStateSnapshot,
        ),
      ) as Observable<GuardResult>,
    );
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

  it('allows technicians', async () => {
    signInAs(Role.TECHNICIAN_ROLE);

    expect(await decision()).toBe(true);
  });

  it('redirects owners to the dashboard', async () => {
    signInAs(Role.OWNER_ROLE);

    expect(await decision()).toBe('/dashboard');
  });

  it('redirects unsupported roles to the unauthorized view', async () => {
    signInAs('ADMIN_ROLE' as unknown as Role);

    expect(await decision()).toBe('/iam/unauthorized');
  });
});
