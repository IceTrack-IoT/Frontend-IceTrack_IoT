import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, skip } from 'rxjs';
import { Icon } from '@shared/presentation/components/icon/icon';
import { HEADER_ACTIONS_OUTLET } from '@shared/presentation/components/private-layout/header-actions-outlet';
import { SIGN_OUT_ACTION } from '@shared/presentation/components/private-layout/sign-out-action';
import { SIGNED_IN_ACCOUNT } from '@shared/presentation/components/private-layout/signed-in-account';
import {
  type NavigationItem,
  SideBar,
  type SideBarAccount,
} from '@shared/presentation/components/side-bar/side-bar';

/** The primary navigation of the owner platform. */
const OWNER_NAVIGATION: readonly NavigationItem[] = [
  { path: '/dashboard', labelKey: 'shared.navigation.dashboard', icon: 'gauge', exact: true },
  { path: '/monitoring', labelKey: 'shared.navigation.monitoring', icon: 'activity', exact: true },
  { path: '/monitoring/alerts', labelKey: 'shared.navigation.alerts', icon: 'bell-ringing' },
  { path: '/assets/sites', labelKey: 'shared.navigation.sites', icon: 'building-store' },
  { path: '/assets/equipment', labelKey: 'shared.navigation.equipment', icon: 'fridge' },
  { path: '/devices', labelKey: 'shared.navigation.devices', icon: 'cpu' },
  { path: '/service-requests', labelKey: 'shared.navigation.serviceRequests', icon: 'tools' },
  { path: '/reports', labelKey: 'shared.navigation.reports', icon: 'report-analytics' },
];

/**
 * Shell of the owner platform: primary navigation, header and main content. The routes of the owner area
 * render inside its primary outlet; a context can render header actions, such as the notification bell,
 * through the `header-actions` outlet without the shell depending on it. The authentication context
 * provides the `SIGNED_IN_ACCOUNT` the sidebar shows and the `SIGN_OUT_ACTION` signing out runs. Below
 * 960px the navigation collapses behind a menu button.
 */
@Component({
  imports: [RouterOutlet, TranslatePipe, Icon, SideBar],
  selector: 'app-private-layout',
  styleUrl: './private-layout.css',
  templateUrl: './private-layout.html',
})
export class PrivateLayout {
  protected readonly navigation = OWNER_NAVIGATION;
  protected readonly headerActionsOutlet = HEADER_ACTIONS_OUTLET;
  protected readonly menuOpen = signal(false);

  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly signOutAction = inject(SIGN_OUT_ACTION);
  private readonly signedInAccount = inject(SIGNED_IN_ACCOUNT);
  protected readonly account = computed<SideBarAccount | null>(() => {
    const account = this.signedInAccount();
    return account === null ? null : { username: account.username, settingsPath: '/settings' };
  });

  constructor() {
    // After an in-app navigation the focus moves to the new page, so keyboard and screen reader users
    // start at its content instead of the link they activated.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuOpen.set(false);
        this.main().nativeElement.focus();
      });
  }

  protected signOut(): void {
    this.signOutAction();
  }

  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
