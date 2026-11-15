import {
  computed,
  type DestroyRef,
  inject,
  Injectable,
  signal,
  type WritableSignal,
} from '@angular/core';
import { finalize, Observable, Subscription } from 'rxjs';
import type { Equipment } from '@assets/domain/model/equipment.entity';
import type { Site } from '@assets/domain/model/site.entity';
import type { GeocodingStatus } from '@assets/domain/value-objects/geocoding-status';
import type { StatusEquipment } from '@assets/domain/value-objects/status-equipment';
import type { TemperatureThreshold } from '@assets/domain/value-objects/temperature-threshold';
import {
  AssetsError,
  type AssetsFailure,
  toAssetsFailure,
} from '@assets/application/contracts/assets-error';
import type { EquipmentPage, EquipmentQuery } from '@assets/application/contracts/equipment-page';
import type {
  EquipmentChanges,
  NewEquipment,
} from '@assets/application/contracts/equipment-registration';
import type { SiteDetails } from '@assets/application/contracts/site-registration';
import type { VerifiedAddress } from '@assets/application/contracts/verified-address';
import { ChangeEquipmentStatusUseCase } from '@assets/application/use-cases/change-equipment-status.use-case';
import { ChangeEquipmentThresholdUseCase } from '@assets/application/use-cases/change-equipment-threshold.use-case';
import { ChangeSiteAddressUseCase } from '@assets/application/use-cases/change-site-address.use-case';
import { LoadEquipmentPageUseCase } from '@assets/application/use-cases/load-equipment-page.use-case';
import { LoadEquipmentUseCase } from '@assets/application/use-cases/load-equipment.use-case';
import { LoadSitesUseCase } from '@assets/application/use-cases/load-sites.use-case';
import { RegisterEquipmentUseCase } from '@assets/application/use-cases/register-equipment.use-case';
import { RegisterSiteUseCase } from '@assets/application/use-cases/register-site.use-case';
import { RetrySiteGeocodingUseCase } from '@assets/application/use-cases/retry-site-geocoding.use-case';
import { UpdateEquipmentUseCase } from '@assets/application/use-cases/update-equipment.use-case';
import { UpdateSiteUseCase } from '@assets/application/use-cases/update-site.use-case';
import { ValidateSiteAddressUseCase } from '@assets/application/use-cases/validate-site-address.use-case';

/** The number of equipment items per page of the list. */
export const EQUIPMENT_PAGE_SIZE = 10;

/** The actions the owner runs on sites. */
export type SiteAction = 'register' | 'update' | 'change-address';

/** The actions the owner runs on equipment. */
export type EquipmentAction = 'register' | 'update' | 'threshold' | 'status';

/** The outcome of the last action of a kind, until it is cleared. */
export interface ActionState<TAction> {
  readonly action: TAction;
  readonly status: 'pending' | 'succeeded' | 'failed';
  readonly failure: AssetsFailure | null;
}

/** Where the last lookup of a site location asked by the owner stands. */
export interface GeocodingRetryState {
  readonly siteId: number;
  readonly status: 'pending' | 'succeeded' | 'failed';
  /** The geocoding status the site came back with, once the retry succeeded. */
  readonly outcome: GeocodingStatus | null;
  readonly failure: AssetsFailure | null;
}

/** Where the verification of a site address stands. */
export interface AddressVerificationState {
  readonly status: 'idle' | 'verifying' | 'verified' | 'failed';
  /** The verified address, while its token can still be presented. */
  readonly verified: VerifiedAddress | null;
  readonly failure: AssetsFailure | null;
  /** The addresses the owner may choose from when the typed one was not verified. */
  readonly candidates: readonly string[];
}

/** The equipment filters the owner sets; the page is chosen separately. */
export type EquipmentFilters = Pick<EquipmentQuery, 'search' | 'status' | 'type' | 'siteId'>;

