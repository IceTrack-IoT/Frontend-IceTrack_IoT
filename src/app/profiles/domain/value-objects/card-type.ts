
export enum CardType {
  MONITORED_EQUIPMENT = 'MONITORED_EQUIPMENT',
  OPEN_ALERTS = 'OPEN_ALERTS',
  ACTIVE_ORDERS = 'ACTIVE_ORDERS',
  EQUIPMENT_STATUS = 'EQUIPMENT_STATUS',
}

export function isCardType(value: unknown): value is CardType {
  return Object.values(CardType).some((cardType) => cardType === value);
}
