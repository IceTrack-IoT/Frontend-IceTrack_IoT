import { BaseApiEndpoint } from '@shared/infrastructure/api/base-api-endpoint';
import { Notification } from '@notifications/domain/model/notification.entity';
import { NotificationResource, NotificationResponse } from '@notifications/infrastructure/api/notification.response';
import { NotificationAssembler } from '@notifications/infrastructure/api/notification-assembler';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

/**
 * NotificationApiEndpoint is responsible for handling API operations related to Notification entities.
 */
export class NotificationApiEndpoint extends BaseApiEndpoint<Notification, NotificationResource, NotificationResponse, NotificationAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderNotificationsEndpointPath}`,
      new NotificationAssembler());
  }
}
