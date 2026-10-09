import { Component, input, output } from '@angular/core';
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

/**
 * Sidebar of the authenticated shell: the brand, the primary navigation, marking the current entry with
 * `aria-current="page"`, and the language switcher and sign-out button below it.
 */
@Component({
  imports: [RouterLink, RouterLinkActive, TranslatePipe, ButtonLogout, Icon, LanguageSwitcher],
  selector: 'app-side-bar',
  styleUrl: './side-bar.css',
  templateUrl: './side-bar.html',
})
export class SideBar {
  readonly items = input.required<readonly NavigationItem[]>();
  /** Emits when the user follows an entry, so a collapsible container can close. */
  readonly navigated = output<void>();
  /** Emits when the user asks to sign out; the shell decides what signing out does. */
  readonly signOut = output<void>();
}
