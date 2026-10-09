import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Alert } from '@monitoring/domain/model/alert.entity';
import { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import { AlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import { AlertStatus } from '@monitoring/domain/value-objects/alert-status';
import {
  type AlertDismissal,
  DismissAlertDialog,
} from '@monitoring/presentation/components/dismiss-alert-dialog/dismiss-alert-dialog';
import {
  createAlertsMock,
  createTriggerReadingMock,
  dismissAlertMock,
  MONITORED_EQUIPMENT,
} from '@monitoring/presentation/mocks/monitoring.mock';
import {
  ACKNOWLEDGED_APPEARANCE,
  ALERT_SEVERITY_APPEARANCE,
  ALERT_STATUS_APPEARANCE,
  ALERT_TYPE_ICONS,
} from '@monitoring/presentation/monitoring-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/**
 * Detail of an alert: what was detected, on which equipment, the reading that triggered it and its
 * lifecycle. Open alerts can be acknowledged, dismissed with a reason or, when critical, turned into a
 * corrective service request draft that the owner confirms in Service Request Management.
 */
@Component({
  imports: [
    RouterLink,
    TranslatePipe,
    DismissAlertDialog,
    Icon,
    StatePanel,
    StatusTag,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    TemperaturePipe,
  ],
  selector: 'app-alert-detail',
  styleUrl: './alert-detail.css',
  templateUrl: './alert-detail.html',
})
export class AlertDetail {
  protected readonly source = injectMockDataSource();
  protected readonly severityAppearance = ALERT_SEVERITY_APPEARANCE;
  protected readonly statusAppearance = ALERT_STATUS_APPEARANCE;
  protected readonly acknowledgedAppearance = ACKNOWLEDGED_APPEARANCE;
  protected readonly typeIcons = ALERT_TYPE_ICONS;

  protected readonly alert = signal<Alert | null>(null);
  protected readonly triggerReading = signal<SensorReading | null>(null);
  /**
   * When the owner acknowledged the alert. The class diagram has no acknowledged state, so the
   * acknowledgement is kept in the view and the alert stays open.
   * TODO: Delegate to the monitoring store once the backend contract defines acknowledgement.
   */
  protected readonly acknowledgedAt = signal<Date | null>(null);
  protected readonly dismissing = signal(false);
  /** The translation key of the outcome of the last action, announced to assistive technologies. */
  protected readonly announcement = signal<string | null>(null);

  protected readonly equipment = computed(() => {
    const alert = this.alert();
    return MONITORED_EQUIPMENT.find((item) => item.id === alert?.equipment_id) ?? null;
  });
  protected readonly open = computed(() => this.alert()?.status === AlertStatus.OPEN);
  protected readonly critical = computed(() => this.alert()?.severity === AlertSeverity.CRITICAL);

  private alertId = 0;

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.alertId = Number(params.get('alertId'));
        this.load();
      });
  }

  protected load(): void {
    this.acknowledgedAt.set(null);
    this.announcement.set(null);
    this.source.load((empty) => {
      const alert = empty ? undefined : createAlertsMock().find((item) => item.id === this.alertId);
      this.alert.set(alert ?? null);
      this.triggerReading.set(alert ? createTriggerReadingMock(alert) : null);
    });
  }

  protected acknowledge(): void {
    this.acknowledgedAt.set(new Date());
    this.announcement.set('monitoring.alerts.acknowledgedMessage');
  }

  /**
   * TODO: Delegate to the monitoring store (dismiss alert use case). The class diagram has no field for
   * the dismissal reason and notes, so they are collected but not kept yet.
   */
  protected dismiss(dismissal: AlertDismissal): void {
    const alert = this.alert();
    if (!alert || !dismissal.reason) {
      return;
    }
    this.source.mutate(() => {
      this.alert.set(dismissAlertMock(alert));
      this.dismissing.set(false);
      this.announcement.set('monitoring.alerts.dismissedMessage');
    });
  }
}
