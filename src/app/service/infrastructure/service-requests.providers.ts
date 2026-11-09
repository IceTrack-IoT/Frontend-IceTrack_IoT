import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ServiceRequestsPort } from '@service/application/ports/service-requests.port';
import { ServiceRequestsApi } from '@service/infrastructure/api/service-requests-api';
import { ActiveServiceRequestCountFacade } from '@service/application/facades/active-service-request-count.facade';
import { ActiveServiceRequestCountPort } from '@monitoring/application/ports/active-service-request-count.port';

/**
 * Binds the Service Request Management application ports to their infrastructure adapters, and the
 * active service request count port Monitoring and Alerting defines to the facade implementing it. The
 * technician data port is bound by Profiles, which owns that data.
 */
export function provideServiceRequests(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ServiceRequestsPort, useExisting: ServiceRequestsApi },
    { provide: ActiveServiceRequestCountPort, useExisting: ActiveServiceRequestCountFacade },
  ]);
}
