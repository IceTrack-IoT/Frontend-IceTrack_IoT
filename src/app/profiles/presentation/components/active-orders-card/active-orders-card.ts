import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ORDER_STATUS_APPEARANCE } from '@profiles/presentation/dashboard-appearance';
import type { ActiveOrderSummary } from '@profiles/presentation/mocks/dashboard.mock';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';

const LISTED_ORDERS = 3;
const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] as const;

/**
 * Dashboard card with the number of service requests that are not finished yet, how many are in each
 * status, and the latest ones with their technician.
 */
@Component({
  imports: [RouterLink, TranslatePipe, Icon, StatusTag],
  selector: 'app-active-orders-card',
  styleUrls: ['../../styles/dashboard-card.css', './active-orders-card.css'],
  templateUrl: './active-orders-card.html',
})
export class ActiveOrdersCard {
  /** The active orders, newest first. */
  readonly orders = input.required<readonly ActiveOrderSummary[]>();

  protected readonly statusAppearance = ORDER_STATUS_APPEARANCE;
  protected readonly counts = computed(() =>
    ACTIVE_STATUSES.map((status) => ({
      status,
      count: this.orders().filter((order) => order.status === status).length,
    })),
  );
  protected readonly latest = computed(() => this.orders().slice(0, LISTED_ORDERS));
}
