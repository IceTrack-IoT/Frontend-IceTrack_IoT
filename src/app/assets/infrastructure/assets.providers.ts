import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { SiteDirectoryPort } from '@assets/application/ports/site-directory.port';
import { SiteDirectoryApi } from '@assets/infrastructure/api/site-directory-api';

/**
 * Binds the Assets application ports that other bounded contexts consume to their infrastructure adapters.
 */
export function provideAssets(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: SiteDirectoryPort, useExisting: SiteDirectoryApi }]);
}
