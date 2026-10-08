import { Routes } from '@angular/router';
import { publicIamGuard } from './guards/public-iam.guard';
import { technicianRedirectGuard } from './guards/technician-redirect.guard';

const login = () => import('./views/login/login').then(m => m.Login);
const register = () => import('./views/register/register').then(m => m.Register);
const completeGoogleRegistration = () =>
  import('./views/complete-google-registration/complete-google-registration').then(
    m => m.CompleteGoogleRegistration,
  );
const technicianRedirect = () =>
  import('./views/technician-redirect/technician-redirect').then(m => m.TechnicianRedirect);
const unauthorized = () => import('./views/unauthorized/unauthorized').then(m => m.Unauthorized);

export const IamRoutes: Routes = [
  { path: 'login', canActivate: [publicIamGuard], loadComponent: login },
  { path: 'register', canActivate: [publicIamGuard], loadComponent: register },
  {
    path: 'complete-google-registration',
    canActivate: [publicIamGuard],
    loadComponent: completeGoogleRegistration,
  },
  {
    path: 'technician-redirect',
    canActivate: [technicianRedirectGuard],
    loadComponent: technicianRedirect,
  },
  { path: 'unauthorized', canActivate: [publicIamGuard], loadComponent: unauthorized },
];