/** The state of an asynchronous read: its data, whether it is in progress and why it last failed. */
interface ReadState<T> {
  readonly value: WritableSignal<T>;
  readonly loading: WritableSignal<boolean>;
  readonly failure: WritableSignal<AssetsFailure | null>;
}

function readState<T>(initial: T): ReadState<T> {
  return {
    value: signal(initial),
    loading: signal(false),
    failure: signal<AssetsFailure | null>(null),
  };
}

function resetReadState<T>(state: ReadState<T>, initial: T): void {
  state.value.set(initial);
  state.loading.set(false);
  state.failure.set(null);
}

/** The equipment list query of a new session: no filter, first page. */
const INITIAL_EQUIPMENT_QUERY: EquipmentQuery = {
  search: '',
  status: null,
  type: null,
  siteId: null,
  page: 0,
  size: EQUIPMENT_PAGE_SIZE,
};

const IDLE_VERIFICATION: AddressVerificationState = {
  status: 'idle',
  verified: null,
  failure: null,
  candidates: [],
};

/** Failures meaning the selected equipment is stale and must be read again. */
const STALE_EQUIPMENT_FAILURES: ReadonlySet<AssetsFailure> = new Set([
  'INVALID_STATUS_TRANSITION',
  'CONCURRENT_MODIFICATION_CONFLICT',
]);

/** Failures meaning the loaded sites are stale and must be read again. */
const STALE_SITE_FAILURES: ReadonlySet<AssetsFailure> = new Set([
  'INVALID_STATUS_TRANSITION',
  'CONCURRENT_MODIFICATION_CONFLICT',
]);

const byName = (first: Site, second: Site): number => first.name.localeCompare(second.name);

/**
 * Assets Store manages the owner's sites and refrigeration equipment: the site list and its address
 * verification, the filtered and paged equipment list, and the selected equipment with its threshold and
 * status.
 *
 * It holds signal-based state only and delegates every operation to Assets Management use cases. The
 * backend scopes every read and write to the authenticated owner. The loaded state is kept for the owner
 * session the views retain it for, so a view opened again shows it at once while it is read again; once
 * that session ends, every operation in progress stops and everything is discarded.
 */
@Injectable({
  providedIn: 'root',
})
export class AssetsStore {
  private readonly loadSitesUseCase = inject(LoadSitesUseCase);
  private readonly validateSiteAddressUseCase = inject(ValidateSiteAddressUseCase);
  private readonly registerSiteUseCase = inject(RegisterSiteUseCase);
  private readonly updateSiteUseCase = inject(UpdateSiteUseCase);
  private readonly changeSiteAddressUseCase = inject(ChangeSiteAddressUseCase);
  private readonly retrySiteGeocodingUseCase = inject(RetrySiteGeocodingUseCase);
  private readonly loadEquipmentPageUseCase = inject(LoadEquipmentPageUseCase);
  private readonly loadEquipmentUseCase = inject(LoadEquipmentUseCase);
  private readonly registerEquipmentUseCase = inject(RegisterEquipmentUseCase);
  private readonly updateEquipmentUseCase = inject(UpdateEquipmentUseCase);
  private readonly changeEquipmentThresholdUseCase = inject(ChangeEquipmentThresholdUseCase);
  private readonly changeEquipmentStatusUseCase = inject(ChangeEquipmentStatusUseCase);

  // Sites.
  private readonly sitesState = readState<readonly Site[] | null>(null);
  /** The owner's sites sorted by name, empty until they are loaded. */
  readonly sites = computed(() => this.sitesState.value() ?? []);
  readonly sitesLoaded = computed(() => this.sitesState.value() !== null);
  readonly sitesLoading = this.sitesState.loading.asReadonly();
  readonly sitesFailure = this.sitesState.failure.asReadonly();
  /** The number of equipment items installed across the owner's sites. */
  readonly equipmentTotal = computed(() =>
    this.sites().reduce((total, site) => total + site.equipment_count, 0),
  );

