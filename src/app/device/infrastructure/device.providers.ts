import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { DevicesPort } from '@device/application/ports/devices.port';
import { DevicesApi } from '@device/infrastructure/api/devices-api';
import { DeviceStatusFeedPort } from '@device/application/ports/device-status-feed.port';
import { DeviceStatusFeedApi } from '@device/infrastructure/streaming/device-status-feed-api';

/**
 * Binds the Device Management application ports to their infrastructure adapters. The equipment directory
 * port is bound by Assets Management, which owns the equipment, and the owner stream source port by
 * Monitoring and Alerting, which holds the owner event stream; the device status feed parses its own
 * events here.
 */
export function provideDevices(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: DevicesPort, useExisting: DevicesApi },
    { provide: DeviceStatusFeedPort, useExisting: DeviceStatusFeedApi },
  ]);
}
