import { Injectable, signal } from '@angular/core';
import { Notification } from '@notifications/domain/model/notification.entity';

@Injectable({
  providedIn: 'root',
})
export class NotificationsStore {
  private notificationsSignal = signal<Notification[]>([]);
  readonly notifications = this.notificationsSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  constructor() {

  }

}
