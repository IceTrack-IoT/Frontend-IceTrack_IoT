import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { EquipmentDirectoryPort } from '@assets/application/ports/equipment-directory.port';
import { EquipmentPort } from '@assets/application/ports/equipment.port';
import { SiteDirectoryPort } from '@assets/application/ports/site-directory.port';
import { SitesPort } from '@assets/application/ports/sites.port';
import { EquipmentApi } from '@assets/infrastructure/api/equipment-api';
import { EquipmentDirectoryApi } from '@assets/infrastructure/api/equipment-directory-api';
import { SiteDirectoryApi } from '@assets/infrastructure/api/site-directory-api';
import { SitesApi } from '@assets/infrastructure/api/sites-api';

/**
 * Binds the Assets application ports to their infrastructure adapters: the site and equipment ports used
 * by Assets Management itself, and the read-only directories that other bounded contexts consume.
 */
export function provideAssets(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SitesPort, useExisting: SitesApi },
    { provide: EquipmentPort, useExisting: EquipmentApi },
    { provide: SiteDirectoryPort, useExisting: SiteDirectoryApi },
    { provide: EquipmentDirectoryPort, useExisting: EquipmentDirectoryApi },
  ]);
}
