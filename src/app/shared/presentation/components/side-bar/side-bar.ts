import { Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonLogout } from '@shared/presentation/components/button-logout/button-logout';
import { Icon, type IconName } from '@shared/presentation/components/icon/icon';
import { LanguageSwitcher } from '@shared/presentation/components/language-switcher/language-switcher';

/** An entry of the primary navigation. */
export interface NavigationItem {
  /** The absolute router path of the entry. */
  readonly path: string;
  /** The translation key of the entry label. */
  readonly labelKey: string;
  readonly icon: IconName;
  /** Whether the entry is current only on an exact URL match instead of on any descendant URL. */
  readonly exact?: boolean;
}

/** The signed-in account shown at the bottom of the sidebar. */
export interface SideBarAccount {
  readonly username: string;
  /** The absolute router path of the account settings. */
  readonly settingsPath: string;
}

/**
 * Sidebar of the authenticated shell: the brand, the primary navigation, marking the current entry with
 * `aria-current="page"`, and below it the signed-in account, linking to its settings, the language
 * switcher and the sign-out button.
 */
@Component({
  imports: [RouterLink, RouterLinkActive, TranslatePipe, ButtonLogout, Icon, LanguageSwitcher],
  selector: 'app-side-bar',
  styleUrl: './side-bar.css',
  templateUrl: './side-bar.html',
})
export class SideBar {
  readonly items = input.required<readonly NavigationItem[]>();
  /** The signed-in account, or null when it is not known. */
  readonly account = input<SideBarAccount | null>(null);
  protected readonly initial = computed(
    () => this.account()?.username.charAt(0).toLocaleUpperCase() ?? '',
  );
  /** Emits when the user follows an entry, so a collapsible container can close. */
  readonly navigated = output<void>();
  /** Emits when the user asks to sign out; the shell decides what signing out does. */
  readonly signOut = output<void>();
}
