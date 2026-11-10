import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { NotificationsPort } from '@notifications/application/ports/notifications.port';
import { NotificationsApi } from '@notifications/infrastructure/api/notifications-api';
import { NotificationFeedPort } from '@notifications/application/ports/notification-feed.port';
import { NotificationFeedApi } from '@notifications/infrastructure/streaming/notification-feed-api';

/**
 * Binds the Notifications application ports to their infrastructure adapters. The equipment directory
 * port is bound by Assets Management, which owns the equipment, and the owner stream source port by
 * Monitoring and Alerting, which holds the owner event stream.
 */
export function provideNotifications(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: NotificationsPort, useExisting: NotificationsApi },
    { provide: NotificationFeedPort, useExisting: NotificationFeedApi },
  ]);
}
