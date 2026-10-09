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

  it('renders owner routes inside the owner shell with the notification bell in its header', async () => {
    signInAs(Role.OWNER_ROLE);

    expect(await navigate('/notifications')).toBe('/notifications');

    const element = harness?.fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-private-layout nav')).not.toBeNull();
    expect(element.querySelector('app-notification-bell a[href="/notifications"]')).not.toBeNull();
    expect(element.querySelector('main app-notification-center')).not.toBeNull();
  });

  it('signs owners out from the shell sidebar and returns them to sign-in', async () => {
    signInAs(Role.OWNER_ROLE);
    store.signOut.mockImplementation(() => store.currentUser.set(null));
    await navigate('/notifications');

    const element = harness?.fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-side-bar app-language-switcher')).not.toBeNull();
    element.querySelector<HTMLButtonElement>('app-side-bar app-button-logout button')?.click();
    await harness?.fixture.whenStable();

    expect(store.signOut).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(Router).url).toBe('/iam/login');
  });

  describe('owner context routes', () => {
    const ownerUrls = [
      '/monitoring',
      '/monitoring/alerts',
      '/assets/sites',
      '/assets/equipment/1',
      '/devices',
      '/devices/pair',
      '/service-requests',
      '/service-requests/new',
      '/notifications',
      '/reports',
      '/reports/1',
    ];

    it('send anonymous users to sign-in', async () => {
      for (const url of ownerUrls) {
        expect(await navigate(url)).toBe('/iam/login');
      }
    });

    it('send technicians to the technician redirect', async () => {
      signInAs(Role.TECHNICIAN_ROLE);

      for (const url of ownerUrls) {
        expect(await navigate(url)).toBe('/iam/technician-redirect');
      }
    });

    it('are reachable by owners', async () => {
      signInAs(Role.OWNER_ROLE);

      for (const url of ownerUrls) {
        expect(await navigate(url)).toBe(url);
      }
    });
  });

  it('keeps technicians out of owner routes and public IAM views', async () => {
    signInAs(Role.TECHNICIAN_ROLE);

    expect(await navigate('/')).toBe('/iam/technician-redirect');
    expect(await navigate('/dashboard')).toBe('/iam/technician-redirect');
    expect(await navigate('/home')).toBe('/iam/technician-redirect');
    expect(await navigate('/iam/register')).toBe('/iam/technician-redirect');
  });
});
