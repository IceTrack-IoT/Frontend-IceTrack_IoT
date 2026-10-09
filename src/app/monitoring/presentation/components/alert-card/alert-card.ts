import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Alert } from '@monitoring/domain/model/alert.entity';
import { AlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import { AlertStatus } from '@monitoring/domain/value-objects/alert-status';
import type { MonitoredEquipment } from '@monitoring/presentation/mocks/monitoring.mock';
import {
  ACKNOWLEDGED_APPEARANCE,
  ALERT_SEVERITY_APPEARANCE,
  ALERT_STATUS_APPEARANCE,
  ALERT_TYPE_ICONS,
} from '@monitoring/presentation/monitoring-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/**
 * Summary of an alert with its severity, status, equipment and excursion data. Open alerts offer to
 * acknowledge or dismiss them and, when critical, to request a corrective service.
 */
@Component({
  imports: [
    RouterLink,
    TranslatePipe,
    Icon,
    StatusTag,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    RelativeTimePipe,
    TemperaturePipe,
  ],
  selector: 'app-alert-card',
  styleUrl: './alert-card.css',
  templateUrl: './alert-card.html',
})
export class AlertCard {
  readonly alert = input.required<Alert>();
  /** The alerted equipment, when known. */
  readonly equipment = input<MonitoredEquipment | null>(null);
  /** When the owner acknowledged the alert, or null. */
  readonly acknowledgedAt = input<Date | null>(null);
  readonly acknowledged = output<Alert>();
  readonly dismissRequested = output<Alert>();

  protected readonly severityAppearance = ALERT_SEVERITY_APPEARANCE;
  protected readonly statusAppearance = ALERT_STATUS_APPEARANCE;
  protected readonly acknowledgedAppearance = ACKNOWLEDGED_APPEARANCE;
  protected readonly typeIcons = ALERT_TYPE_ICONS;

  protected readonly open = computed(() => this.alert().status === AlertStatus.OPEN);
  protected readonly critical = computed(() => this.alert().severity === AlertSeverity.CRITICAL);
  protected readonly titleId = computed(() => `alert-card-title-${this.alert().id}`);
}
