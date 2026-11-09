import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { EquipmentDirectoryPort } from '@assets/application/ports/equipment-directory.port';
import { SiteDirectoryPort } from '@assets/application/ports/site-directory.port';
import { EquipmentDirectoryApi } from '@assets/infrastructure/api/equipment-directory-api';
import { SiteDirectoryApi } from '@assets/infrastructure/api/site-directory-api';

/**
 * Binds the Assets application ports that other bounded contexts consume to their infrastructure adapters.
 */
export function provideAssets(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SiteDirectoryPort, useExisting: SiteDirectoryApi },
    { provide: EquipmentDirectoryPort, useExisting: EquipmentDirectoryApi },
  ]);
}
