import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { NEVER, type Observable, of } from 'rxjs';
import { IamStore } from '@iam/application/iam-store';
import { User } from '@iam/domain/model/user.entity';
import { AuthProvider } from '@iam/domain/value-objects/auth-provider';
import { Role } from '@iam/domain/value-objects/role';
import { GoogleIdentityServices } from '@iam/infrastructure/google/google-identity-services';
import { routes } from './app.routes';

class FakeIamStore {
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly restoring = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorCode = signal(null);
  readonly googleRegistrationRequired = signal(false);
  readonly clearFeedback = vi.fn();
  readonly signOut = vi.fn();
  whenSessionResolved(): Observable<void> {
    return of(undefined);
  }
}

describe('app routes', () => {
  let store: FakeIamStore;
  let harness: RouterTestingHarness | null;

  function signInAs(role: Role): void {
    store.currentUser.set(new User({ id: 1, username: 'user', role, provider: AuthProvider.LOCAL }));
  }

  async function navigate(url: string): Promise<string> {
    harness ??= await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return TestBed.inject(Router).url;
  }

  beforeEach(() => {
    harness = null;
    store = new FakeIamStore();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideTranslateService(),
        { provide: IamStore, useValue: store },
        {
          provide: GoogleIdentityServices,
          useValue: { credentials: NEVER, renderButton: () => Promise.resolve() },
        },
      ],
    });
  });

  it('sends anonymous users from the root and from owner routes to sign-in', async () => {
    expect(await navigate('/')).toBe('/iam/login');
    expect(await navigate('/dashboard')).toBe('/iam/login');
  });

  it('lands owners on the dashboard and keeps them out of the technician redirect', async () => {
    signInAs(Role.OWNER_ROLE);

    expect(await navigate('/')).toBe('/dashboard');
    expect(await navigate('/iam/login')).toBe('/dashboard');
    expect(await navigate('/iam/technician-redirect')).toBe('/dashboard');
  });

  it('keeps technicians out of owner routes and public IAM views', async () => {
    signInAs(Role.TECHNICIAN_ROLE);

    expect(await navigate('/')).toBe('/iam/technician-redirect');
    expect(await navigate('/dashboard')).toBe('/iam/technician-redirect');
    expect(await navigate('/home')).toBe('/iam/technician-redirect');
    expect(await navigate('/iam/register')).toBe('/iam/technician-redirect');
  });
});
