import { Routes } from '@angular/router';

const monitoringDashboard = () =>
  import('./views/monitoring-dashboard/monitoring-dashboard').then((m) => m.MonitoringDashboard);
const alertList = () => import('./views/alert-list/alert-list').then((m) => m.AlertList);
const alertDetail = () => import('./views/alert-detail/alert-detail').then((m) => m.AlertDetail);
const equipmentTelemetry = () =>
  import('./views/equipment-telemetry/equipment-telemetry').then((m) => m.EquipmentTelemetry);

export const MonitoringRoutes: Routes = [
  { path: '', loadComponent: monitoringDashboard },
  { path: 'alerts', loadComponent: alertList },
  { path: 'alerts/:alertId', loadComponent: alertDetail },
  { path: 'equipment/:equipmentId/telemetry', loadComponent: equipmentTelemetry },
];
