import { computed, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import type { AuthenticationErrorCode } from '@iam/application/contracts/authentication-error';
import { IamStore } from '@iam/application/iam-store';
import { User } from '@iam/domain/model/user.entity';
import { AuthProvider } from '@iam/domain/value-objects/auth-provider';
import { Role } from '@iam/domain/value-objects/role';
import { CompleteGoogleRegistration } from './complete-google-registration';

class FakeIamStore {
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorCode = signal<AuthenticationErrorCode | null>(null);
  readonly googleRegistrationRequired = signal(false);
  readonly completeGoogleOwnerRegistration = vi.fn();
}

const VALID_DETAILS = {
  '#complete-registration-username': 'roberto_morales',
  '#complete-registration-phone': '+51 987 654 321',
  '#complete-registration-ruc': '20123456789',
  '#complete-registration-street': 'Av. Los Pinos',
  '#complete-registration-number': '245',
  '#complete-registration-city': 'Lima',
  '#complete-registration-postalCode': '15001',
  '#complete-registration-country': 'Peru',
};

describe('CompleteGoogleRegistration', () => {
  let store: FakeIamStore;
  let router: Router;
  let fixture: ComponentFixture<CompleteGoogleRegistration>;
  let element: HTMLElement;

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function fill(values: Record<string, string>): void {
    for (const [selector, value] of Object.entries(values)) {
      const input = element.querySelector<HTMLInputElement>(selector);
      if (input === null) {
        throw new Error(`Missing input ${selector}`);
      }
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  }

  function submitForm(): void {
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
  }

  async function createWithPendingGoogleRegistration(): Promise<void> {
    // The state IamStore leaves after a Google sign-in rejected with GOOGLE_ACCOUNT_NOT_FOUND.
    store.error.set('The Google account is not registered.');
    store.errorCode.set('GOOGLE_ACCOUNT_NOT_FOUND');
    store.googleRegistrationRequired.set(true);
    fixture = TestBed.createComponent(CompleteGoogleRegistration);
    element = fixture.nativeElement as HTMLElement;
    await render();
  }

  beforeEach(() => {
    store = new FakeIamStore();
    TestBed.configureTestingModule({
      imports: [CompleteGoogleRegistration],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: IamStore, useValue: store },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  it('asks to continue with Google again when no registration is pending', async () => {
    fixture = TestBed.createComponent(CompleteGoogleRegistration);
    element = fixture.nativeElement as HTMLElement;
    await render();

    expect(element.querySelector('h1')?.textContent).toContain(
      'iam.completeGoogleRegistration.expiredTitle',
    );
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/iam/login');
  });

  it('explains that more information is required without the raw error code or the ID token', async () => {
    await createWithPendingGoogleRegistration();

    expect(element.querySelector('h1')?.textContent).toContain(
      'iam.completeGoogleRegistration.title',
    );
    expect(element.textContent).toContain('iam.completeGoogleRegistration.notice');
    expect(element.textContent).not.toContain('GOOGLE_ACCOUNT_NOT_FOUND');
    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.querySelector('input[type="hidden"]')).toBeNull();
    expect(element.querySelector('a[href="/iam/login"]')?.textContent).toContain(
      'iam.actions.backToSignIn',
    );
  });

  it('shows the field errors and does not submit incomplete details', async () => {
    await createWithPendingGoogleRegistration();
    fill({ ...VALID_DETAILS, '#complete-registration-ruc': '2012345678x', '#complete-registration-city': '' });
    submitForm();
    await render();

    expect(store.completeGoogleOwnerRegistration).not.toHaveBeenCalled();
    expect(element.querySelector('#complete-registration-ruc-error')?.textContent).toContain(
      'iam.validation.ruc',
    );
    expect(element.querySelector('#complete-registration-city-error')?.textContent).toContain(
      'iam.validation.required',
    );
    expect(document.activeElement?.id).toBe('complete-registration-ruc');
  });

  it('completes the owner registration with the entered details', async () => {
    await createWithPendingGoogleRegistration();
    fill(VALID_DETAILS);
    submitForm();
    await render();

    expect(store.completeGoogleOwnerRegistration).toHaveBeenCalledWith({
      username: 'roberto_morales',
      phone: '+51 987 654 321',
      street: 'Av. Los Pinos',
      number: '245',
      city: 'Lima',
      postalCode: '15001',
      country: 'Peru',
      ruc: 20123456789,
    });
  });

  it('stays on the form with a safe message when the completion is rejected', async () => {
    await createWithPendingGoogleRegistration();
    fill(VALID_DETAILS);
    submitForm();
    store.error.set('The Google account is not registered.');
    store.errorCode.set('GOOGLE_ACCOUNT_NOT_FOUND');
    await render();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'iam.errors.registrationRejected',
    );
    expect(element.textContent).not.toContain('GOOGLE_ACCOUNT_NOT_FOUND');
    expect(element.querySelector('form')).not.toBeNull();
  });

  it('disables the submit button while the registration is completing', async () => {
    await createWithPendingGoogleRegistration();
    store.loading.set(true);
    await render();

    const submit = element.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(submit?.disabled).toBe(true);
    expect(submit?.textContent).toContain('iam.completeGoogleRegistration.submitting');
  });

  it('hands the new owner to the root landing redirect once the session starts', async () => {
    await createWithPendingGoogleRegistration();
    store.googleRegistrationRequired.set(false);
    store.currentUser.set(
      new User({ id: 3, username: 'roberto_morales', role: Role.OWNER_ROLE, provider: AuthProvider.GOOGLE }),
    );
    await render();

    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'iam.completeGoogleRegistration.completed',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
