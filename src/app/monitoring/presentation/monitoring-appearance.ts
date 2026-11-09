import { AlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import { AlertStatus } from '@monitoring/domain/value-objects/alert-status';
import { AlertType } from '@monitoring/domain/value-objects/alert-type';
import type { IconName } from '@shared/presentation/components/icon/icon';
import type { StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';

/** How each alert severity is shown, together with its translated label. */
export const ALERT_SEVERITY_APPEARANCE: Readonly<Record<AlertSeverity, StatusAppearance>> = {
  [AlertSeverity.INFO]: { tone: 'info', icon: 'info-circle' },
  [AlertSeverity.WARNING]: { tone: 'warning', icon: 'alert-triangle' },
  [AlertSeverity.CRITICAL]: { tone: 'critical', icon: 'circle-x' },
};

/** How each alert status is shown, together with its translated label. */
export const ALERT_STATUS_APPEARANCE: Readonly<Record<AlertStatus, StatusAppearance>> = {
  [AlertStatus.OPEN]: { tone: 'critical', icon: 'bell-ringing' },
  [AlertStatus.ACKNOWLEDGED]: { tone: 'info', icon: 'check' },
  [AlertStatus.RESOLVED]: { tone: 'success', icon: 'circle-check' },
  [AlertStatus.DISMISSED]: { tone: 'neutral', icon: 'bell-off' },
};

/** The icon of each alert type, so thermal and connectivity alerts are told apart. */
export const ALERT_TYPE_ICONS: Readonly<Record<AlertType, IconName>> = {
  [AlertType.TEMPERATURE_EXCURSION]: 'temperature',
  [AlertType.DEVICE_OFFLINE]: 'wifi-off',
};
