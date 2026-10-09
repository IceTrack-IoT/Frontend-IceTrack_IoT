import { Routes } from '@angular/router';
import { authenticatedLandingRedirect } from '@iam/presentation/guards/authenticated-landing.redirect';
import { ownerOnlyGuard } from '@iam/presentation/guards/owner-only.guard';
import { createSignOutAction } from '@iam/presentation/sign-out-action';
import { HEADER_ACTIONS_OUTLET } from '@shared/presentation/components/private-layout/header-actions-outlet';
import { SIGN_OUT_ACTION } from '@shared/presentation/components/private-layout/sign-out-action';

const iamRoutes = () => import('@iam/presentation/iam.routes').then((m) => m.IamRoutes);
const privateLayout = () =>
  import('@shared/presentation/components/private-layout/private-layout').then(
    (m) => m.PrivateLayout,
  );
const notificationBell = () =>
  import('@notifications/presentation/components/notification-bell/notification-bell').then(
    (m) => m.NotificationBell,
  );
const monitoringRoutes = () =>
  import('@monitoring/presentation/monitoring.routes').then((m) => m.MonitoringRoutes);
const assetsRoutes = () => import('@assets/presentation/assets.routes').then((m) => m.AssetsRoutes);
const deviceRoutes = () => import('@device/presentation/device.routes').then((m) => m.DeviceRoutes);
const serviceRequestsRoutes = () =>
  import('@service/presentation/service-requests.routes').then((m) => m.ServiceRequestsRoutes);
const notificationsRoutes = () =>
  import('@notifications/presentation/notifications.routes').then((m) => m.NotificationsRoutes);
const reportingRoutes = () =>
  import('@reporting/presentation/reporting.routes').then((m) => m.ReportingRoutes);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: authenticatedLandingRedirect },
  {
    path: 'iam',
    loadChildren: iamRoutes,
  },
  {
    // Owner-only area: every owner feature route belongs inside this group, rendered in the owner shell.
    path: '',
    canMatch: [ownerOnlyGuard],
    loadComponent: privateLayout,
    providers: [{ provide: SIGN_OUT_ACTION, useFactory: createSignOutAction }],
    children: [
      { path: '', outlet: HEADER_ACTIONS_OUTLET, loadComponent: notificationBell },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@profiles/presentation/views/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'home',
        title: 'Home',
        loadComponent: () => import('@shared/presentation/views/home/home').then((m) => m.Home),
      },
      { path: 'monitoring', loadChildren: monitoringRoutes },
      { path: 'assets', loadChildren: assetsRoutes },
      { path: 'devices', loadChildren: deviceRoutes },
      { path: 'service-requests', loadChildren: serviceRequestsRoutes },
      { path: 'notifications', loadChildren: notificationsRoutes },
      { path: 'reports', loadChildren: reportingRoutes },
    ],
  },
  {
    path: '**',
    title: 'Page not found',
    loadComponent: () =>
      import('@shared/presentation/views/page-not-found/page-not-found').then(
        (m) => m.PageNotFound,
      ),
  },
];
