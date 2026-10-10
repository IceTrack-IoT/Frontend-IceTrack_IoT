import { Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfilesStore } from '@profiles/application/profiles-store';
import { Icon } from '@shared/presentation/components/icon/icon';
import { SIGNED_IN_ACCOUNT } from '@shared/presentation/components/private-layout/signed-in-account';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';

/** The states of the section while the owner profile is not shown. */
type OwnerProfileStatus = 'loading' | 'error' | 'unavailable';

/**
 * Owner profile section of the settings: the profile bound to the signed-in account (full name, email,
 * phone, address and RUC). The settings view renders it in its outlet.
 */
@Component({
  imports: [TranslatePipe, Icon, StatePanel],
  selector: 'app-owner-profile-settings',
  styleUrl: './owner-profile-settings.css',
  templateUrl: './owner-profile-settings.html',
})
export class OwnerProfileSettings {
  private readonly store = inject(ProfilesStore);
  private readonly account = inject(SIGNED_IN_ACCOUNT);

  /** The owner profile of the signed-in account; a profile of another account is never shown. */
  protected readonly profile = computed(() => {
    const profile = this.store.currentOwnerProfile();
    return profile !== null && profile.user_id === this.account()?.id ? profile : null;
  });

  protected readonly status = computed<OwnerProfileStatus>(() => {
    if (this.account() === null) {
      return 'unavailable';
    }
    return this.store.error() !== null && !this.store.loading() ? 'error' : 'loading';
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    const account = this.account();
    if (account !== null) {
      this.store.loadOwnerProfileByUserId(account.id);
    }
  }
}
