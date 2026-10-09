import { Routes } from '@angular/router';

const reportList = () => import('./views/report-list/report-list').then((m) => m.ReportList);
const generateReport = () =>
  import('./views/generate-report/generate-report').then((m) => m.GenerateReport);
const reportDetail = () =>
  import('./views/report-detail/report-detail').then((m) => m.ReportDetail);

export const ReportingRoutes: Routes = [
  { path: '', loadComponent: reportList },
  { path: 'new', loadComponent: generateReport },
  { path: ':reportId', loadComponent: reportDetail },
];
