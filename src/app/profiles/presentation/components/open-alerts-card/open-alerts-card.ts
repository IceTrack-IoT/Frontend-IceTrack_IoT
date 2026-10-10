import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ALERT_SEVERITY_APPEARANCE } from '@profiles/presentation/dashboard-appearance';
import type { OpenAlertSummary } from '@profiles/presentation/mocks/dashboard.mock';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';

const LISTED_ALERTS = 3;

/** Dashboard card with the number of open alerts, how many are critical, and the latest ones. */
@Component({
  imports: [RouterLink, TranslatePipe, Icon, StatusTag, RelativeTimePipe],
  selector: 'app-open-alerts-card',
  styleUrl: '../../styles/dashboard-card.css',
  templateUrl: './open-alerts-card.html',
})
export class OpenAlertsCard {
  /** The open alerts, newest first. */
  readonly alerts = input.required<readonly OpenAlertSummary[]>();

  protected readonly severityAppearance = ALERT_SEVERITY_APPEARANCE;
  protected readonly criticalCount = computed(
    () => this.alerts().filter((alert) => alert.severity === 'CRITICAL').length,
  );
  protected readonly latest = computed(() => this.alerts().slice(0, LISTED_ALERTS));
}
