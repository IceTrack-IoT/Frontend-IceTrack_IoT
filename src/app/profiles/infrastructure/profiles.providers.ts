import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { TechnicianProfilePort } from '@service/application/ports/technician-profile.port';
import { DashboardConfigPort } from '@profiles/application/ports/dashboard-config.port';
import { ProfilesPort } from '@profiles/application/ports/profiles.port';
import { TechnicianProfileFacade } from '@profiles/application/facades/technician-profile.facade';
import { DashboardConfigApi } from '@profiles/infrastructure/api/dashboard-config-api';
import { ProfilesApi } from '@profiles/infrastructure/api/profiles-api';

/**
 * Binds the Profiles application ports to their infrastructure adapters, and the ports other bounded
 * contexts define for technician profile data to the Profiles facades that implement them.
 */
export function provideProfiles(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ProfilesPort, useExisting: ProfilesApi },
    { provide: DashboardConfigPort, useExisting: DashboardConfigApi },
    { provide: TechnicianProfilePort, useExisting: TechnicianProfileFacade },
  ]);
}
