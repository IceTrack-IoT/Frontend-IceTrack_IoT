import { ServicePriority } from '@service/domain/value-objects/service-priority';
import { ServiceStatus } from '@service/domain/value-objects/service-status';
import type { StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';

/** How each service request status is shown, together with its translated label. */
export const SERVICE_STATUS_APPEARANCE: Readonly<Record<ServiceStatus, StatusAppearance>> = {
  [ServiceStatus.PENDING]: { tone: 'neutral', icon: 'clock' },
  [ServiceStatus.ACCEPTED]: { tone: 'info', icon: 'check' },
  [ServiceStatus.IN_PROGRESS]: { tone: 'info', icon: 'tools' },
  [ServiceStatus.COMPLETED]: { tone: 'success', icon: 'circle-check' },
  [ServiceStatus.CANCELED]: { tone: 'neutral', icon: 'x' },
};

/** How each service priority is shown, together with its translated label. */
export const SERVICE_PRIORITY_APPEARANCE: Readonly<Record<ServicePriority, StatusAppearance>> = {
  [ServicePriority.LOW]: { tone: 'neutral', icon: 'info-circle' },
  [ServicePriority.MEDIUM]: { tone: 'info', icon: 'chevron-up' },
  [ServicePriority.HIGH]: { tone: 'warning', icon: 'alert-triangle' },
  [ServicePriority.URGENT]: { tone: 'critical', icon: 'bolt' },
};