  private readonly addressVerificationSignal = signal<AddressVerificationState>(IDLE_VERIFICATION);
  /** The verification of the address a site is being registered at or moved to. */
  readonly addressVerification = this.addressVerificationSignal.asReadonly();

  private readonly siteActionSignal = signal<ActionState<SiteAction> | null>(null);
  readonly siteActionState = this.siteActionSignal.asReadonly();
  readonly siteActionPending = computed(() => this.siteActionSignal()?.status === 'pending');

  private readonly geocodingRetrySignal = signal<GeocodingRetryState | null>(null);
  /** The last lookup of a site location asked by the owner, until it is cleared. */
  readonly geocodingRetry = this.geocodingRetrySignal.asReadonly();

  // Equipment list.
  private readonly queryState = signal<EquipmentQuery>(INITIAL_EQUIPMENT_QUERY);
  /** The filters and page of the equipment list. */
  readonly equipmentQuery = this.queryState.asReadonly();
  /** Whether any filter narrows the equipment list. */
  readonly equipmentFiltered = computed(() => {
    const { search, status, type, siteId } = this.queryState();
    return search.trim() !== '' || status !== null || type !== null || siteId !== null;
  });
  private readonly pageState = readState<EquipmentPage | null>(null);
  /** The current page of the equipment list, or null until one is loaded. */
  readonly equipmentPage = this.pageState.value.asReadonly();
  readonly equipmentPageLoading = this.pageState.loading.asReadonly();
  readonly equipmentPageFailure = this.pageState.failure.asReadonly();

  // Selected equipment.
  private readonly selectedState = readState<Equipment | null>(null);
  /** The equipment last loaded for the detail, or null while none is loaded. */
  readonly selectedEquipment = this.selectedState.value.asReadonly();
  readonly selectedEquipmentLoading = this.selectedState.loading.asReadonly();
  /** Why the equipment could not be loaded; `NOT_FOUND` when it does not exist or is not the owner's. */
  readonly selectedEquipmentFailure = this.selectedState.failure.asReadonly();

  private readonly equipmentActionSignal = signal<ActionState<EquipmentAction> | null>(null);
  readonly equipmentActionState = this.equipmentActionSignal.asReadonly();
  readonly equipmentActionPending = computed(
    () => this.equipmentActionSignal()?.status === 'pending',
  );

  private sitesSubscription: Subscription | null = null;
  private verificationSubscription: Subscription | null = null;
  private pageSubscription: Subscription | null = null;
  private selectedSubscription: Subscription | null = null;
  /** Every read and write of the session in progress, stopped when the session ends. */
  private sessionWork = new Subscription();
  private retainedSession: DestroyRef | null = null;

  /**
   * Keeps the loaded state until the owner session ends; then every operation in progress stops and the
   * state is discarded, so nothing reaches the next session.
   * @param session - The lifetime of the owner session.
   */
  retain(session: DestroyRef): void {
    if (this.retainedSession === session) {
      return;
    }
    this.retainedSession = session;
    session.onDestroy(() => {
      if (this.retainedSession === session) {
        this.retainedSession = null;
        this.release();
      }
    });
  }

  /**
   * Loads the owner's sites, keeping the ones in memory until the new ones arrive.
   */
  loadSites(): void {
    this.sitesSubscription?.unsubscribe();
    this.sitesSubscription = this.run(this.loadSitesUseCase.execute(), this.sitesState, (sites) =>
      this.sitesState.value.set(sites),
    );
  }

  /**
   * Verifies an address for a site. A newer verification supersedes one still in progress.
   * @param address - The free-form address.
   */
  verifyAddress(address: string): void {
    this.verificationSubscription?.unsubscribe();
    this.addressVerificationSignal.set({ ...IDLE_VERIFICATION, status: 'verifying' });
    this.verificationSubscription = this.track(
      this.validateSiteAddressUseCase.execute(address),
    ).subscribe({
      next: (verified) =>
        this.addressVerificationSignal.set({ ...IDLE_VERIFICATION, status: 'verified', verified }),
      error: (error: unknown) =>
        this.addressVerificationSignal.set({
          status: 'failed',
          verified: null,
          failure: toAssetsFailure(error),
          candidates: error instanceof AssetsError ? error.candidates : [],
        }),
    });
  }

