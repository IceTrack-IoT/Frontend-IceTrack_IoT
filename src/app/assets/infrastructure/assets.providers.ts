import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { EquipmentDirectoryPort } from '@assets/application/ports/equipment-directory.port';
import { EquipmentPort } from '@assets/application/ports/equipment.port';
import { PlaceSuggestionsPort } from '@assets/application/ports/place-suggestions.port';
import { SitesPort } from '@assets/application/ports/sites.port';
import { EquipmentApi } from '@assets/infrastructure/api/equipment-api';
import { EquipmentDirectoryApi } from '@assets/infrastructure/api/equipment-directory-api';
import { SitesApi } from '@assets/infrastructure/api/sites-api';
import { GooglePlacesApi } from '@assets/infrastructure/google/google-places-api';
import { MonitoredEquipmentFacade } from '@assets/application/facades/monitored-equipment.facade';
import { EquipmentDirectoryPort as MonitoringEquipmentDirectoryPort } from '@monitoring/application/ports/equipment-directory.port';
import { DeviceEquipmentFacade } from '@assets/application/facades/device-equipment.facade';
import { EquipmentDirectoryPort as DeviceEquipmentDirectoryPort } from '@device/application/ports/equipment-directory.port';
import { NotifiedEquipmentFacade } from '@assets/application/facades/notified-equipment.facade';
import { EquipmentDirectoryPort as NotificationsEquipmentDirectoryPort } from '@notifications/application/ports/equipment-directory.port';
import { ReportScopeFacade } from '@assets/application/facades/report-scope.facade';
import { ReportScopePort } from '@reporting/application/ports/report-scope.port';
import { ServiceEquipmentFacade } from '@assets/application/facades/service-equipment.facade';
import { ServiceEquipmentDirectoryPort } from '@service/application/ports/service-equipment-directory.port';
import { DashboardSiteFacade } from '@assets/application/facades/dashboard-site.facade';
import { DashboardSiteDirectoryPort } from '@profiles/application/ports/dashboard-site-directory.port';

/**
 * Binds the Assets application ports to their infrastructure adapters: the site and equipment ports used
 * by Assets Management itself (including its equipment directory), and the place suggestions the address
 * field asks while the owner types. The narrow ports other bounded contexts define to read Assets data
 * (the equipment directories of Monitoring and Alerting, Device Management and Notifications, the report
 * scope of Reporting, the service equipment directory of Service Request Management and the dashboard
 * site directory of Profiles) are bound to the Assets facades implementing them.
 */
export function provideAssets(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SitesPort, useExisting: SitesApi },
    { provide: PlaceSuggestionsPort, useExisting: GooglePlacesApi },
    { provide: EquipmentPort, useExisting: EquipmentApi },
    { provide: EquipmentDirectoryPort, useExisting: EquipmentDirectoryApi },
    { provide: MonitoringEquipmentDirectoryPort, useExisting: MonitoredEquipmentFacade },
    { provide: DeviceEquipmentDirectoryPort, useExisting: DeviceEquipmentFacade },
    { provide: NotificationsEquipmentDirectoryPort, useExisting: NotifiedEquipmentFacade },
    { provide: ReportScopePort, useExisting: ReportScopeFacade },
    { provide: ServiceEquipmentDirectoryPort, useExisting: ServiceEquipmentFacade },
    { provide: DashboardSiteDirectoryPort, useExisting: DashboardSiteFacade },
  ]);
}
