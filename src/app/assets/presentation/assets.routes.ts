import { Routes } from '@angular/router';

const siteList = () => import('./views/site-list/site-list').then((m) => m.SiteList);
const equipmentList = () =>
  import('./views/equipment-list/equipment-list').then((m) => m.EquipmentList);
const equipmentDetail = () =>
  import('./views/equipment-detail/equipment-detail').then((m) => m.EquipmentDetail);

export const AssetsRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'sites' },
  { path: 'sites', loadComponent: siteList },
  { path: 'equipment', loadComponent: equipmentList },
  { path: 'equipment/:equipmentId', loadComponent: equipmentDetail },
];
