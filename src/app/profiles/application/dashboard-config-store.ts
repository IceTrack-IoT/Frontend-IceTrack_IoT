import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import type { DashboardConfig } from '@profiles/domain/model/dashboard-config.entity';
import type {
  DashboardConfigChange,
  DashboardDefaults,
} from '@profiles/application/contracts/dashboard-config-change';
import type { DashboardSite } from '@profiles/application/contracts/dashboard-site';
import {
  type ProfilesFailure,
  toProfilesFailure,
} from '@profiles/application/contracts/profiles-error';
import { CreateDashboardConfigUseCase } from '@profiles/application/use-cases/create-dashboard-config.use-case';
import { LoadDashboardConfigUseCase } from '@profiles/application/use-cases/load-dashboard-config.use-case';
import { LoadDashboardSitesUseCase } from '@profiles/application/use-cases/load-dashboard-sites.use-case';
import { SaveDashboardConfigUseCase } from '@profiles/application/use-cases/save-dashboard-config.use-case';

/**
 * Dashboard Config Store manages the signed-in account's dashboard configuration (which cards it shows,
 * in what order, and the site and temperature range it opens on) and the sites it can refer to. It holds
 * signal-based state only and delegates operations to Profiles use cases. The data the cards show belongs
 * to other bounded contexts.
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardConfigStore {
  private readonly loadDashboardConfigUseCase = inject(LoadDashboardConfigUseCase);
  private readonly createDashboardConfigUseCase = inject(CreateDashboardConfigUseCase);
  private readonly saveDashboardConfigUseCase = inject(SaveDashboardConfigUseCase);
  private readonly loadDashboardSitesUseCase = inject(LoadDashboardSitesUseCase);

  private readonly configSignal = signal<DashboardConfig | null>(null);
  readonly config = this.configSignal.asReadonly();
  private readonly configLoadingSignal = signal(false);
  readonly configLoading = this.configLoadingSignal.asReadonly();
  private readonly configFailureSignal = signal<ProfilesFailure | null>(null);
  readonly configFailure = this.configFailureSignal.asReadonly();
  /** True when the account has no dashboard configuration yet, so it must be set up. */
  readonly configMissing = computed(
    () => this.configFailureSignal() === 'DASHBOARD_CONFIG_NOT_FOUND',
  );

  private readonly sitesSignal = signal<DashboardSite[] | null>(null);
  /** The owner's sites, sorted by name; empty until loaded. */
  readonly sites = computed(() => this.sitesSignal() ?? []);
  /** True once the sites have been loaded, even when the owner has none. */
  readonly sitesLoaded = computed(() => this.sitesSignal() !== null);
  private readonly sitesLoadingSignal = signal(false);
  readonly sitesLoading = this.sitesLoadingSignal.asReadonly();
  private readonly sitesFailureSignal = signal<ProfilesFailure | null>(null);
  readonly sitesFailure = this.sitesFailureSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();
  private readonly saveFailureSignal = signal<ProfilesFailure | null>(null);
  readonly saveFailure = this.saveFailureSignal.asReadonly();
  private readonly saveOutcomeSignal = signal<'created' | 'saved' | null>(null);
  /** The outcome of the last successful creation or save, until the save feedback is cleared. */
  readonly saveOutcome = this.saveOutcomeSignal.asReadonly();

  /**
   * Loads the dashboard configuration of an account and the sites it can refer to. A configuration of
   * another account is discarded first.
   * @param userId - The identifier of the signed-in platform account.
   */
  load(userId: number): void {
    if (this.configSignal()?.user_id !== userId) {
      this.configSignal.set(null);
    }
    this.loadConfig(userId);
    this.loadSites();
  }

  /**
   * Creates the dashboard configuration of an account that has none, in the default layout. When it
   * turns out to exist already (for example, created from another tab), it is loaded instead.
   * @param userId - The identifier of the signed-in platform account.
   * @param defaults - The site and temperature range the dashboard opens on.
   */
  createConfig(userId: number, defaults: DashboardDefaults): void {
    if (this.savingSignal()) {
      return;
    }
    this.startSave();
    this.createDashboardConfigUseCase
      .execute(userId, defaults)
      .pipe(finalize(() => this.savingSignal.set(false)))
      .subscribe({
        next: (config) => {
          this.configSignal.set(config);
          this.configFailureSignal.set(null);
          this.saveOutcomeSignal.set('created');
        },
        error: (error: unknown) => {
          const failure = toProfilesFailure(error);
          if (failure === 'DASHBOARD_CONFIG_CONFLICT') {
            this.loadConfig(userId);
            return;
          }
          this.saveFailureSignal.set(failure);
        },
      });
  }

  /**
   * Saves the layout and defaults chosen for the loaded configuration. Each stored part is kept even when
   * a later part fails. When the configuration changed since it was loaded
   * (`CONCURRENT_MODIFICATION_CONFLICT`), the current one is loaded again so the owner can save once more.
   * @param change - The chosen layout and defaults.
   */
  saveConfig(change: DashboardConfigChange): void {
    const config = this.configSignal();
    if (config === null || this.savingSignal()) {
      return;
    }
    this.startSave();
    this.saveDashboardConfigUseCase
      .execute(config, change)
      .pipe(finalize(() => this.savingSignal.set(false)))
      .subscribe({
        next: (stored) => this.configSignal.set(stored),
        error: (error: unknown) => {
          const failure = toProfilesFailure(error);
          this.saveFailureSignal.set(failure);
          if (failure === 'CONCURRENT_MODIFICATION_CONFLICT') {
            this.loadConfig(config.user_id);
          }
        },
        complete: () => this.saveOutcomeSignal.set('saved'),
      });
  }

  /**
   * Clears the outcome of the last creation or save.
   */
  clearSaveFeedback(): void {
    this.saveFailureSignal.set(null);
    this.saveOutcomeSignal.set(null);
  }

  /**
   * Loads the sites the dashboard can refer to.
   */
  loadSites(): void {
    this.sitesLoadingSignal.set(true);
    this.sitesFailureSignal.set(null);
    this.loadDashboardSitesUseCase
      .execute()
      .pipe(finalize(() => this.sitesLoadingSignal.set(false)))
      .subscribe({
        next: (sites) => this.sitesSignal.set(sites),
        error: (error: unknown) => this.sitesFailureSignal.set(toProfilesFailure(error)),
      });
  }

  private loadConfig(userId: number): void {
    this.configLoadingSignal.set(true);
    this.configFailureSignal.set(null);
    this.loadDashboardConfigUseCase
      .execute(userId)
      .pipe(finalize(() => this.configLoadingSignal.set(false)))
      .subscribe({
        next: (config) => this.configSignal.set(config),
        error: (error: unknown) => this.configFailureSignal.set(toProfilesFailure(error)),
      });
  }

  private startSave(): void {
    this.savingSignal.set(true);
    this.saveFailureSignal.set(null);
    this.saveOutcomeSignal.set(null);
  }
}
