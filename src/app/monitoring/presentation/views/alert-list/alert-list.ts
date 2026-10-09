import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { Alert } from '@monitoring/domain/model/alert.entity';
import { AlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import { AlertStatus } from '@monitoring/domain/value-objects/alert-status';
import { AlertType } from '@monitoring/domain/value-objects/alert-type';
import { AlertCard } from '@monitoring/presentation/components/alert-card/alert-card';
import {
  type AlertDismissal,
  DismissAlertDialog,
} from '@monitoring/presentation/components/dismiss-alert-dialog/dismiss-alert-dialog';
import {
  createAlertsMock,
  dismissAlertMock,
  MONITORED_EQUIPMENT,
} from '@monitoring/presentation/mocks/monitoring.mock';
import { Icon } from '@shared/presentation/components/icon/icon';
import {
  pageCountOf,
  pageOf,
  Pagination,
} from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';

const PAGE_SIZE = 5;

type StatusFilter = AlertStatus | 'ALL';

/**
 * Thermal and connectivity alerts of the owner, filtered by status, severity and type. The `equipmentId`
 * query parameter shows the alerts of one equipment item. Open alerts can be acknowledged, dismissed with
 * a reason, or turned into a corrective service request draft.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    AlertCard,
    DismissAlertDialog,
    Icon,
    Pagination,
    StatePanel,
  ],
  selector: 'app-alert-list',
  styleUrl: './alert-list.css',
  templateUrl: './alert-list.html',
})
export class AlertList {
  protected readonly source = injectMockDataSource();
  protected readonly statusFilters: StatusFilter[] = [
    AlertStatus.OPEN,
    AlertStatus.RESOLVED,
    AlertStatus.DISMISSED,
    'ALL',
  ];
  protected readonly openStatus = AlertStatus.OPEN;
  protected readonly severities = Object.values(AlertSeverity);
  protected readonly types = Object.values(AlertType);
  protected readonly equipmentById = new Map(MONITORED_EQUIPMENT.map((item) => [item.id, item]));
  protected readonly equipmentFilter = this.equipmentIdParam();

  protected readonly filters = inject(NonNullableFormBuilder).group({
    severity: ['ALL' as AlertSeverity | 'ALL'],
    type: ['ALL' as AlertType | 'ALL'],
  });
  private readonly filterValue = toSignal(
    this.filters.valueChanges.pipe(map(() => this.filters.getRawValue())),
    { initialValue: this.filters.getRawValue() },
  );

  private readonly alerts = signal<Alert[]>([]);
  /**
   * When the owner acknowledged each alert, by alert identifier. The class diagram has no acknowledged
   * state, so the acknowledgement is kept in the view and the alert stays open.
   * TODO: Delegate to the monitoring store once the backend contract defines acknowledgement.
   */
  protected readonly acknowledgements = signal<ReadonlyMap<number, Date>>(new Map());
  protected readonly statusFilter = signal<StatusFilter>(AlertStatus.OPEN);
  protected readonly page = signal(1);
  protected readonly dismissTarget = signal<Alert | null>(null);
  /** The translation key of the outcome of the last action, announced to assistive technologies. */
  protected readonly announcement = signal<string | null>(null);

  private readonly scoped = computed(() =>
    this.alerts().filter(
      (alert) => this.equipmentFilter === null || alert.equipment_id === this.equipmentFilter,
    ),
  );
  protected readonly statusCounts = computed(() => {
    const counts = new Map<StatusFilter, number>([['ALL', this.scoped().length]]);
    for (const alert of this.scoped()) {
      counts.set(alert.status, (counts.get(alert.status) ?? 0) + 1);
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
  protected readonly pageCount = computed(() => pageCountOf(this.filtered().length, PAGE_SIZE));
  protected readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  constructor() {
    this.filters.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.page.set(1));
    this.load();
  }

  protected load(): void {
    this.source.load((empty) => this.alerts.set(empty ? [] : createAlertsMock()));
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
    this.acknowledgements.update((acknowledgements) =>
      new Map(acknowledgements).set(alert.id, new Date()),
    );
    this.announcement.set('monitoring.alerts.acknowledgedMessage');
  }

  protected openDismiss(alert: Alert): void {
    this.announcement.set(null);
    this.dismissTarget.set(alert);
  }

  /**
   * TODO: Delegate to the monitoring store (dismiss alert use case). The class diagram has no field for
   * the dismissal reason and notes, so they are collected but not kept yet.
   */
  protected dismiss(dismissal: AlertDismissal): void {
    const target = this.dismissTarget();
    if (!target || !dismissal.reason) {
      return;
    }
    this.source.mutate(() => {
      const dismissed = dismissAlertMock(target);
      this.alerts.update((alerts) =>
        alerts.map((alert) => (alert.id === dismissed.id ? dismissed : alert)),
      );
      this.page.update((page) => Math.min(page, this.pageCount()));
      this.dismissTarget.set(null);
      this.announcement.set('monitoring.alerts.dismissedMessage');
    });
  }

  private equipmentIdParam(): number | null {
    const equipmentId = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('equipmentId'));
    return Number.isInteger(equipmentId) && equipmentId > 0 ? equipmentId : null;
  }
}
