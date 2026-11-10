import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { CardType } from '@profiles/domain/value-objects/card-type';
import { CARD_TYPE_ICONS, CARD_TYPE_ROUTES } from '@profiles/presentation/dashboard-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';

/**
 * Frame of a configured dashboard card: its icon, title, description and a link to the feature that owns
 * its data. Profiles owns only the card layout; the data of each card belongs to another bounded context
 * and is not available on the dashboard yet, which the card states.
 */
@Component({
  imports: [RouterLink, TranslatePipe, Icon],
  selector: 'app-dashboard-card-shell',
  styleUrl: '../../styles/dashboard-card.css',
  templateUrl: './dashboard-card-shell.html',
})
export class DashboardCardShell {
  readonly cardType = input.required<CardType>();

  protected readonly icon = computed(() => CARD_TYPE_ICONS[this.cardType()]);
  protected readonly route = computed(() => CARD_TYPE_ROUTES[this.cardType()]);
  protected readonly titleId = computed(() => `dashboard-card-${this.cardType()}-title`);
}
