import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ServiceRequestsPort } from '@service/application/ports/service-requests.port';
import { ServiceRequestsApi } from '@service/infrastructure/api/service-requests-api';

/**
 * Binds the Service Request Management application ports to their infrastructure adapters. The
 * technician data port is bound by Profiles, which owns that data.
 */
export function provideServiceRequests(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: ServiceRequestsPort, useExisting: ServiceRequestsApi }]);
}
