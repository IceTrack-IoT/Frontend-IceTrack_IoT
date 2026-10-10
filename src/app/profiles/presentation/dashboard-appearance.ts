import { CardType } from '@profiles/domain/value-objects/card-type';
import type { TemperatureState } from '@profiles/presentation/mocks/dashboard.mock';
import type { IconName } from '@shared/presentation/components/icon/icon';
import type { StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';

/** The icon of each dashboard card. */
export const CARD_TYPE_ICONS: Readonly<Record<CardType, IconName>> = {
  [CardType.MONITORED_EQUIPMENT]: 'fridge',
  [CardType.OPEN_ALERTS]: 'bell-ringing',
  [CardType.ACTIVE_ORDERS]: 'tools',
  [CardType.EQUIPMENT_STATUS]: 'temperature',
};

/** How each temperature condition is shown, together with its translated label. */
export const TEMPERATURE_STATE_APPEARANCE: Readonly<Record<TemperatureState, StatusAppearance>> = {
  outside: { tone: 'critical', icon: 'alert-triangle' },
  offline: { tone: 'warning', icon: 'wifi-off' },
  within: { tone: 'success', icon: 'circle-check' },
  none: { tone: 'neutral', icon: 'info-circle' },
};

/** The temperature conditions, most urgent first. */
export const TEMPERATURE_STATES: readonly TemperatureState[] = [
  'outside',
  'offline',
  'within',
  'none',
];

/** How each status of an active order is shown, together with its translated label. */
export const ORDER_STATUS_APPEARANCE: Readonly<
  Record<'PENDING' | 'ACCEPTED' | 'IN_PROGRESS', StatusAppearance>
> = {
  PENDING: { tone: 'neutral', icon: 'clock' },
  ACCEPTED: { tone: 'info', icon: 'check' },
  IN_PROGRESS: { tone: 'info', icon: 'tools' },
};

/** How each alert severity is shown, together with its translated label. */
export const ALERT_SEVERITY_APPEARANCE: Readonly<
  Record<'INFO' | 'WARNING' | 'CRITICAL', StatusAppearance>
> = {
  INFO: { tone: 'info', icon: 'info-circle' },
  WARNING: { tone: 'warning', icon: 'alert-triangle' },
  CRITICAL: { tone: 'critical', icon: 'circle-x' },
};
