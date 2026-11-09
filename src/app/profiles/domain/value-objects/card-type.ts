/**
 * The kinds of card a dashboard holds. A dashboard has exactly one card of each type.
 */
export enum CardType {
  MONITORED_EQUIPMENT = 'MONITORED_EQUIPMENT',
  OPEN_ALERTS = 'OPEN_ALERTS',
  ACTIVE_ORDERS = 'ACTIVE_ORDERS',
  EQUIPMENT_STATUS = 'EQUIPMENT_STATUS',
}

/**
 * Checks whether a value is one of the confirmed card types.
 * @param value - The value to check.
 * @returns True when the value is a CardType.
 */
export function isCardType(value: unknown): value is CardType {
  return Object.values(CardType).some((cardType) => cardType === value);
}

/**
 * The default dashboard layout defined by the platform: every card visible, in this order.
 */
export const DEFAULT_CARD_ORDER: readonly CardType[] = [
  CardType.MONITORED_EQUIPMENT,
  CardType.OPEN_ALERTS,
  CardType.ACTIVE_ORDERS,
  CardType.EQUIPMENT_STATUS,
];
