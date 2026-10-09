import { Injectable } from '@angular/core';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import { NotificationApiEndpoint } from '@notifications/infrastructure/api/notification-api-endpoint';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notification } from '@notifications/domain/model/notification.entity';

/**
 * NotificationsApi is a service that provides methods for interacting with the API endpoints.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationsApi extends BaseApi {
  private readonly notificationsEndpoint: NotificationApiEndpoint;

  /**
   * Creates an instance of NotificationsApi.
   * @param http - The HttpClient used for making HTTP requests.
   */
  constructor(http: HttpClient) {
    super();
    this.notificationsEndpoint = new NotificationApiEndpoint(http);
  }

  /**
   * Fetches a notification by its ID from the API.
   * @param id - The ID of the Notification entity to be fetched.
   * @returns An Observable that emits the Notification entity.
   */
  getNotification(id: number): Observable<Notification> {
    return this.notificationsEndpoint.getById(id);
  }

  /**
   * Fetches all notifications from the API.
   * @returns An Observable that emits an array of Notification entities.
   */
  getNotifications(): Observable<Notification[]> {
    return this.notificationsEndpoint.getAll();
  }

  /**
   * Creates a new notification by sending a POST request to the API.
   * @param notification - The Notification entity to be created.
   * @returns An Observable that emits the created Notification entity.
   */
  createNotification(notification: Notification): Observable<Notification> {
    return this.notificationsEndpoint.create(notification);
  }

  /**
   * Updates an existing notification by sending a PUT request to the API.
   * @param notification - The Notification entity to be updated.
   * @returns An Observable that emits the updated Notification entity.
   */
  updateNotification(notification: Notification): Observable<Notification> {
    return this.notificationsEndpoint.update(notification, notification.id);
  }

  /**
   * Deletes a notification by sending a DELETE request to the API.
   * @param id - The ID of the Notification entity to be deleted.
   * @returns An Observable that emits void upon successful deletion.
   */
  deleteNotification(id: number): Observable<void> {
    return this.notificationsEndpoint.delete(id);
  }
}
