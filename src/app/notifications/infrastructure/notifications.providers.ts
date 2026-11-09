import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { NotificationsPort } from '@notifications/application/ports/notifications.port';
import { NotificationsApi } from '@notifications/infrastructure/api/notifications-api';

/**
 * Binds the Notifications application ports to their infrastructure adapters. The equipment directory
 * port is bound by Assets Management, which owns the equipment.
 */
export function provideNotifications(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: NotificationsPort, useExisting: NotificationsApi }]);
}
