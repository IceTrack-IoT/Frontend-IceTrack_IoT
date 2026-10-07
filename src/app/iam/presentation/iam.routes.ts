import { Routes } from '@angular/router';

const login = () => import('./views/login/login').then(m => m.Login);
const register = () => import('./views/register/register').then(m => m.Register);
const forgotPassword = () => import('./views/forgot-password/forgot-password').then(m => m.ForgotPassword);

export const IamRoutes: Routes = [
  { path: 'login', loadComponent: login },
  { path: 'register', loadComponent: register },
  { path: 'forgot-password', loadComponent: forgotPassword },
];
