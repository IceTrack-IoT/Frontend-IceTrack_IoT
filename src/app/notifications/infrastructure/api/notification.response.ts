import { BaseResource, BaseResponse } from '@shared/infrastructure/api/base-response';

/**
 * Interface representing the response structure for notifications.
 */
export interface NotificationResponse extends BaseResponse {
  notifications: NotificationResource[];
}

/**
 * Interface representing the structure of a notification resource.
 */
export interface NotificationResource extends BaseResource {
  id: number;
  equipment_id: number;
  device_id: number;
  source_alert_id: number;
  message: string;
  type: string;
  severity: string;
  is_read: boolean;
  read_at: Date | null;
  dismissed_at: Date | null;
}
