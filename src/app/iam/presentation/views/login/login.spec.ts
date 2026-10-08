import { computed, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import type { AuthenticationErrorCode } from '@iam/application/contracts/authentication-error';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import { IamStore } from '@iam/application/iam-store';
import { User } from '@iam/domain/model/user.entity';
import { AuthProvider } from '@iam/domain/value-objects/auth-provider';
import { Role } from '@iam/domain/value-objects/role';
import { GoogleIdentityServices } from '@iam/infrastructure/google/google-identity-services';
import { Login } from './login';

class FakeIamStore {
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorCode = signal<AuthenticationErrorCode | null>(null);
  readonly googleRegistrationRequired = signal(false);
  readonly clearFeedback = vi.fn();
  readonly signInLocally = vi.fn();
  readonly signInWithGoogle = vi.fn();
}

describe('Login', () => {
  let store: FakeIamStore;
  let googleCredentials: Subject<GoogleCredential>;
  let router: Router;
  let fixture: ComponentFixture<Login>;
  let element: HTMLElement;

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function typeInto(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector);
    if (input === null) {
      throw new Error(`Missing input ${selector}`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  function submitForm(): void {
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
  }

  beforeEach(async () => {
    store = new FakeIamStore();
    googleCredentials = new Subject<GoogleCredential>();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: IamStore, useValue: store },
        {
          provide: GoogleIdentityServices,
          useValue: { credentials: googleCredentials, renderButton: () => Promise.resolve() },
        },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(Login);
    element = fixture.nativeElement as HTMLElement;
    await render();
  });

  it('labels every field and action with translation keys', () => {
    expect(element.querySelector('h1')?.textContent).toContain('iam.login.title');
    expect(element.querySelector('label[for="login-username"]')?.textContent).toContain(
      'iam.fields.username',
    );
    expect(element.querySelector('label[for="login-password"]')?.textContent).toContain(
      'iam.fields.password',
    );
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain(
      'iam.login.submit',
    );
    expect(element.querySelector('a[href="/iam/register"]')).not.toBeNull();
  });

  it('shows the required errors and does not sign in when the form is incomplete', async () => {
    submitForm();
    await render();

    const username = element.querySelector('#login-username');
    expect(store.signInLocally).not.toHaveBeenCalled();
    expect(username?.getAttribute('aria-invalid')).toBe('true');
    expect(username?.getAttribute('aria-describedby')).toBe('login-username-error');
    expect(element.querySelector('#login-username-error')?.textContent).toContain(
      'iam.validation.required',
    );
    expect(element.querySelector('#login-password-error')).not.toBeNull();
  });

  it('signs in locally with the entered credentials', async () => {
    typeInto('#login-username', 'roberto_morales');
    typeInto('#login-password', 'S3cret-pass');
    submitForm();
    await render();

    expect(store.signInLocally).toHaveBeenCalledWith({
      username: 'roberto_morales',
      password: 'S3cret-pass',
    });
  });

  it('disables the submit button while the sign-in is in progress', async () => {
    store.loading.set(true);
    await render();

    const submit = element.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(submit?.disabled).toBe(true);
    expect(submit?.textContent).toContain('iam.login.submitting');
  });

  it('toggles the password visibility with a pressed-state button', async () => {
    const toggle = element.querySelector<HTMLButtonElement>('button[aria-controls="login-password"]');
    expect(toggle?.getAttribute('aria-label')).toBe('iam.login.showPassword');
    expect(toggle?.getAttribute('aria-pressed')).toBe('false');

    toggle?.click();
    await render();

    expect(element.querySelector('#login-password')?.getAttribute('type')).toBe('text');
    expect(toggle?.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows one generic message for rejected credentials and associates it with the inputs', async () => {
    store.error.set('No user matches the username roberto_morales');
    store.errorCode.set('USER_NOT_FOUND');
    await render();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'iam.errors.invalidCredentials',
    );
    expect(element.textContent).not.toContain('USER_NOT_FOUND');
    expect(element.textContent).not.toContain('No user matches');
    expect(element.querySelector('#login-password')?.getAttribute('aria-describedby')).toBe(
      'login-error',
    );
  });

  it('signs in with the Google credential', () => {
    googleCredentials.next({ idToken: 'google-id-token' });

    expect(store.signInWithGoogle).toHaveBeenCalledWith({ idToken: 'google-id-token' });
  });

  it('continues an unregistered Google account to the registration without the raw error code', async () => {
    googleCredentials.next({ idToken: 'google-id-token' });
    store.error.set('The Google account is not registered.');
    store.errorCode.set('GOOGLE_ACCOUNT_NOT_FOUND');
    store.googleRegistrationRequired.set(true);
    await render();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/iam/complete-google-registration');
    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.textContent).not.toContain('GOOGLE_ACCOUNT_NOT_FOUND');
  });

  it('shows a safe message when Google sign-in fails and keeps the credentials form', async () => {
    googleCredentials.next({ idToken: 'google-id-token' });
    store.error.set('The backend rejected the authentication request.');
    await render();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'iam.errors.googleSignInFailed',
    );
    expect(element.textContent).not.toContain('rejected the authentication');
    expect(element.querySelector('#login-username')).not.toBeNull();
  });

  it('hands an authenticated owner to the root landing redirect', async () => {
    store.currentUser.set(
      new User({ id: 1, username: 'owner', role: Role.OWNER_ROLE, provider: AuthProvider.LOCAL }),
    );
    await render();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('hands an authenticated technician to the root landing redirect', async () => {
    store.currentUser.set(
      new User({
        id: 2,
        username: 'technician',
        role: Role.TECHNICIAN_ROLE,
        provider: AuthProvider.LOCAL,
      }),
    );
    await render();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
