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
import { publicIamGuard } from './public-iam.guard';

class FakeIamStore {
  readonly currentUser = signal<User | null>(null);
  whenSessionResolved(): Observable<void> {
    return of(undefined);
  }
}

describe('publicIamGuard', () => {
  let store: FakeIamStore;

  function signInAs(role: Role): void {
    store.currentUser.set(new User({ id: 1, username: 'user', role, provider: AuthProvider.LOCAL }));
  }

  async function decisionFor(url: string): Promise<boolean | string> {
    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        publicIamGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
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

  it('allows every public IAM view without a session', async () => {
    for (const url of [
      '/iam/login',
      '/iam/register',
      '/iam/complete-google-registration',
      '/iam/unauthorized',
    ]) {
      expect(await decisionFor(url)).toBe(true);
    }
  });

  it('redirects owners to the dashboard, including from the unauthorized view', async () => {
    signInAs(Role.OWNER_ROLE);

    expect(await decisionFor('/iam/login')).toBe('/dashboard');
    expect(await decisionFor('/iam/unauthorized')).toBe('/dashboard');
  });

  it('redirects technicians to the technician redirect but lets them stay on the unauthorized view', async () => {
    signInAs(Role.TECHNICIAN_ROLE);

    expect(await decisionFor('/iam/register')).toBe('/iam/technician-redirect');
    expect(await decisionFor('/iam/unauthorized')).toBe(true);
  });

  it('redirects unsupported roles to the unauthorized view without looping on it', async () => {
    signInAs('ADMIN_ROLE' as unknown as Role);

    expect(await decisionFor('/iam/login')).toBe('/iam/unauthorized');
    expect(await decisionFor('/iam/unauthorized')).toBe(true);
  });
});
