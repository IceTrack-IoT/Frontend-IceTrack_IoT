import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Alert } from '@monitoring/domain/model/alert.entity';
import { AlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import type { MonitoredEquipment } from '@monitoring/application/contracts/monitored-equipment';
import {
  ALERT_SEVERITY_APPEARANCE,
  ALERT_STATUS_APPEARANCE,
  ALERT_TYPE_ICONS,
} from '@monitoring/presentation/monitoring-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/**
 * Summary of an alert with its severity, status, equipment and excursion data. Active alerts offer the
 * lifecycle actions their status allows (acknowledge while OPEN; resolve or dismiss while OPEN or
 * ACKNOWLEDGED) and, when critical, a corrective service request draft.
 */
@Component({
  imports: [
    RouterLink,
    TranslatePipe,
    Icon,
    StatusTag,
    LocalizedDatePipe,
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
  /** Whether an alert action is in progress, so no other one can start. */
  readonly pending = input(false);
  readonly acknowledged = output<Alert>();
  readonly resolveRequested = output<Alert>();
  readonly dismissRequested = output<Alert>();

  protected readonly severityAppearance = ALERT_SEVERITY_APPEARANCE;
  protected readonly statusAppearance = ALERT_STATUS_APPEARANCE;
  protected readonly typeIcons = ALERT_TYPE_ICONS;

  protected readonly active = computed(() => this.alert().isActive());
  protected readonly critical = computed(() => this.alert().severity === AlertSeverity.CRITICAL);
  protected readonly titleId = computed(() => `alert-card-title-${this.alert().id}`);
}
