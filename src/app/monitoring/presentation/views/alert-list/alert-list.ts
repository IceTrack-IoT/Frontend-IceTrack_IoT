import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
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
import { SHELL_LIFETIME } from '@shared/presentation/components/private-layout/shell-lifetime';
import { Pagination } from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';

/** The status choices of the list: the active alerts (OPEN and ACKNOWLEDGED), one status, or all. */
type StatusFilter = 'ACTIVE' | AlertStatus | 'ALL';

const ACTIVE_STATUSES: readonly AlertStatus[] = [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED];

function statusesOf(filter: StatusFilter): readonly AlertStatus[] {
  switch (filter) {
    case 'ACTIVE':
      return ACTIVE_STATUSES;
    case 'ALL':
      return [];
    default:
      return [filter];
  }
}

/**
 * Thermal and connectivity alerts of the owner, current and past, filtered by status, severity and type
 * and paged by the backend. The list opens on the active (OPEN and ACKNOWLEDGED) alerts; resolved and
 * dismissed ones form the history. The `equipmentId` query parameter shows the alerts of one equipment
 * item. Alerts can be acknowledged, resolved or dismissed with a reason, or turned into a corrective
 * service request draft.
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
    'ACTIVE',
    AlertStatus.OPEN,
    AlertStatus.ACKNOWLEDGED,
    AlertStatus.RESOLVED,
    AlertStatus.DISMISSED,
    'ALL',
  ];
  protected readonly severities = Object.values(AlertSeverity);
  protected readonly types = Object.values(AlertType);
  protected readonly equipmentFilter = this.equipmentIdParam();

  protected readonly filters = inject(NonNullableFormBuilder).group({
    severity: ['ALL' as AlertSeverity | 'ALL'],
    type: ['ALL' as AlertType | 'ALL'],
  });

  protected readonly statusFilter = signal<StatusFilter>('ACTIVE');
  /** The alert whose resolution or dismissal is being confirmed. */
  protected readonly confirmation = signal<{
    readonly alert: Alert;
    readonly action: 'resolve' | 'dismiss';
  } | null>(null);

  protected readonly status = computed<'loading' | 'error' | 'ready'>(() => {
    if (this.store.alertPage() !== null) {
      return 'ready';
    }
    return this.store.alertPageFailure() !== null ? 'error' : 'loading';
  });
  protected readonly alerts = computed(() => this.store.alertPage()?.items ?? []);
  /** The page shown, counted from 1. */
  protected readonly currentPage = computed(() => this.store.alertQuery().page + 1);
  protected readonly pageCount = computed(() =>
    Math.max(1, this.store.alertPage()?.totalPages ?? 1),
  );
  /** Whether a severity or type filter, or a status other than the active ones, narrows the list. */
  protected readonly anyFilter = computed(() => {
    const { severities, types } = this.store.alertQuery();
    return this.statusFilter() !== 'ACTIVE' || severities.length > 0 || types.length > 0;
  });

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
    this.store.connectLiveUpdates(inject(DestroyRef), inject(SHELL_LIFETIME));
    this.filters.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.loadPage());
    this.load();
    // A successful resolution or dismissal closes its dialog.
    effect(() => {
      if (this.store.alertActionState()?.status === 'succeeded') {
        this.confirmation.set(null);
      }
    });
  }

  /** Reads the equipment names and the first page of the list again. */
  protected load(): void {
    this.store.loadOverview();
    this.loadPage();
  }

  protected goToPage(page: number): void {
    this.store.loadAlertPage({ page: page - 1 });
  }

  protected equipmentName(alert: Alert): string | number {
    return this.store.equipmentById().get(alert.equipment_id)?.name ?? alert.equipment_id;
  }

  protected setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.loadPage();
  }

  protected clearFilters(): void {
    this.statusFilter.set('ACTIVE');
    // Resetting the form loads the first page of the active alerts.
    this.filters.reset();
  }

  /** Loads the first page matching the filters chosen. */
  private loadPage(): void {
    const { severity, type } = this.filters.getRawValue();
    this.store.loadAlertPage({
      statuses: statusesOf(this.statusFilter()),
      severities: severity === 'ALL' ? [] : [severity],
      types: type === 'ALL' ? [] : [type],
      equipmentId: this.equipmentFilter,
    });
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