  /**
   * Discards the address verification, for example when the owner types another address.
   */
  clearAddressVerification(): void {
    this.verificationSubscription?.unsubscribe();
    this.addressVerificationSignal.set(IDLE_VERIFICATION);
  }

  /**
   * Registers a site at the verified address. Ignored without a verified address or while another site
   * action is pending.
   * @param details - The contact data of the site.
   */
  registerSite(details: SiteDetails): void {
    const verified = this.addressVerificationSignal().verified;
    if (verified === null) {
      return;
    }
    this.runSiteAction(
      'register',
      this.registerSiteUseCase.execute({ ...details, validationToken: verified.validationToken }),
    );
  }

  /**
   * Replaces the name, contact name and phone of a site, as it is loaded now. Ignored for a site that is
   * not loaded.
   * @param siteId - The identifier of the site.
   * @param details - The new contact data.
   */
  updateSite(siteId: number, details: SiteDetails): void {
    const site = this.loadedSite(siteId);
    if (site !== null) {
      this.runSiteAction('update', this.updateSiteUseCase.execute(site, details));
    }
  }

  /**
   * Moves a site, as it is loaded now, to the verified address. Ignored without a verified address or for
   * a site that is not loaded.
   * @param siteId - The identifier of the site.
   */
  changeSiteAddress(siteId: number): void {
    const verified = this.addressVerificationSignal().verified;
    const site = this.loadedSite(siteId);
    if (verified === null || site === null) {
      return;
    }
    this.runSiteAction(
      'change-address',
      this.changeSiteAddressUseCase.execute(site, verified.validationToken),
    );
  }

  /**
   * Looks the address of a site that is not located up again. Ignored while another lookup is pending.
   * The site is replaced by the answer, which may still be pending while the backend keeps looking. When
   * the site turns out to be located already, the sites are read again.
   * @param siteId - The identifier of the site.
   */
  retrySiteGeocoding(siteId: number): void {
    if (this.geocodingRetrySignal()?.status === 'pending') {
      return;
    }
    this.geocodingRetrySignal.set({ siteId, status: 'pending', outcome: null, failure: null });
    this.track(this.retrySiteGeocodingUseCase.execute(siteId)).subscribe({
      next: (site) => {
        this.applySite(site);
        this.geocodingRetrySignal.set({
          siteId,
          status: 'succeeded',
          outcome: site.geocoding_status,
          failure: null,
        });
      },
      error: (error: unknown) => {
        const failure = toAssetsFailure(error);
        this.geocodingRetrySignal.set({ siteId, status: 'failed', outcome: null, failure });
        if (STALE_SITE_FAILURES.has(failure) || failure === 'GEOCODING_UNAVAILABLE') {
          this.loadSites();
        }
      },
    });
  }

  /**
   * Clears the outcome of the last site location lookup.
   */
  clearGeocodingRetry(): void {
    if (this.geocodingRetrySignal()?.status !== 'pending') {
      this.geocodingRetrySignal.set(null);
    }
  }

  /**
   * Clears the outcome of the last site action and the address verification.
   */
  clearSiteActionState(): void {
    if (!this.siteActionPending()) {
      this.siteActionSignal.set(null);
      this.clearAddressVerification();
    }
  }

