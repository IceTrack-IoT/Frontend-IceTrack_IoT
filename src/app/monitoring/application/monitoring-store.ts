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
  tap,
  timer,
} from 'rxjs';
import type { Alert } from '@monitoring/domain/model/alert.entity';
import type { AlertPolicy } from '@monitoring/domain/model/alert-policy.entity';
import type { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import type { AlertDismissal } from '@monitoring/application/contracts/alert-dismissal';
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
import type { MonitoringUpdate } from '@monitoring/application/contracts/monitoring-update';
import { AcknowledgeAlertUseCase } from '@monitoring/application/use-cases/acknowledge-alert.use-case';
import { DismissAlertUseCase } from '@monitoring/application/use-cases/dismiss-alert.use-case';
import { LoadAlertDetailUseCase } from '@monitoring/application/use-cases/load-alert-detail.use-case';
import { LoadAlertUseCase } from '@monitoring/application/use-cases/load-alert.use-case';
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
 * How long the live feed and the loaded state are kept after the last monitoring view closes, so moving
 * between monitoring views keeps one connection.
 */
const RELEASE_DELAY_MS = 1_000;

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
  return {
    ...equipment,
    lastReadingAt: reading.recorded_at,
    lastKnownTemperature: reading.avg_temperature,
  };
}

/**
 * Monitoring Store manages the owner's monitoring state: the overview (equipment with its last known
 * telemetry, applicable policies and counters), the active alerts, the selected alert, the telemetry of
 * the selected equipment and its reading history, the outcome of alert actions, and the live feed.
 *
 * It holds signal-based state only and delegates every operation to Monitoring and Alerting use cases.
 * Alert actions are not applied optimistically: the alert is replaced by the one the backend answers, and
 * a rejected action reads the alert again. Live updates reconcile the loaded state; on every (re)connection
 * the loaded state is read again because the feed carries no replay. The state is discarded once no
 * monitoring view uses it, so nothing is kept between sessions.
 */
@Injectable({
  providedIn: 'root',
})
export class MonitoringStore {
  private readonly loadMonitoringOverviewUseCase = inject(LoadMonitoringOverviewUseCase);
  private readonly loadAlertUseCase = inject(LoadAlertUseCase);
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
  private readonly siteCountSignal = signal(0);
  private readonly activeServiceRequestsSignal = signal<number | null>(null);
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
  readonly siteCount = this.siteCountSignal.asReadonly();
  /** The number of the owner's active service requests, or null when it could not be read. */
  readonly activeServiceRequests = this.activeServiceRequestsSignal.asReadonly();
  readonly overviewLoading = this.overviewLoadingSignal.asReadonly();
  readonly overviewFailure = this.overviewFailureSignal.asReadonly();
  /** When the overview was last read from the backend. */
  readonly overviewUpdatedAt = this.overviewUpdatedAtSignal.asReadonly();

  // Policies and active alerts, shared by every view.
  private readonly policiesSignal = signal<ReadonlyMap<number, AlertPolicy>>(new Map());
  /** The applicable alert policy of each equipment item read so far, by equipment id. */
  readonly policies = this.policiesSignal.asReadonly();
  private readonly activeAlertsSignal = signal<ReadonlyMap<number, Alert>>(new Map());
  /** The OPEN and ACKNOWLEDGED alerts known so far, newest first. */
  readonly activeAlerts = computed(() => [...this.activeAlertsSignal().values()].sort(newestFirst));

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
  private readonly historySignal = signal<readonly SensorReading[] | null>(null);
  private readonly historyFromSignal = signal<Date | null>(null);
  private readonly historyLoadingSignal = signal(false);
  private readonly historyFailureSignal = signal<MonitoringFailure | null>(null);
  /** The readings of the selected period, oldest first, or null while none are loaded. */
  readonly history = this.historySignal.asReadonly();
  readonly historyLoading = this.historyLoadingSignal.asReadonly();
  readonly historyFailure = this.historyFailureSignal.asReadonly();
  /** The latest reading batch of the selected equipment among those loaded or received live. */
  readonly latestReading = computed(() => this.historySignal()?.at(-1) ?? null);

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
  private readonly refreshSubscriptions = new Set<Subscription>();

  /**
   * The live feed, shared by every monitoring view. It is closed, and the loaded state discarded, a moment
   * after the last view stops using it.
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
    share({ resetOnRefCountZero: () => timer(RELEASE_DELAY_MS).pipe(tap(() => this.release())) }),
  );

  /**
   * Keeps the live feed open while the caller lives. Every monitoring view connects, so one connection
   * serves them all.
   * @param destroyRef - The lifetime of the caller.
   */
  connectLiveUpdates(destroyRef: DestroyRef): void {
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
        next: (readings) => {
          this.historyFromSignal.set(from);
          // Live readings received while loading are kept.
          this.historySignal.update((current) => mergeReadings(readings, current ?? [], from));
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
    this.siteCountSignal.set(overview.siteCount);
    this.activeServiceRequestsSignal.set(overview.activeServiceRequests);
    this.policiesSignal.update((policies) => new Map([...policies, ...overview.policies]));
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
        this.resynchronize();
        break;
      case 'disconnected':
        this.liveStatusSignal.set('reconnecting');
        break;
      case 'reading':
        this.applyReading(update.reading);
        break;
      case 'alert-status':
        this.refreshAlert(update.change.alertId);
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
        history === null ? null : mergeReadings(history, [reading], from),
      );
    }
  }

  /** Reads again everything a view asked for, since updates sent while disconnected are lost. */
  private resynchronize(): void {
    if (this.overviewRequested()) {
      this.loadOverview();
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

  /** Discards every loaded value once no monitoring view uses them. */
  private release(): void {
    [
      this.overviewSubscription,
      this.selectedAlertSubscription,
      this.telemetrySubscription,
      this.actionSubscription,
      ...this.refreshSubscriptions,
    ].forEach((subscription) => subscription?.unsubscribe());
    this.refreshSubscriptions.clear();
    this.clearHistory();
    this.overviewRequested.set(false);
    this.equipmentSignal.set(null);
    this.siteCountSignal.set(0);
    this.activeServiceRequestsSignal.set(null);
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
 * Merges readings by batch identifier, keeping only those recorded from the start of the period, oldest
 * first.
 */
function mergeReadings(
  base: readonly SensorReading[],
  extra: readonly SensorReading[],
  from: Date,
): SensorReading[] {
  const byUid = new Map<string, SensorReading>();
  [...base, ...extra].forEach((reading) => {
    if (reading.recorded_at.getTime() >= from.getTime() && !byUid.has(reading.reading_uid)) {
      byUid.set(reading.reading_uid, reading);
    }
  });
  return [...byUid.values()].sort(
    (first, second) => first.recorded_at.getTime() - second.recorded_at.getTime(),
  );
}
