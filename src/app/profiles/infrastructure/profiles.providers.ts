import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ProfilesPort } from '@profiles/application/ports/profiles.port';
import { ProfilesApi } from '@profiles/infrastructure/api/profiles-api';

/**
 * Binds the Profiles application ports to their infrastructure adapters.
 */
export function provideProfiles(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: ProfilesPort, useExisting: ProfilesApi }]);
}
