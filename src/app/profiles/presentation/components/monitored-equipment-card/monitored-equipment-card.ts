import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import {
  TEMPERATURE_STATE_APPEARANCE,
  TEMPERATURE_STATES,
} from '@profiles/presentation/dashboard-appearance';
import type { EquipmentSnapshot } from '@profiles/presentation/mocks/dashboard.mock';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';

/**
 * Dashboard card with the number of monitored equipment items and how many are within their threshold,
 * outside it, without recent readings or without telemetry. The proportion bar is decorative; the legend
 * states every count as text.
 */
@Component({
  imports: [RouterLink, TranslatePipe, Icon, StatusTag],
  selector: 'app-monitored-equipment-card',
  styleUrls: ['../../styles/dashboard-card.css', './monitored-equipment-card.css'],
  templateUrl: './monitored-equipment-card.html',
})
export class MonitoredEquipmentCard {
  readonly equipment = input.required<readonly EquipmentSnapshot[]>();
  /** The site the dashboard is scoped to, or null for every site. */
  readonly siteId = input<number | null>(null);

  protected readonly stateAppearance = TEMPERATURE_STATE_APPEARANCE;
  protected readonly counts = computed(() =>
    TEMPERATURE_STATES.map((state) => ({
      state,
      count: this.equipment().filter((item) => item.state === state).length,
    })),
  );
}
