import { Routes } from '@angular/router';

const iamRoutes = () => import('@iam/presentation/iam.routes').then((m) => m.IamRoutes);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    title: 'Home',
    loadComponent: () => import('@shared/presentation/views/home/home').then((m) => m.Home),
  },
  {
    path: 'iam',
    loadChildren: iamRoutes,
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
