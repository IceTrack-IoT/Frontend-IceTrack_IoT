import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DashboardConfigStore } from '@profiles/application/dashboard-config-store';
import type { DashboardConfigChange } from '@profiles/application/contracts/dashboard-config-change';
import { DashboardCardShell } from '@profiles/presentation/components/dashboard-card-shell/dashboard-card-shell';
import { DashboardCustomizeDialog } from '@profiles/presentation/components/dashboard-customize-dialog/dashboard-customize-dialog';
import { dashboardSaveErrorKey } from '@profiles/presentation/profiles-feedback';
import { Icon } from '@shared/presentation/components/icon/icon';
import { SHELL_LIFETIME } from '@shared/presentation/components/private-layout/shell-lifetime';
import { SIGNED_IN_ACCOUNT } from '@shared/presentation/components/private-layout/signed-in-account';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/**
 * The states of the dashboard:
 * - `ready`: the configuration is loaded.
 * - `setup`: the account has no configuration yet and the owner can set it up.
 * - `no-sites`: no configuration yet, and the owner has no site to open it on.
 */
type DashboardStatus = 'loading' | 'error' | 'unavailable' | 'setup' | 'no-sites' | 'ready';

/**
 * Owner dashboard: the cards of the owner's dashboard configuration that are visible, in their configured
 * order, scoped to a site (the default site of the configuration at first). Profiles owns the card layout
 * and the defaults; the data of each card belongs to other bounded contexts and is not shown here yet.
 * The owner rearranges the cards and changes the defaults in the customize dialog, and sets the dashboard
 * up there when the account has none.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    DashboardCardShell,
    DashboardCustomizeDialog,
    Icon,
    StatePanel,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    TemperaturePipe,
  ],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly store = inject(DashboardConfigStore);
  private readonly account = inject(SIGNED_IN_ACCOUNT);

  protected readonly today = new Date();

  /** The site the dashboard is scoped to, or null for every site. */
  protected readonly scope = new FormControl<number | null>(null);
  protected readonly scopeValue = toSignal(this.scope.valueChanges, { initialValue: null });

  /** The dialog that is open: setting up a new dashboard or customizing the existing one. */
  protected readonly dialog = signal<'setup' | 'customize' | null>(null);

  protected readonly status = computed<DashboardStatus>(() => {
    if (this.account() === null) {
      return 'unavailable';
    }
    if (this.store.config() !== null) {
      return 'ready';
    }
    if (this.store.configMissing()) {
      if (this.store.sitesLoaded()) {
        return this.store.sites().length === 0 ? 'no-sites' : 'setup';
      }
      return this.store.sitesFailure() !== null ? 'error' : 'loading';
    }
    return this.store.configFailure() !== null ? 'error' : 'loading';
  });

  protected readonly visibleCards = computed(() => this.store.config()?.visibleCards() ?? []);
  protected readonly scopeName = computed(
    () => this.store.sites().find((site) => site.id === this.scopeValue())?.name ?? null,
  );
  /** Customizing needs the sites, since the defaults name the site the dashboard opens on. */
  protected readonly canCustomize = computed(
    () => this.status() === 'ready' && this.store.sitesLoaded(),
  );
  protected readonly saveErrorKey = computed(() => dashboardSaveErrorKey(this.store.saveFailure()));
  /** The translation key of the outcome of the last save, announced to assistive technologies. */
  protected readonly announcement = computed(() => {
    switch (this.store.saveOutcome()) {
      case 'created':
        return 'profiles.dashboard.setup.created';
      case 'saved':
        return 'profiles.dashboard.saved';
      default:
        return null;
    }
  });

  constructor() {
    this.store.retain(inject(SHELL_LIFETIME));
    this.load();
    // The dashboard opens on its default site, again after the defaults change.
    effect(() => {
      const siteId = this.store.config()?.default_site_id;
      if (siteId !== undefined) {
        this.scope.setValue(siteId);
      }
    });
    // A successful save closes the dialog.
    effect(() => {
      if (this.store.saveOutcome() !== null) {
        this.dialog.set(null);
      }
    });
  }

  protected load(): void {
    const account = this.account();
    if (account !== null) {
      this.store.load(account.id);
    }
  }

  protected open(dialog: 'setup' | 'customize'): void {
    this.store.clearSaveFeedback();
    this.dialog.set(dialog);
  }

  protected close(): void {
    this.store.clearSaveFeedback();
    this.dialog.set(null);
  }

  protected save(change: DashboardConfigChange): void {
    this.store.saveConfig(change);
  }

  protected setUp(change: DashboardConfigChange): void {
    const account = this.account();
    if (account === null) {
      return;
    }
    this.store.createConfig(account.id, {
      defaultSiteId: change.defaultSiteId,
      defaultTemperatureRange: change.defaultTemperatureRange,
    });
  }
}
