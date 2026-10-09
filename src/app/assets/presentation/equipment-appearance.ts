import { StatusEquipment } from '@assets/domain/value-objects/status-equipment';
import type { StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';

/** How each operational state of an equipment item is shown, together with its translated label. */
export const STATUS_EQUIPMENT_APPEARANCE: Readonly<Record<StatusEquipment, StatusAppearance>> = {
  [StatusEquipment.ACTIVE]: { tone: 'success', icon: 'circle-check' },
  [StatusEquipment.DESACTIVATE]: { tone: 'neutral', icon: 'circle-x' },
  [StatusEquipment.MAINTENANCE]: { tone: 'info', icon: 'tools' },
  [StatusEquipment.REPAIR]: { tone: 'warning', icon: 'alert-triangle' },
};
