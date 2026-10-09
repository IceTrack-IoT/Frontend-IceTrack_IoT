import { CardType } from '@profiles/domain/value-objects/card-type';

/**
 * Represents a card displayed on a user's dashboard, including its type, order, and visibility status.
 */
export interface DashboardCard {
  card_id: number;
  card_type: CardType;
  order: number;
  is_visible: boolean;
}
