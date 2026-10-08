import { Routes } from '@angular/router';
import { authenticatedLandingRedirect } from '@iam/presentation/guards/authenticated-landing.redirect';
import { ownerOnlyGuard } from '@iam/presentation/guards/owner-only.guard';

const iamRoutes = () => import('@iam/presentation/iam.routes').then((m) => m.IamRoutes);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: authenticatedLandingRedirect },
  {
    path: 'iam',
    loadChildren: iamRoutes,
  },
  {
    // Owner-only area: every owner feature route belongs inside this group.
    path: '',
    canMatch: [ownerOnlyGuard],
    children: [
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
