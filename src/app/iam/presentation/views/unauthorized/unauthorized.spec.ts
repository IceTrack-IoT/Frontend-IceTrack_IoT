import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IamStore } from '@iam/application/iam-store';
import { User } from '@iam/domain/model/user.entity';
import { AuthProvider } from '@iam/domain/value-objects/auth-provider';
import { Role } from '@iam/domain/value-objects/role';
import { Unauthorized } from './unauthorized';

class FakeIamStore {
  readonly restoring = signal(false);
  readonly currentUser = signal<User | null>(null);
  readonly signOut = vi.fn();
}

describe('Unauthorized', () => {
  let store: FakeIamStore;
  let fixture: ComponentFixture<Unauthorized>;
  let element: HTMLElement;

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function signInAs(role: Role): void {
    store.currentUser.set(new User({ id: 1, username: 'user', role, provider: AuthProvider.LOCAL }));
  }

  beforeEach(async () => {
    store = new FakeIamStore();
    TestBed.configureTestingModule({
      imports: [Unauthorized],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: IamStore, useValue: store },
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(Unauthorized);
    element = fixture.nativeElement as HTMLElement;
    await render();
  });

  it('explains that access is not allowed', () => {
    expect(element.querySelector('h1')?.textContent).toContain('iam.unauthorized.title');
    expect(element.textContent).toContain('iam.unauthorized.message');
  });

  it('offers sign-in when there is no session', () => {
    const action = element.querySelector('a');

    expect(action?.getAttribute('href')).toBe('/iam/login');
    expect(action?.textContent).toContain('iam.actions.goToSignIn');
  });

  it('reports the session check instead of an action while the session is restoring', async () => {
    store.restoring.set(true);
    await render();

    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'iam.unauthorized.checkingSession',
    );
    expect(element.querySelector('a')).toBeNull();
  });

  it('sends owners to the dashboard', async () => {
    signInAs(Role.OWNER_ROLE);
    await render();

    const action = element.querySelector('a');
    expect(action?.getAttribute('href')).toBe('/dashboard');
    expect(action?.textContent).toContain('iam.unauthorized.goToDashboard');
  });

  it('sends technicians to the technician area', async () => {
    signInAs(Role.TECHNICIAN_ROLE);
    await render();

    const action = element.querySelector('a');
    expect(action?.getAttribute('href')).toBe('/iam/technician-redirect');
    expect(action?.textContent).toContain('iam.unauthorized.goToTechnicianArea');
  });
});