  /**
   * Loads a page of the owner's equipment. A newer load supersedes one still in progress.
   * @param change - The filters or page to apply; the rest of the current query is kept. Changing any
   * filter returns to the first page.
   */
  loadEquipmentPage(change: Partial<EquipmentFilters & Pick<EquipmentQuery, 'page'>> = {}): void {
    const filtersChanged = (['search', 'status', 'type', 'siteId'] as const).some(
      (key) => change[key] !== undefined,
    );
    this.queryState.update((query) => ({
      ...query,
      ...change,
      page: change.page ?? (filtersChanged ? 0 : query.page),
    }));
    this.pageSubscription?.unsubscribe();
    this.pageSubscription = this.run(
      this.loadEquipmentPageUseCase.execute(this.queryState()),
      this.pageState,
      (page) => this.pageState.value.set(page),
    );
  }

  /**
   * Loads an equipment item for the detail. An item of another id is discarded first, so it is never
   * shown as this one.
   * @param equipmentId - The identifier of the equipment.
   */
  loadEquipment(equipmentId: number): void {
    if (this.selectedState.value()?.id !== equipmentId) {
      this.selectedState.value.set(null);
      this.equipmentActionSignal.set(null);
    }
    this.selectedSubscription?.unsubscribe();
    this.selectedSubscription = this.run(
      this.loadEquipmentUseCase.execute(equipmentId),
      this.selectedState,
      (equipment) => this.applyEquipment(equipment),
    );
  }

  /**
   * Registers an equipment item, then reloads the list and the sites, whose equipment count changed.
   * @param equipment - The data of the new equipment.
   */
  registerEquipment(equipment: NewEquipment): void {
    this.runEquipmentAction('register', this.registerEquipmentUseCase.execute(equipment), () => {
      this.loadEquipmentPage();
      this.loadSites();
    });
  }

  /**
   * Replaces the name, type and maintenance interval of the selected equipment.
   * @param changes - The new values.
   */
  updateEquipment(changes: EquipmentChanges): void {
    const equipment = this.selectedState.value();
    if (equipment !== null) {
      this.runEquipmentAction(
        'update',
        this.updateEquipmentUseCase.execute(equipment, changes),
        (updated) => this.applyEquipment(updated),
      );
    }
  }

  /**
   * Replaces the temperature threshold of the selected equipment.
   * @param threshold - The new threshold.
   */
  changeThreshold(threshold: TemperatureThreshold): void {
    const equipment = this.selectedState.value();
    if (equipment !== null) {
      this.runEquipmentAction(
        'threshold',
        this.changeEquipmentThresholdUseCase.execute(equipment, threshold),
        (updated) => this.applyEquipment(updated),
      );
    }
  }

  /**
   * Moves the selected equipment to a new lifecycle status.
   * @param status - The status to move to.
   */
  changeStatus(status: StatusEquipment): void {
    const equipment = this.selectedState.value();
    if (equipment !== null) {
      this.runEquipmentAction(
        'status',
        this.changeEquipmentStatusUseCase.execute(equipment, status),
        (updated) => this.applyEquipment(updated),
      );
    }
  }

  /**
   * Clears the outcome of the last equipment action.
   */
  clearEquipmentActionState(): void {
    if (!this.equipmentActionPending()) {
      this.equipmentActionSignal.set(null);
    }
  }

  /** Shows an equipment item as the selected one and keeps the loaded list page consistent with it. */
  private applyEquipment(equipment: Equipment): void {
    if (this.selectedState.value()?.id === equipment.id || this.selectedState.value() === null) {
      this.selectedState.value.set(equipment);
    }
    this.pageState.value.update((page) =>
      page === null
        ? page
        : {
            ...page,
            items: page.items.map((item) => (item.id === equipment.id ? equipment : item)),
          },
    );
  }

  /** The loaded site with the given identifier, or null when it is not loaded. */
  private loadedSite(siteId: number): Site | null {
    return this.sitesState.value()?.find((site) => site.id === siteId) ?? null;
  }

  /** Adds or replaces a site in the loaded list, keeping it sorted by name. */
  private applySite(site: Site): void {
    this.sitesState.value.update((sites) =>
      sites === null
        ? sites
        : [...sites.filter((existing) => existing.id !== site.id), site].sort(byName),
    );
  }

