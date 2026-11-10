import { CardType } from '@profiles/domain/value-objects/card-type';
import type { IconName } from '@shared/presentation/components/icon/icon';

/** The icon of each dashboard card. */
export const CARD_TYPE_ICONS: Readonly<Record<CardType, IconName>> = {
  [CardType.MONITORED_EQUIPMENT]: 'fridge',
  [CardType.OPEN_ALERTS]: 'bell-ringing',
  [CardType.ACTIVE_ORDERS]: 'tools',
  [CardType.EQUIPMENT_STATUS]: 'temperature',
};

/**
 * The feature each dashboard card links to. The data of a card belongs to that feature's bounded context
 * (Assets, Monitoring or Service Requests), so the dashboard only navigates there.
 */
export const CARD_TYPE_ROUTES: Readonly<Record<CardType, string>> = {
  [CardType.MONITORED_EQUIPMENT]: '/assets/equipment',
  [CardType.OPEN_ALERTS]: '/monitoring/alerts',
  [CardType.ACTIVE_ORDERS]: '/service-requests',
  [CardType.EQUIPMENT_STATUS]: '/monitoring',
};
