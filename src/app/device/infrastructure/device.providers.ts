import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { DevicesPort } from '@device/application/ports/devices.port';
import { DevicesApi } from '@device/infrastructure/api/devices-api';

/**
 * Binds the Device Management application ports to their infrastructure adapters. The equipment directory
 * port is bound by Assets Management, which owns the equipment.
 */
export function provideDevices(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: DevicesPort, useExisting: DevicesApi }]);
}
