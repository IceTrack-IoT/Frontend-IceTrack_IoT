import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { DashboardConfigPort } from '@profiles/application/ports/dashboard-config.port';
import { ProfilesPort } from '@profiles/application/ports/profiles.port';
import { DashboardConfigApi } from '@profiles/infrastructure/api/dashboard-config-api';
import { ProfilesApi } from '@profiles/infrastructure/api/profiles-api';

/**
 * Binds the Profiles application ports to their infrastructure adapters.
 */
export function provideProfiles(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ProfilesPort, useExisting: ProfilesApi },
    { provide: DashboardConfigPort, useExisting: DashboardConfigApi },
  ]);
}
