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
import { Register } from './register';

class FakeIamStore {
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorCode = signal<AuthenticationErrorCode | null>(null);
  readonly googleRegistrationRequired = signal(false);
  readonly registeredUser = signal<User | null>(null);
  readonly clearFeedback = vi.fn();
  readonly signUpOwner = vi.fn();
  readonly signInWithGoogle = vi.fn();
}

const VALID_OWNER = {
  '#register-fullName': 'Roberto Morales',
  '#register-username': 'roberto_morales',
  '#register-email': 'roberto@alimentos.pe',
  '#register-phone': '+51 987 654 321',
  '#register-ruc': '20123456789',
  '#register-street': 'Av. Los Pinos',
  '#register-number': '245',
  '#register-city': 'Lima',
  '#register-postalCode': '15001',
  '#register-country': 'Peru',
  '#register-password': 'S3cret-pass',
  '#register-confirmPassword': 'S3cret-pass',
};

describe('Register', () => {
  let store: FakeIamStore;
  let googleCredentials: Subject<GoogleCredential>;
  let router: Router;
  let fixture: ComponentFixture<Register>;
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

  function fill(values: Record<string, string>): void {
    for (const [selector, value] of Object.entries(values)) {
      typeInto(selector, value);
    }
  }

  function submitForm(): void {
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
  }

  function errorOf(name: string): string | null | undefined {
    return element.querySelector(`#register-${name}-error`)?.textContent;
  }

  beforeEach(async () => {
    store = new FakeIamStore();
    googleCredentials = new Subject<GoogleCredential>();
    TestBed.configureTestingModule({
      imports: [Register],
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
    fixture = TestBed.createComponent(Register);
    element = fixture.nativeElement as HTMLElement;
    await render();
  });

  it('labels every field with translation keys', () => {
    for (const selector of Object.keys(VALID_OWNER)) {
      const label = element.querySelector(`label[for="${selector.slice(1)}"]`);
      expect(label?.textContent?.trim()).toMatch(/^iam\.fields\./);
    }
    expect(element.querySelector('legend')?.textContent).toContain('iam.sections.address');
  });

  it('shows translated, field-associated errors and does not register an invalid owner', async () => {
    fill({
      ...VALID_OWNER,
      '#register-email': 'roberto',
      '#register-phone': 'call me',
      '#register-ruc': '123',
      '#register-password': 'short',
      '#register-confirmPassword': 'different',
    });
    submitForm();
    await render();

    expect(store.signUpOwner).not.toHaveBeenCalled();
    expect(errorOf('email')).toContain('iam.validation.email');
    expect(errorOf('phone')).toContain('iam.validation.phone');
    expect(errorOf('ruc')).toContain('iam.validation.ruc');
    expect(errorOf('password')).toContain('iam.validation.passwordLength');
    expect(errorOf('confirmPassword')).toContain('iam.validation.passwordMismatch');
    expect(element.querySelector('#register-password')?.getAttribute('aria-describedby')).toBe(
      'register-password-hint register-password-error',
    );
    expect(element.querySelector('#register-ruc')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('shows the required errors and focuses the first invalid field when submitted empty', async () => {
    submitForm();
    await render();

    expect(errorOf('fullName')).toContain('iam.validation.required');
    expect(errorOf('country')).toContain('iam.validation.required');
    expect(document.activeElement?.id).toBe('register-fullName');
  });

  it('registers the owner with a numeric RUC and without the password confirmation', async () => {
    fill(VALID_OWNER);
    submitForm();
    await render();

    expect(store.signUpOwner).toHaveBeenCalledWith({
      username: 'roberto_morales',
      password: 'S3cret-pass',
      email: 'roberto@alimentos.pe',
      fullName: 'Roberto Morales',
      phone: '+51 987 654 321',
      street: 'Av. Los Pinos',
      number: '245',
      city: 'Lima',
      postalCode: '15001',
      country: 'Peru',
      ruc: 20123456789,
    });
  });

  it('disables the submit button while the registration is in progress', async () => {
    store.loading.set(true);
    await render();

    const submit = element.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(submit?.disabled).toBe(true);
    expect(submit?.textContent).toContain('iam.register.submitting');
  });

  it('shows a safe message when the backend rejects the registration', async () => {
    fill(VALID_OWNER);
    submitForm();
    store.error.set('Username roberto_morales already exists');
    await render();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'iam.errors.registrationRejected',
    );
    expect(element.textContent).not.toContain('already exists');
  });

  it('replaces the form with the success state, focuses it and drops the credentials', async () => {
    fill(VALID_OWNER);
    store.registeredUser.set(
      new User({ id: 7, username: 'roberto_morales', role: Role.OWNER_ROLE, provider: AuthProvider.LOCAL }),
    );
    await render();

    const heading = element.querySelector('h1');
    expect(heading?.textContent).toContain('iam.register.successTitle');
    expect(document.activeElement).toBe(heading);
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('a.iam-button')?.getAttribute('href')).toBe('/iam/login');
    expect(fixture.componentInstance['form'].getRawValue().password).toBe('');
  });

  it('continues an unregistered Google account to the registration without the raw error code', async () => {
    googleCredentials.next({ idToken: 'google-id-token' });
    store.error.set('The Google account is not registered.');
    store.errorCode.set('GOOGLE_ACCOUNT_NOT_FOUND');
    store.googleRegistrationRequired.set(true);
    await render();

    expect(store.signInWithGoogle).toHaveBeenCalledWith({ idToken: 'google-id-token' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/iam/complete-google-registration');
    expect(element.textContent).not.toContain('GOOGLE_ACCOUNT_NOT_FOUND');
  });

  it('shows a safe message when Google sign-up fails', async () => {
    googleCredentials.next({ idToken: 'google-id-token' });
    store.error.set('Google Identity Services rejected the request');
    await render();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'iam.errors.googleSignInFailed',
    );
  });
});
