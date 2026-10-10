import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { type Observable, of, Subject, throwError } from 'rxjs';
import { ProfilesPort } from '@profiles/application/ports/profiles.port';
import { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';
import {
  SIGNED_IN_ACCOUNT,
  type SignedInAccount,
} from '@shared/presentation/components/private-layout/signed-in-account';
import { OwnerProfileSettings } from './owner-profile-settings';

function ownerProfile(userId: number): OwnerProfile {
  return new OwnerProfile({
    id: 1,
    user_id: userId,
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+51 987654321',
    address: 'Av. Primavera 123, Lima, 15023, Peru',
    ruc: 20123456789,
  });
}

describe('OwnerProfileSettings', () => {
  const account = signal<SignedInAccount | null>(null);
  let getOwnerProfileByUserId: ReturnType<
    typeof vi.fn<(userId: number) => Observable<OwnerProfile>>
  >;
  let fixture: ComponentFixture<OwnerProfileSettings>;
  let element: HTMLElement;

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(OwnerProfileSettings);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  function details(): string[][] {
    return Array.from(element.querySelectorAll('dl > div'), (item) => [
      item.querySelector('dt')?.textContent?.trim() ?? '',
      item.querySelector('dd')?.textContent?.trim() ?? '',
    ]);
  }

  beforeEach(() => {
    account.set({ id: 1, username: 'jdoe' });
    getOwnerProfileByUserId = vi.fn<(userId: number) => Observable<OwnerProfile>>();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        { provide: SIGNED_IN_ACCOUNT, useValue: account },
        { provide: ProfilesPort, useValue: { getOwnerProfileByUserId } },
      ],
    });
  });

  it('shows the owner profile of the signed-in account once it is loaded', async () => {
    const response = new Subject<OwnerProfile>();
    getOwnerProfileByUserId.mockReturnValue(response);

    await render();
    expect(getOwnerProfileByUserId).toHaveBeenCalledWith(1);
    expect(element.querySelector('[aria-busy="true"]')?.textContent).toContain(
      'profiles.ownerProfile.loading',
    );

    response.next(ownerProfile(1));
    response.complete();
    await fixture.whenStable();

    expect(element.querySelector('[aria-busy]')).toBeNull();
    expect(details()).toEqual([
      ['profiles.ownerProfile.fullName', 'John Doe'],
      ['profiles.ownerProfile.email', 'john.doe@example.com'],
      ['profiles.ownerProfile.phone', '+51 987654321'],
      ['profiles.ownerProfile.ruc', '20123456789'],
      ['profiles.ownerProfile.address', 'Av. Primavera 123, Lima, 15023, Peru'],
    ]);
  });

  it('reports a failed load and loads again on retry', async () => {
    getOwnerProfileByUserId.mockReturnValueOnce(throwError(() => new Error('Failed')));

    await render();
    const alert = element.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('profiles.ownerProfile.errorTitle');

    getOwnerProfileByUserId.mockReturnValueOnce(of(ownerProfile(1)));
    alert?.querySelector('button')?.click();
    await fixture.whenStable();

    expect(getOwnerProfileByUserId).toHaveBeenCalledTimes(2);
    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(details()[0]).toEqual(['profiles.ownerProfile.fullName', 'John Doe']);
  });

  it('never shows the profile of another account', async () => {
    getOwnerProfileByUserId.mockReturnValue(of(ownerProfile(2)));

    await render();

    expect(element.querySelector('dl')).toBeNull();
  });

  it('loads nothing while no account is signed in', async () => {
    account.set(null);

    await render();

    expect(getOwnerProfileByUserId).not.toHaveBeenCalled();
    expect(element.textContent).toContain('profiles.ownerProfile.unavailable');
  });
});