  /**
   * Runs a site action. An action asked for while another one is pending is ignored. A rejected address
   * token (missing, expired or foreign) discards the verification, so the owner verifies again. When the
   * site changed meanwhile, the sites are read again so the next attempt starts from the current one.
   */
  private runSiteAction(action: SiteAction, operation: Observable<Site>): void {
    if (this.siteActionPending()) {
      return;
    }
    this.siteActionSignal.set({ action, status: 'pending', failure: null });
    this.track(operation).subscribe({
      next: (site) => {
        this.applySite(site);
        this.siteActionSignal.set({ action, status: 'succeeded', failure: null });
        this.clearAddressVerification();
      },
      error: (error: unknown) => {
        const failure = toAssetsFailure(error);
        this.siteActionSignal.set({ action, status: 'failed', failure });
        if (failure === 'ADDRESS_VALIDATION_REQUIRED') {
          this.clearAddressVerification();
        }
        if (failure === 'CONCURRENT_MODIFICATION_CONFLICT') {
          this.loadSites();
        }
      },
    });
  }

  /**
   * Runs an equipment action. An action asked for while another one is pending is ignored, so a double
   * submission never registers two items. When the backend reports the selected equipment as stale, it is
   * read again before the failure is exposed.
   */
  private runEquipmentAction(
    action: EquipmentAction,
    operation: Observable<Equipment>,
    apply: (equipment: Equipment) => void,
  ): void {
    if (this.equipmentActionPending()) {
      return;
    }
    this.equipmentActionSignal.set({ action, status: 'pending', failure: null });
    this.track(operation).subscribe({
      next: (equipment) => {
        apply(equipment);
        this.equipmentActionSignal.set({ action, status: 'succeeded', failure: null });
      },
      error: (error: unknown) => {
        const failure = toAssetsFailure(error);
        this.equipmentActionSignal.set({ action, status: 'failed', failure });
        const selected = this.selectedState.value();
        if (STALE_EQUIPMENT_FAILURES.has(failure) && selected !== null) {
          this.loadEquipment(selected.id);
        }
      },
    });
  }

  /**
   * Runs a read: tracks it as in progress, clears its previous failure and applies its result, or keeps
   * the current state and records the failure.
   */
  private run<T>(
    operation: Observable<T>,
    state: Pick<ReadState<unknown>, 'loading' | 'failure'>,
    apply: (result: T) => void,
  ): Subscription {
    state.loading.set(true);
    state.failure.set(null);
    return this.track(operation.pipe(finalize(() => state.loading.set(false)))).subscribe({
      next: apply,
      error: (error: unknown) => state.failure.set(toAssetsFailure(error)),
    });
  }

  /** Runs an operation within the session, so it stops when the session ends. */
  private track<T>(operation: Observable<T>): Observable<T> {
    return new Observable<T>((subscriber) => {
      const subscription = operation.subscribe(subscriber);
      this.sessionWork.add(subscription);
      return () => {
        subscription.unsubscribe();
        this.sessionWork.remove(subscription);
      };
    });
  }

  /** Stops every operation in progress and discards every loaded value once the session ends. */
  private release(): void {
    this.sessionWork.unsubscribe();
    this.sessionWork = new Subscription();
    this.sitesSubscription = null;
    this.verificationSubscription = null;
    this.pageSubscription = null;
    this.selectedSubscription = null;
    resetReadState(this.sitesState, null);
    resetReadState(this.pageState, null);
    resetReadState(this.selectedState, null);
    this.queryState.set(INITIAL_EQUIPMENT_QUERY);
    this.addressVerificationSignal.set(IDLE_VERIFICATION);
    this.siteActionSignal.set(null);
    this.geocodingRetrySignal.set(null);
    this.equipmentActionSignal.set(null);
  }
}
