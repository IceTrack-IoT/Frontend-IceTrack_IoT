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
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/**
 * Dashboard card with the current temperature of each equipment item, the most urgent first, with its
 * threshold, condition and the age of the reading. Each item opens the telemetry of the equipment.
 */
@Component({
  imports: [RouterLink, TranslatePipe, Icon, StatusTag, RelativeTimePipe, TemperaturePipe],
  selector: 'app-equipment-status-card',
  styleUrls: ['../../styles/dashboard-card.css', './equipment-status-card.css'],
  templateUrl: './equipment-status-card.html',
})
export class EquipmentStatusCard {
  readonly equipment = input.required<readonly EquipmentSnapshot[]>();

  protected readonly stateAppearance = TEMPERATURE_STATE_APPEARANCE;
  protected readonly sorted = computed(() =>
    [...this.equipment()].sort(
      (first, second) =>
        TEMPERATURE_STATES.indexOf(first.state) - TEMPERATURE_STATES.indexOf(second.state),
    ),
  );
}
