import { Device } from '@device/domain/model/device.entity';
import { DeviceStatus } from '@device/domain/value-objects/device-status';

/**
 * Mocked monitoring devices of the signed-in owner.
 * TODO: Replace with the device store once the device use cases are implemented.
 */

/**
 * An equipment item a device can be paired to. The device only stores the equipment identifier; the
 * name and site come from Assets Management.
 */
export interface PairableEquipment {
  readonly id: number;
  readonly name: string;
  readonly siteName: string;
}

const secondsAgo = (seconds: number): Date => new Date(Date.now() - seconds * 1000);

/** The equipment of the owner, referenced by the devices. */
export const DEVICE_EQUIPMENT: readonly PairableEquipment[] = [
  { id: 1, name: 'Walk-In Freezer #02', siteName: 'San Miguel Depot' },
  { id: 2, name: 'Walk-In Freezer #04', siteName: 'San Miguel Depot' },
  { id: 3, name: 'Cold Room #02', siteName: 'San Miguel Depot' },
  { id: 4, name: 'Display Chiller #05', siteName: 'Miraflores Market' },
  { id: 5, name: 'Ice Cream Freezer #09', siteName: 'Miraflores Market' },
  { id: 6, name: 'Cold Room #01', siteName: 'Callao Logistics Hub' },
  { id: 7, name: 'Cold Room #03', siteName: 'Callao Logistics Hub' },
  { id: 8, name: 'Blast Freezer #07', siteName: 'Surco Central Kitchen' },
  { id: 9, name: 'Reach-In Refrigerator #11', siteName: 'Surco Central Kitchen' },
  { id: 10, name: 'Prep Line Refrigerator #12', siteName: 'Surco Central Kitchen' },
];

const S3 = 'ESP32-S3 DevKitC-1';
const C3 = 'ESP32-C3 SuperMini';

/**
 * Creates the mocked devices of the owner. Each call returns new instances.
 * @returns The mocked devices.
 */
export function createDevicesMock(): Device[] {
  const device = (
    id: number,
    equipmentId: number | null,
    boardModel: string,
    firmware: string,
    apiKeyHash: string | null,
    status: DeviceStatus,
    lastRead: Date | null,
  ): Device =>
    new Device({
      id,
      equipment_id: equipmentId,
      board_model: boardModel,
      firmware_version: firmware,
      api_key_hash: apiKeyHash,
      status,
      last_read: lastRead,
    });

  return [
    device(
      4401,
      1,
      S3,
      '2.4.1',
      '9d41c7e2a05b3f68c1e4a7d2b9f03a9f',
      DeviceStatus.ONLINE,
      secondsAgo(6),
    ),
    device(
      4402,
      2,
      S3,
      '2.4.1',
      '1f8a3c6e9b2d4f70a5c8e1b3d6f97c21',
      DeviceStatus.ONLINE,
      secondsAgo(8),
    ),
    device(
      4403,
      3,
      C3,
      '2.4.1',
      '7c2e9a4f1b6d3e80c5a2f7b4e9d18e4b',
      DeviceStatus.ONLINE,
      secondsAgo(11),
    ),
    device(
      4404,
      4,
      S3,
      '2.3.0',
      'e5b1d8f2a7c4e9b03d6f1a8c5e2b7d06',
      DeviceStatus.ONLINE,
      secondsAgo(10),
    ),
    device(
      4405,
      5,
      C3,
      '2.4.1',
      '3a7f1c9e5b2d8f46a1c7e3b9d5f2a8c3',
      DeviceStatus.ONLINE,
      secondsAgo(12),
    ),
    device(
      4406,
      6,
      S3,
      '2.4.1',
      'b8d2f6a1c9e4b7d30f5a8c2e6b1d9f75',
      DeviceStatus.ONLINE,
      secondsAgo(5),
    ),
    device(
      4407,
      7,
      S3,
      '2.2.4',
      '6e3b9d1f4a8c2e75b0d6f3a9c1e8b4d2',
      DeviceStatus.OFFLINE,
      secondsAgo(47 * 60),
    ),
    device(
      4408,
      8,
      S3,
      '2.4.1',
      'd4a8c1e7b3f9d26e8a5c1f7b4d0e3a9b',
      DeviceStatus.ONLINE,
      secondsAgo(9),
    ),
    device(
      4409,
      9,
      C3,
      '2.4.1',
      '2c6f0a4e8b1d5f93c7a0e4b8d2f6a15e',
      DeviceStatus.ONLINE,
      secondsAgo(14),
    ),
    device(4410, null, C3, '2.4.1', null, DeviceStatus.UNPAIRED, null),
    device(4411, null, S3, '2.4.1', null, DeviceStatus.UNPAIRED, null),
    device(4412, null, C3, '2.3.0', null, DeviceStatus.UNPAIRED, secondsAgo(3 * 86_400)),
  ];
}

/**
 * Simulates the credential the backend issues when a device credential is rotated. The plain key exists
 * only in memory while it is shown to the owner.
 * TODO: Replace with the credential returned by the rotate credential use case.
 * @returns A mocked plain API key and its mocked hash.
 */
export function issueMockCredential(): { key: string; hash: string } {
  const hex = (bytes: number): string =>
    Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
  return { key: `itk_live_${hex(20)}`, hash: hex(16) };
}
