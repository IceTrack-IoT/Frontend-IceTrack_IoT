import { Routes } from '@angular/router';

const deviceList = () => import('./views/device-list/device-list').then((m) => m.DeviceList);
const pairDevice = () => import('./views/pair-device/pair-device').then((m) => m.PairDevice);

export const DeviceRoutes: Routes = [
  { path: '', loadComponent: deviceList },
  { path: 'pair', loadComponent: pairDevice },
];
