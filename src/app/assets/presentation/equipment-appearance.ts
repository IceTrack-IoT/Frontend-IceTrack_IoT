import {
  ConnectivityState,
  type EquipmentConnectivity,
} from '@assets/domain/value-objects/equipment-connectivity';
import { StatusEquipment } from '@assets/domain/value-objects/status-equipment';
import type { StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';

/** How each lifecycle state of an equipment item is shown, together with its translated label. */
export const STATUS_EQUIPMENT_APPEARANCE: Readonly<Record<StatusEquipment, StatusAppearance>> = {
  [StatusEquipment.ACTIVE]: { tone: 'success', icon: 'circle-check' },
  [StatusEquipment.MAINTENANCE]: { tone: 'info', icon: 'tools' },
  [StatusEquipment.REPAIR]: { tone: 'warning', icon: 'alert-triangle' },
  [StatusEquipment.DEACTIVATED]: { tone: 'neutral', icon: 'circle-x' },
};

/** How the connectivity of an equipment item is shown: its icon and the translation key of its label. */
export interface ConnectivityAppearance {
  readonly icon: 'wifi' | 'wifi-off' | 'clock' | 'circle-x';
  readonly labelKey: string;
}

const CONNECTIVITY_ICONS: Readonly<Record<ConnectivityState, ConnectivityAppearance['icon']>> = {
  [ConnectivityState.REPORTING]: 'wifi',
  [ConnectivityState.SILENT]: 'wifi-off',
  [ConnectivityState.NEVER_REPORTED]: 'clock',
  [ConnectivityState.NOT_MONITORED]: 'circle-x',
};

/**
 * Chooses how the connectivity state the server reports for an equipment item is shown. Being under
 * maintenance is a separate fact, shown next to it, never in its place.
 * @param connectivity - The connectivity evaluation.
 * @returns The icon and label key.
 */
export function connectivityAppearanceOf(
  connectivity: EquipmentConnectivity,
): ConnectivityAppearance {
  return {
    icon: CONNECTIVITY_ICONS[connectivity.state],
    labelKey: `assets.connectivity.${connectivity.state}`,
  };
}
