import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { Alert } from '@monitoring/domain/model/alert.entity';
import { AlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import { AlertStatus } from '@monitoring/domain/value-objects/alert-status';
import { AlertType } from '@monitoring/domain/value-objects/alert-type';
import { MonitoringStore } from '@monitoring/application/monitoring-store';
import type { AlertDismissal } from '@monitoring/application/contracts/alert-dismissal';
import { AlertCard } from '@monitoring/presentation/components/alert-card/alert-card';
import { DismissAlertDialog } from '@monitoring/presentation/components/dismiss-alert-dialog/dismiss-alert-dialog';
import { ResolveAlertDialog } from '@monitoring/presentation/components/resolve-alert-dialog/resolve-alert-dialog';
import {
  ALERT_ACTION_SUCCESS_KEYS,
  alertActionErrorKey,
} from '@monitoring/presentation/monitoring-feedback';
import { Icon } from '@shared/presentation/components/icon/icon';
import {
  pageCountOf,
  pageOf,
  Pagination,
} from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';

const PAGE_SIZE = 5;

type StatusFilter = AlertStatus.OPEN | AlertStatus.ACKNOWLEDGED | 'ALL';

/**
 * Active (OPEN and ACKNOWLEDGED) thermal and connectivity alerts of the owner, filtered by status,
 * severity and type. The backend lists only active alerts, so resolved and dismissed alerts leave this
 * list; each one stays reachable from its detail. The `equipmentId` query parameter shows the alerts of one
 * equipment item. Alerts can be acknowledged, resolved or dismissed with a reason, or turned into a
 * corrective service request draft.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    AlertCard,
    DismissAlertDialog,
    ResolveAlertDialog,
    Icon,
    Pagination,
    StatePanel,
  ],
  selector: 'app-alert-list',
  styleUrl: './alert-list.css',
  templateUrl: './alert-list.html',
})
export class AlertList {
  protected readonly store = inject(MonitoringStore);
  protected readonly statusFilters: StatusFilter[] = [
    'ALL',
    AlertStatus.OPEN,
    AlertStatus.ACKNOWLEDGED,
  ];
  protected readonly severities = Object.values(AlertSeverity);
  protected readonly types = Object.values(AlertType);
  protected readonly equipmentFilter = this.equipmentIdParam();

  protected readonly filters = inject(NonNullableFormBuilder).group({
    severity: ['ALL' as AlertSeverity | 'ALL'],
    type: ['ALL' as AlertType | 'ALL'],
  });
  private readonly filterValue = toSignal(
    this.filters.valueChanges.pipe(map(() => this.filters.getRawValue())),
    { initialValue: this.filters.getRawValue() },
  );

  protected readonly statusFilter = signal<StatusFilter>('ALL');
  protected readonly page = signal(1);
  /** The alert whose resolution or dismissal is being confirmed. */
  protected readonly confirmation = signal<{
    readonly alert: Alert;
    readonly action: 'resolve' | 'dismiss';
  } | null>(null);

  protected readonly status = computed<'loading' | 'error' | 'ready'>(() => {
    if (this.store.overviewLoaded()) {
      return 'ready';
    }
    return this.store.overviewFailure() !== null ? 'error' : 'loading';
  });
  private readonly scoped = computed(() =>
    this.store
      .activeAlerts()
      .filter(
        (alert) => this.equipmentFilter === null || alert.equipment_id === this.equipmentFilter,
      ),
  );
  protected readonly statusCounts = computed(() => {
    const counts = new Map<StatusFilter, number>([['ALL', this.scoped().length]]);
    for (const alert of this.scoped()) {
      if (alert.status === AlertStatus.OPEN || alert.status === AlertStatus.ACKNOWLEDGED) {
        counts.set(alert.status, (counts.get(alert.status) ?? 0) + 1);
      }
    }
    return counts;
  });
  protected readonly filtered = computed(() => {
    const status = this.statusFilter();
    const { severity, type } = this.filterValue();
    return this.scoped().filter(
      (alert) =>
        (status === 'ALL' || alert.status === status) &&
        (severity === 'ALL' || alert.severity === severity) &&
        (type === 'ALL' || alert.type === type),
    );
  });
  protected readonly anyFilter = computed(() => {
    const { severity, type } = this.filterValue();
    return this.statusFilter() !== 'ALL' || severity !== 'ALL' || type !== 'ALL';
  });
  protected readonly pageCount = computed(() => pageCountOf(this.filtered().length, PAGE_SIZE));
  /** The page shown, which moves back when closed alerts leave the last page. */
  protected readonly currentPage = computed(() => Math.min(this.page(), this.pageCount()));
  protected readonly visible = computed(() =>
    pageOf(this.filtered(), this.currentPage(), PAGE_SIZE),
  );

  /** The confirmation announced after the last successful action. */
  protected readonly announcement = computed(() => {
    const state = this.store.alertActionState();
    return state?.status === 'succeeded' ? ALERT_ACTION_SUCCESS_KEYS[state.action] : null;
  });
  /** Why the last action failed, outside a confirmation dialog. */
  protected readonly actionErrorKey = computed(() => {
    const state = this.store.alertActionState();
    return state?.status === 'failed' && this.confirmation() === null
      ? alertActionErrorKey(state.failure)
      : null;
  });
  /** Why the action being confirmed failed. */
  protected readonly dialogErrorKey = computed(() => {
    const state = this.store.alertActionState();
    return state?.status === 'failed' && this.confirmation() !== null
      ? alertActionErrorKey(state.failure)
      : null;
  });

  constructor() {
    this.store.clearAlertAction();
    this.store.connectLiveUpdates(inject(DestroyRef));
    this.filters.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.page.set(1));
    this.load();
    // A successful resolution or dismissal closes its dialog.
    effect(() => {
      if (this.store.alertActionState()?.status === 'succeeded') {
        this.confirmation.set(null);
      }
    });
  }

  protected load(): void {
    this.store.loadOverview();
  }

  protected equipmentName(alert: Alert): string | number {
    return this.store.equipmentById().get(alert.equipment_id)?.name ?? alert.equipment_id;
  }

  protected setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.filters.reset();
    this.setStatusFilter('ALL');
  }

  protected acknowledge(alert: Alert): void {
    this.store.acknowledgeAlert(alert);
  }

  protected confirm(alert: Alert, action: 'resolve' | 'dismiss'): void {
    this.store.clearAlertAction();
    this.confirmation.set({ alert, action });
  }

  protected closeConfirmation(): void {
    this.store.clearAlertAction();
    this.confirmation.set(null);
  }

  protected resolve(): void {
    const target = this.confirmation();
    if (target !== null) {
      this.store.resolveAlert(target.alert);
    }
  }

  protected dismiss(dismissal: AlertDismissal): void {
    const target = this.confirmation();
    if (target !== null) {
      this.store.dismissAlert(target.alert, dismissal);
    }
  }

  private equipmentIdParam(): number | null {
    const equipmentId = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('equipmentId'));
    return Number.isInteger(equipmentId) && equipmentId > 0 ? equipmentId : null;
  }
}
