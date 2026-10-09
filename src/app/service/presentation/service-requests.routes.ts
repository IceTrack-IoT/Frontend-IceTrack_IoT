import { Routes } from '@angular/router';

const serviceRequestList = () =>
  import('./views/service-request-list/service-request-list').then((m) => m.ServiceRequestList);
const createServiceRequest = () =>
  import('./views/create-service-request/create-service-request').then(
    (m) => m.CreateServiceRequest,
  );
const serviceRequestDetail = () =>
  import('./views/service-request-detail/service-request-detail').then(
    (m) => m.ServiceRequestDetail,
  );

export const ServiceRequestsRoutes: Routes = [
  { path: '', loadComponent: serviceRequestList },
  { path: 'new', loadComponent: createServiceRequest },
  { path: ':requestId', loadComponent: serviceRequestDetail },
];
