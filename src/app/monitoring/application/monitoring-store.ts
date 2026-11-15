import { computed, type DestroyRef, inject, Injectable, signal, type Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  defer,
  finalize,
  NEVER,
  type Observable,
  share,
  type Subscription,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import type { Alert } from '@monitoring/domain/model/alert.entity';
import type { AlertPolicy } from '@monitoring/domain/model/alert-policy.entity';
import type { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import type { AlertDismissal } from '@monitoring/application/contracts/alert-dismissal';
import type { AlertPage, AlertQuery } from '@monitoring/application/contracts/alert-page';
import type { DashboardSummary } from '@monitoring/application/contracts/dashboard-summary';
import type { MonitoredEquipment } from '@monitoring/application/contracts/monitored-equipment';
import {
  type MonitoringFailure,
  toMonitoringFailure,
} from '@monitoring/application/contracts/monitoring-error';
import type {
  AlertWithEquipment,
  EquipmentTelemetryContext,
  MonitoringOverview,
} from '@monitoring/application/contracts/monitoring-overview';
import type {
  ConnectivityChange,
  MonitoringUpdate,
} from '@monitoring/application/contracts/monitoring-update';
import {
  mergePoints,
  type TelemetryHistory,
  withLiveReading,
} from '@monitoring/application/contracts/telemetry-history';
import { AcknowledgeAlertUseCase } from '@monitoring/application/use-cases/acknowledge-alert.use-case';
import { DismissAlertUseCase } from '@monitoring/application/use-cases/dismiss-alert.use-case';
import { LoadAlertDetailUseCase } from '@monitoring/application/use-cases/load-alert-detail.use-case';
import { LoadAlertPageUseCase } from '@monitoring/application/use-cases/load-alert-page.use-case';
import { LoadAlertUseCase } from '@monitoring/application/use-cases/load-alert.use-case';
import { LoadDashboardSummaryUseCase } from '@monitoring/application/use-cases/load-dashboard-summary.use-case';
import { LoadEquipmentTelemetryUseCase } from '@monitoring/application/use-cases/load-equipment-telemetry.use-case';
import { LoadMonitoringOverviewUseCase } from '@monitoring/application/use-cases/load-monitoring-overview.use-case';
import { LoadReadingHistoryUseCase } from '@monitoring/application/use-cases/load-reading-history.use-case';
import { ResolveAlertUseCase } from '@monitoring/application/use-cases/resolve-alert.use-case';
import { WatchMonitoringUpdatesUseCase } from '@monitoring/application/use-cases/watch-monitoring-updates.use-case';

/** The lifecycle actions the owner runs on an alert. */
export type AlertAction = 'acknowledge' | 'resolve' | 'dismiss';

/** The outcome of the last alert action, until it is cleared. */
export interface AlertActionState {
  readonly alertId: number;
  readonly action: AlertAction;
  readonly status: 'pending' | 'succeeded' | 'failed';
  readonly failure: MonitoringFailure | null;
}

/**
 * Where the live monitoring feed stands:
 * - `idle`: no monitoring view is open.
 * - `connecting`: the first connection is being opened.
 * - `live`: updates arrive as they happen.
 * - `reconnecting`: the feed dropped; shown data may be behind until it reconnects.
 * - `unavailable`: the feed cannot be opened for this session; data is refreshed on demand only.
 */
export type LiveStatus = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'unavailable';

/**
 * How long the live feed is kept open after the last monitoring view closes, so moving
 * between monitoring views keeps one connection.
 */
const FEED_CLOSE_DELAY_MS = 1_000;

/**
 * How long live alert changes are gathered before the totals and the alert page shown are read again, so a
 * burst of changes costs one read.
 */
const ALERT_REFRESH_DELAY_MS = 1_000;

/** The number of alerts per page of the alert list. */
export const ALERT_PAGE_SIZE = 10;

/** The alert list filters the owner sets; the page is chosen separately. */
export type AlertFilters = Pick<AlertQuery, 'statuses' | 'severities' | 'types' | 'equipmentId'>;

/** Failures meaning the alert changed or disappeared and must be read again. */
const STALE_ALERT_FAILURES: ReadonlySet<MonitoringFailure> = new Set([
  'INVALID_STATUS_TRANSITION',
  'CONCURRENT_MODIFICATION_CONFLICT',
  'NOT_FOUND',
]);

const newestFirst = (first: Alert, second: Alert): number =>
  second.opened_at.getTime() - first.opened_at.getTime();

/**
 * Moves the last known telemetry of an equipment item forward with a newer reading. A reading older than
 * the last one known never moves it back.
 */
function withReading(equipment: MonitoredEquipment, reading: SensorReading): MonitoredEquipment {
  if (
    equipment.id !== reading.equipment_id ||
    (equipment.lastReadingAt !== null &&
      reading.recorded_at.getTime() <= equipment.lastReadingAt.getTime())
  ) {
    return equipment;
  }
  // Connectivity is left as the server stated it; its changes arrive as connectivity events.
  return {
    ...equipment,
    lastReadingAt: reading.recorded_at,
    lastKnownTemperature: reading.avg_temperature,
  };
}

/** Applies a live connectivity change to an equipment item. */
function withConnectivity(
  equipment: MonitoredEquipment,
  change: ConnectivityChange,
): MonitoredEquipment {
  if (equipment.id !== change.equipmentId) {
    return equipment;
  }
  return {
    ...equipment,
    connectivity: {
      ...equipment.connectivity,
      state: change.state,
      lastReceivedAt: change.lastReceivedAt,
      underMaintenance: change.underMaintenance,
      // The change is the latest server evaluation.
      evaluatedAt: change.changedAt,
    },
  };
}

/**
 * Monitoring Store manages the owner's monitoring state: the overview (equipment with its last known
 * telemetry, applicable policies and counters), the active alerts, the selected alert, the telemetry of
 * the selected equipment and its reading history, the outcome of alert actions, and the live feed.
 *
 * It holds signal-based state only and delegates every operation to Monitoring and Alerting use cases.
 * Alert actions are not applied optimistically: the alert is replaced by the one the backend answers, and
 * a rejected action reads the alert again. Live updates reconcile the loaded state; a (re)connection whose
 * missed events could not all be replayed reads the loaded state again. The loaded state is kept for the
 * owner session, so a monitoring view opened again shows it at once while it is read again; the live feed
 * closes once no monitoring view uses it, and everything is discarded when the session ends.
 */
@Injectable({
  providedIn: 'root',
})
export class MonitoringStore {
  private readonly loadMonitoringOverviewUseCase = inject(LoadMonitoringOverviewUseCase);
  private readonly loadAlertUseCase = inject(LoadAlertUseCase);
  private readonly loadAlertPageUseCase = inject(LoadAlertPageUseCase);
  private readonly loadDashboardSummaryUseCase = inject(LoadDashboardSummaryUseCase);
  private readonly loadAlertDetailUseCase = inject(LoadAlertDetailUseCase);
  private readonly acknowledgeAlertUseCase = inject(AcknowledgeAlertUseCase);
  private readonly resolveAlertUseCase = inject(ResolveAlertUseCase);
  private readonly dismissAlertUseCase = inject(DismissAlertUseCase);
  private readonly loadEquipmentTelemetryUseCase = inject(LoadEquipmentTelemetryUseCase);
  private readonly loadReadingHistoryUseCase = inject(LoadReadingHistoryUseCase);
  private readonly watchMonitoringUpdatesUseCase = inject(WatchMonitoringUpdatesUseCase);

  // Overview.
  private readonly overviewRequested = signal(false);
  private readonly equipmentSignal = signal<readonly MonitoredEquipment[] | null>(null);
  private readonly summarySignal = signal<DashboardSummary | null>(null);
  private readonly overviewLoadingSignal = signal(false);
  private readonly overviewFailureSignal = signal<MonitoringFailure | null>(null);
  private readonly overviewUpdatedAtSignal = signal<Date | null>(null);
  /** Whether the overview has been loaded at least once. */
  readonly overviewLoaded = computed(() => this.equipmentSignal() !== null);
  /** The owner's equipment with its last known telemetry, empty until the overview is loaded. */
  readonly equipment = computed(() => this.equipmentSignal() ?? []);
  readonly equipmentById: Signal<ReadonlyMap<number, MonitoredEquipment>> = computed(
    () => new Map(this.equipment().map((item) => [item.id, item])),
  );
  /** The totals of the owner's dashboard, computed by the backend, or null until loaded. */
  readonly summary = this.summarySignal.asReadonly();
  readonly overviewLoading = this.overviewLoadingSignal.asReadonly();
  readonly overviewFailure = this.overviewFailureSignal.asReadonly();
  /** When the overview was last read from the backend. */
  readonly overviewUpdatedAt = this.overviewUpdatedAtSignal.asReadonly();

  // Policies and active alerts, shared by every view.
  private readonly policiesSignal = signal<ReadonlyMap<number, AlertPolicy>>(new Map());
  private readonly activeAlertsSignal = signal<ReadonlyMap<number, Alert>>(new Map());
  /** The most recently opened OPEN and ACKNOWLEDGED alerts known so far, newest first. */
  readonly activeAlerts = computed(() => [...this.activeAlertsSignal().values()].sort(newestFirst));

  // Alert list, current and past alerts, paged by the backend.
  private readonly alertQuerySignal = signal<AlertQuery>({
    statuses: [],
    severities: [],
    types: [],
    equipmentId: null,
    page: 0,
    size: ALERT_PAGE_SIZE,
  });
  private readonly alertPageSignal = signal<AlertPage | null>(null);
  private readonly alertPageLoadingSignal = signal(false);
  private readonly alertPageFailureSignal = signal<MonitoringFailure | null>(null);
  /** The filters and page of the alert list. */
  readonly alertQuery = this.alertQuerySignal.asReadonly();
  /** The current page of the alert list, or null until one is loaded. */
  readonly alertPage = this.alertPageSignal.asReadonly();
  readonly alertPageLoading = this.alertPageLoadingSignal.asReadonly();
  readonly alertPageFailure = this.alertPageFailureSignal.asReadonly();

  // Selected alert.
  private readonly selectedAlertIdSignal = signal<number | null>(null);
  private readonly selectedAlertSignal = signal<AlertWithEquipment | null>(null);
  private readonly selectedAlertLoadingSignal = signal(false);
  private readonly selectedAlertFailureSignal = signal<MonitoringFailure | null>(null);
  /** The alert last loaded for the detail, with its equipment, or null while none is loaded. */
  readonly selectedAlert = this.selectedAlertSignal.asReadonly();
  readonly selectedAlertLoading = this.selectedAlertLoadingSignal.asReadonly();
  /** Why the alert could not be loaded; `NOT_FOUND` when it does not exist or is not the owner's. */
  readonly selectedAlertFailure = this.selectedAlertFailureSignal.asReadonly();

  // Telemetry of the selected equipment.
  private readonly telemetryEquipmentIdSignal = signal<number | null>(null);
  private readonly telemetryContextSignal = signal<EquipmentTelemetryContext | null>(null);
  private readonly telemetryLoadingSignal = signal(false);
  private readonly telemetryFailureSignal = signal<MonitoringFailure | null>(null);
  /** The selected equipment, with its last known telemetry, or null while none is loaded. */
  readonly telemetryEquipment = computed(() => this.telemetryContextSignal()?.equipment ?? null);
  /** The alert policy of the selected equipment, or null when unknown. */
  readonly telemetryPolicy = computed(() => {
    const id = this.telemetryEquipmentIdSignal();
    return id === null ? null : (this.policiesSignal().get(id) ?? null);
  });
  /** The active alerts of the selected equipment, newest first. */
  readonly telemetryActiveAlerts = computed(() => {
    const id = this.telemetryEquipmentIdSignal();
    return this.activeAlerts().filter((alert) => alert.equipment_id === id);
  });
  readonly telemetryLoading = this.telemetryLoadingSignal.asReadonly();
  /** Why the equipment could not be loaded; `NOT_FOUND` when it does not exist or is not the owner's. */
  readonly telemetryFailure = this.telemetryFailureSignal.asReadonly();

  private readonly historyQuery = signal<{ equipmentId: number; durationMinutes: number } | null>(
    null,
  );
  private readonly historySignal = signal<TelemetryHistory | null>(null);
  private readonly historyFromSignal = signal<Date | null>(null);
  private readonly historyLoadingSignal = signal(false);
  private readonly historyFailureSignal = signal<MonitoringFailure | null>(null);
  /** The points of the selected period, oldest first, or null while none are loaded. */
  readonly history = computed(() => this.historySignal()?.points ?? null);
  /** The width of the buckets the history is aggregated in, in seconds, or null for raw batches. */
  readonly historyBucketSeconds = computed(() => this.historySignal()?.bucketSeconds ?? null);
  readonly historyLoading = this.historyLoadingSignal.asReadonly();
  readonly historyFailure = this.historyFailureSignal.asReadonly();
  /** The latest raw reading batch of the selected equipment among those loaded or received live. */
  readonly latestReading = computed(() => this.historySignal()?.latestReading ?? null);

  // Alert actions.
  private readonly alertActionSignal = signal<AlertActionState | null>(null);
  readonly alertActionState = this.alertActionSignal.asReadonly();
  readonly alertActionPending = computed(() => this.alertActionSignal()?.status === 'pending');

  // Live feed.
  private readonly liveStatusSignal = signal<LiveStatus>('idle');
  readonly liveStatus = this.liveStatusSignal.asReadonly();

  private overviewSubscription: Subscription | null = null;
  private selectedAlertSubscription: Subscription | null = null;
  private telemetrySubscription: Subscription | null = null;
  private historySubscription: Subscription | null = null;
  private actionSubscription: Subscription | null = null;
  private alertPageSubscription: Subscription | null = null;
  private alertRefreshSubscription: Subscription | null = null;
  private readonly refreshSubscriptions = new Set<Subscription>();

  /**
   * The live feed, shared by every monitoring view. It is closed a moment after the last view stops using
   * it; the loaded state is kept until the session ends.
   */
  private readonly liveUpdates: Observable<MonitoringUpdate> = defer(() => {
    this.liveStatusSignal.set('connecting');
    return this.watchMonitoringUpdatesUseCase.execute();
  }).pipe(
    tap((update) => this.applyUpdate(update)),
    // A feed that can never open leaves the views working with on-demand loads.
    catchError(() => {
      this.liveStatusSignal.set('unavailable');
      return NEVER;
    }),
    share({
      resetOnRefCountZero: () =>
        timer(FEED_CLOSE_DELAY_MS).pipe(tap(() => this.liveStatusSignal.set('idle'))),
    }),
  );

  private retainedSession: DestroyRef | null = null;

  /**
   * Keeps the live feed open while the view lives. Every monitoring view connects, so one connection
   * serves them all. The loaded state is kept until the session ends.
   * @param destroyRef - The lifetime of the view.
   * @param session - The lifetime of the owner session the loaded state is kept for.
   */
  connectLiveUpdates(destroyRef: DestroyRef, session: DestroyRef): void {
    if (this.retainedSession !== session) {
      this.retainedSession = session;
      session.onDestroy(() => {
        if (this.retainedSession === session) {
          this.retainedSession = null;
          this.release();
        }
      });
    }
    this.liveUpdates.pipe(takeUntilDestroyed(destroyRef)).subscribe();
  }

  /**
   * Loads the overview, keeping the one in memory until the new one arrives.
   */
  loadOverview(): void {
    this.overviewRequested.set(true);
    this.overviewSubscription?.unsubscribe();
    this.overviewLoadingSignal.set(true);
    this.overviewFailureSignal.set(null);
    this.overviewSubscription = this.loadMonitoringOverviewUseCase
      .execute()
      .pipe(finalize(() => this.overviewLoadingSignal.set(false)))
      .subscribe({
        next: (overview) => this.applyOverview(overview),
        error: (error: unknown) => this.overviewFailureSignal.set(toMonitoringFailure(error)),
      });
  }

  /**
   * Loads a page of the owner's alerts, current and past. A newer load supersedes one still in progress.
   * @param change - The filters or page to apply; the rest of the current query is kept. Changing any
   * filter returns to the first page.
   */
  loadAlertPage(change: Partial<AlertFilters & Pick<AlertQuery, 'page'>> = {}): void {
    const filtersChanged = (['statuses', 'severities', 'types', 'equipmentId'] as const).some(
      (key) => change[key] !== undefined,
    );
    this.alertQuerySignal.update((query) => ({
      ...query,
      ...change,
      page: change.page ?? (filtersChanged ? 0 : query.page),
    }));
    this.alertPageSubscription?.unsubscribe();
    this.alertPageLoadingSignal.set(true);
    this.alertPageFailureSignal.set(null);
    this.alertPageSubscription = this.loadAlertPageUseCase
      .execute(this.alertQuerySignal())
      .pipe(finalize(() => this.alertPageLoadingSignal.set(false)))
      .subscribe({
        next: (page) => {
          this.alertPageSignal.set(page);
          page.items.filter((alert) => alert.isActive()).forEach((alert) => this.applyAlert(alert));
        },
        error: (error: unknown) => this.alertPageFailureSignal.set(toMonitoringFailure(error)),
      });
  }

  /**
   * Loads an alert, whatever its status, with its equipment.
   * @param alertId - The identifier of the alert.
   */
  loadAlert(alertId: number): void {
    if (this.selectedAlertIdSignal() !== alertId) {
      this.selectedAlertIdSignal.set(alertId);
      this.selectedAlertSignal.set(null);
    }
    this.selectedAlertSubscription?.unsubscribe();
    this.selectedAlertLoadingSignal.set(true);
    this.selectedAlertFailureSignal.set(null);
    this.selectedAlertSubscription = this.loadAlertDetailUseCase
      .execute(alertId)
      .pipe(finalize(() => this.selectedAlertLoadingSignal.set(false)))
      .subscribe({
        next: (detail) => {
          this.selectedAlertSignal.set(detail);
          this.applyAlert(detail.alert);
        },
        error: (error: unknown) => this.selectedAlertFailureSignal.set(toMonitoringFailure(error)),
      });
  }

  /**
   * Loads the telemetry context of an equipment item: the item, its policy and its active alerts.
   * @param equipmentId - The identifier of the equipment.
   */
  loadEquipmentTelemetry(equipmentId: number): void {
    if (this.telemetryEquipmentIdSignal() !== equipmentId) {
      this.telemetryEquipmentIdSignal.set(equipmentId);
      this.telemetryContextSignal.set(null);
      this.clearHistory();
    }
    this.telemetrySubscription?.unsubscribe();
    this.telemetryLoadingSignal.set(true);
    this.telemetryFailureSignal.set(null);
    this.telemetrySubscription = this.loadEquipmentTelemetryUseCase
      .execute(equipmentId)
      .pipe(finalize(() => this.telemetryLoadingSignal.set(false)))
      .subscribe({
        next: (context) => {
          this.telemetryContextSignal.set(context);
          if (context.policy !== null) {
            const policy = context.policy;
            this.policiesSignal.update((policies) => new Map(policies).set(equipmentId, policy));
          }
          this.activeAlertsSignal.update((alerts) => {
            const next = new Map(
              [...alerts].filter(([, alert]) => alert.equipment_id !== equipmentId),
            );
            context.activeAlerts.forEach((alert) => next.set(alert.id, alert));
            return next;
          });
        },
        error: (error: unknown) => this.telemetryFailureSignal.set(toMonitoringFailure(error)),
      });
  }

  /**
   * Loads the readings of an equipment item over the period ending now. Choosing another equipment item or
   * period discards the readings in memory.
   * @param equipmentId - The identifier of the equipment.
   * @param durationMinutes - The length of the period.
   */
  loadReadingHistory(equipmentId: number, durationMinutes: number): void {
    const query = this.historyQuery();
    if (query?.equipmentId !== equipmentId || query.durationMinutes !== durationMinutes) {
      this.clearHistory();
      this.historyQuery.set({ equipmentId, durationMinutes });
    }
    const to = new Date();
    const from = new Date(to.getTime() - durationMinutes * 60_000);
    this.historySubscription?.unsubscribe();
    this.historyLoadingSignal.set(true);
    this.historyFailureSignal.set(null);
    this.historySubscription = this.loadReadingHistoryUseCase
      .execute(equipmentId, from, to)
      .pipe(finalize(() => this.historyLoadingSignal.set(false)))
      .subscribe({
        next: (history) => {
          this.historyFromSignal.set(from);
          // Live readings received while loading are kept.
          this.historySignal.update((current) => withLoaded(history, current, from));
        },
        error: (error: unknown) => this.historyFailureSignal.set(toMonitoringFailure(error)),
      });
  }

  /**
   * Acknowledges an OPEN alert.
   * @param alert - The alert.
   */
  acknowledgeAlert(alert: Alert): void {
    this.runAlertAction(alert, 'acknowledge', this.acknowledgeAlertUseCase.execute(alert));
  }

  /**
   * Resolves an active alert.
   * @param alert - The alert.
   */
  resolveAlert(alert: Alert): void {
    this.runAlertAction(alert, 'resolve', this.resolveAlertUseCase.execute(alert));
  }

  /**
   * Dismisses an active alert as a false alarm.
   * @param alert - The alert.
   * @param dismissal - The reason and optional evidence.
   */
  dismissAlert(alert: Alert, dismissal: AlertDismissal): void {
    this.runAlertAction(alert, 'dismiss', this.dismissAlertUseCase.execute(alert, dismissal));
  }

  /** Forgets the outcome of the last alert action. */
  clearAlertAction(): void {
    if (!this.alertActionPending()) {
      this.alertActionSignal.set(null);
    }
  }

  private runAlertAction(alert: Alert, action: AlertAction, run: Observable<Alert>): void {
    if (this.alertActionPending()) {
      return;
    }
    this.alertActionSignal.set({ alertId: alert.id, action, status: 'pending', failure: null });
    this.actionSubscription = run.subscribe({
      next: (updated) => {
        this.applyAlert(updated);
        this.alertActionSignal.set({
          alertId: alert.id,
          action,
          status: 'succeeded',
          failure: null,
        });
      },
      error: (error: unknown) => {
        const failure = toMonitoringFailure(error);
        this.alertActionSignal.set({ alertId: alert.id, action, status: 'failed', failure });
        if (STALE_ALERT_FAILURES.has(failure)) {
          this.refreshAlert(alert.id);
        }
      },
    });
  }

  private applyOverview(overview: MonitoringOverview): void {
    this.equipmentSignal.set(overview.equipment);
    this.summarySignal.set(overview.summary);
    this.activeAlertsSignal.set(new Map(overview.activeAlerts.map((alert) => [alert.id, alert])));
    this.overviewUpdatedAtSignal.set(new Date());
  }

  /** Puts the alert as the backend recorded it everywhere it is shown. */
  private applyAlert(alert: Alert): void {
    this.activeAlertsSignal.update((alerts) => {
      const next = new Map(alerts);
      if (alert.isActive()) {
        next.set(alert.id, alert);
      } else {
        next.delete(alert.id);
      }
      return next;
    });
    this.selectedAlertSignal.update((detail) =>
      detail?.alert.id === alert.id ? { ...detail, alert } : detail,
    );
    this.alertPageSignal.update((page) =>
      page === null
        ? page
        : { ...page, items: page.items.map((item) => (item.id === alert.id ? alert : item)) },
    );
  }

  /**
   * Reads again, once a burst of live alert changes is over, what they make stale: the dashboard totals
   * and the alert page shown, whose filters the changed alerts may now match or leave.
   */
  private scheduleAlertRefresh(): void {
    if (this.summarySignal() === null && this.alertPageSignal() === null) {
      return;
    }
    this.alertRefreshSubscription?.unsubscribe();
    this.alertRefreshSubscription = timer(ALERT_REFRESH_DELAY_MS)
      .pipe(
        tap(() => {
          if (this.alertPageSignal() !== null) {
            this.loadAlertPage();
          }
        }),
        switchMap(() => this.loadDashboardSummaryUseCase.execute()),
      )
      .subscribe({
        next: (summary) => {
          if (this.summarySignal() !== null) {
            this.summarySignal.set(summary);
          }
        },
        // The totals shown stay as they were; the next overview load reads them again.
        error: () => undefined,
      });
  }

  /** Reads an alert again and reconciles it; an alert no longer reachable leaves the active alerts. */
  private refreshAlert(alertId: number): void {
    const subscription = this.loadAlertUseCase
      .execute(alertId)
      .pipe(finalize(() => this.refreshSubscriptions.delete(subscription)))
      .subscribe({
        next: (alert) => this.applyAlert(alert),
        error: (error: unknown) => {
          if (toMonitoringFailure(error) === 'NOT_FOUND') {
            this.activeAlertsSignal.update((alerts) => {
              const next = new Map(alerts);
              next.delete(alertId);
              return next;
            });
          }
        },
      });
    if (!subscription.closed) {
      this.refreshSubscriptions.add(subscription);
    }
  }

  private applyUpdate(update: MonitoringUpdate): void {
    switch (update.kind) {
      case 'connected':
        this.liveStatusSignal.set('live');
        if (!update.resumed) {
          this.resynchronize();
        }
        break;
      case 'disconnected':
        this.liveStatusSignal.set('reconnecting');
        break;
      case 'reading':
        this.applyReading(update.reading);
        break;
      case 'alert-status':
        this.refreshAlert(update.change.alertId);
        this.scheduleAlertRefresh();
        break;
      case 'connectivity':
        this.applyConnectivity(update.change);
        break;
    }
  }

  private applyReading(reading: SensorReading): void {
    this.equipmentSignal.update(
      (equipment) => equipment?.map((item) => withReading(item, reading)) ?? null,
    );
    this.telemetryContextSignal.update((context) =>
      context === null ? null : { ...context, equipment: withReading(context.equipment, reading) },
    );
    const from = this.historyFromSignal();
    if (this.historyQuery()?.equipmentId === reading.equipment_id && from !== null) {
      this.historySignal.update((history) =>
        history === null ? null : withLiveReading(history, reading, from),
      );
    }
  }

  private applyConnectivity(change: ConnectivityChange): void {
    this.equipmentSignal.update(
      (equipment) => equipment?.map((item) => withConnectivity(item, change)) ?? null,
    );
    this.telemetryContextSignal.update((context) =>
      context === null
        ? null
        : { ...context, equipment: withConnectivity(context.equipment, change) },
    );
  }

  /** Reads again everything a view asked for, since updates sent while disconnected are lost. */
  private resynchronize(): void {
    if (this.overviewRequested()) {
      this.loadOverview();
    }
    if (this.alertPageSignal() !== null) {
      this.loadAlertPage();
    }
    const equipmentId = this.telemetryEquipmentIdSignal();
    if (equipmentId !== null) {
      this.loadEquipmentTelemetry(equipmentId);
    }
    const query = this.historyQuery();
    if (query !== null) {
      this.loadReadingHistory(query.equipmentId, query.durationMinutes);
    }
    const alertId = this.selectedAlertIdSignal();
    if (alertId !== null) {
      this.loadAlert(alertId);
    }
  }

  private clearHistory(): void {
    this.historySubscription?.unsubscribe();
    this.historyQuery.set(null);
    this.historySignal.set(null);
    this.historyFromSignal.set(null);
    this.historyLoadingSignal.set(false);
    this.historyFailureSignal.set(null);
  }

  /** Discards every loaded value once the session ends. */
  private release(): void {
    [
      this.overviewSubscription,
      this.selectedAlertSubscription,
      this.telemetrySubscription,
      this.actionSubscription,
      this.alertPageSubscription,
      this.alertRefreshSubscription,
      ...this.refreshSubscriptions,
    ].forEach((subscription) => subscription?.unsubscribe());
    this.refreshSubscriptions.clear();
    this.clearHistory();
    this.overviewRequested.set(false);
    this.equipmentSignal.set(null);
    this.summarySignal.set(null);
    this.alertPageSignal.set(null);
    this.alertPageLoadingSignal.set(false);
    this.alertPageFailureSignal.set(null);
    this.alertQuerySignal.update((query) => ({ ...query, page: 0 }));
    this.overviewLoadingSignal.set(false);
    this.overviewFailureSignal.set(null);
    this.overviewUpdatedAtSignal.set(null);
    this.policiesSignal.set(new Map());
    this.activeAlertsSignal.set(new Map());
    this.selectedAlertIdSignal.set(null);
    this.selectedAlertSignal.set(null);
    this.selectedAlertLoadingSignal.set(false);
    this.selectedAlertFailureSignal.set(null);
    this.telemetryEquipmentIdSignal.set(null);
    this.telemetryContextSignal.set(null);
    this.telemetryLoadingSignal.set(false);
    this.telemetryFailureSignal.set(null);
    this.alertActionSignal.set(null);
    this.liveStatusSignal.set('idle');
  }
}

/**
 * Combines a loaded history with the one in memory. Raw batches received live while loading are kept;
 * an aggregated history is taken as loaded, since its buckets already hold the batches stored so far.
 */
function withLoaded(
  loaded: TelemetryHistory,
  current: TelemetryHistory | null,
  from: Date,
): TelemetryHistory {
  if (current === null || loaded.bucketSeconds !== null || current.bucketSeconds !== null) {
    return loaded;
  }
  const latest = [loaded.latestReading, current.latestReading].reduce<SensorReading | null>(
    (newest, reading) =>
      reading !== null &&
      (newest === null || reading.recorded_at.getTime() > newest.recorded_at.getTime())
        ? reading
        : newest,
    null,
  );
  return {
    points: mergePoints(loaded.points, current.points, from),
    bucketSeconds: null,
    latestReading: latest,
  };
}
