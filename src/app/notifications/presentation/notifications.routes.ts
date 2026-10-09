import { Routes } from '@angular/router';

const notificationCenter = () =>
  import('./views/notification-center/notification-center').then((m) => m.NotificationCenter);

export const NotificationsRoutes: Routes = [{ path: '', loadComponent: notificationCenter }];
