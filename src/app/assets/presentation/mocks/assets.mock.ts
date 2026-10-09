import { Equipment } from '@assets/domain/model/equipment.entity';
import { Site } from '@assets/domain/model/site.entity';
import { EquipmentType } from '@assets/domain/value-objects/equipment-type';
import { StatusEquipment } from '@assets/domain/value-objects/status-equipment';

/**
 * Mocked sites and equipment of the signed-in owner.
 * TODO: Replace with the assets store once the assets use cases are implemented.
 */

/** The owner the mocked sites and equipment belong to. */
export const MOCK_OWNER_ID = 1;

const secondsAgo = (seconds: number): Date => new Date(Date.now() - seconds * 1000);

/**
 * Creates the mocked sites of the owner. Each call returns new instances.
 * @returns The mocked sites.
 */
export function createSitesMock(): Site[] {
  return [
    new Site({
      id: 1,
      owner_id: MOCK_OWNER_ID,
      name: 'San Miguel Depot',
      address: 'Av. La Marina 2355, San Miguel, Lima',
      contact_name: 'Rosa Quispe',
      phone: { value: '+51 987 654 321' },
      equipment_count: 3,
    }),
    new Site({
      id: 2,
      owner_id: MOCK_OWNER_ID,
      name: 'Miraflores Market',
      address: 'Av. José Larco 812, Miraflores, Lima',
      contact_name: 'Diego Salazar',
      phone: { value: '+51 956 112 870' },
      equipment_count: 2,
    }),
    new Site({
      id: 3,
      owner_id: MOCK_OWNER_ID,
      name: 'Callao Logistics Hub',
      address: 'Av. Argentina 4793, Callao',
      contact_name: 'Patricia Huamán',
      phone: { value: '+51 944 503 219' },
      equipment_count: 2,
    }),
    new Site({
      id: 4,
      owner_id: MOCK_OWNER_ID,
      name: 'Surco Central Kitchen',
      address: 'Av. Primavera 1450, Santiago de Surco, Lima',
      contact_name: 'Martín Rojas',
      phone: { value: '+51 912 778 045' },
      equipment_count: 3,
    }),
    new Site({
      id: 5,
      owner_id: MOCK_OWNER_ID,
      name: 'Chorrillos Seafood Plant',
      address: 'Av. Defensores del Morro 1240, Chorrillos, Lima',
      contact_name: 'Andrea Castillo',
      phone: { value: '+51 923 456 781' },
      equipment_count: 0,
    }),
  ];
}

/**
 * Creates the mocked equipment of the owner. Each call returns new instances.
 * @returns The mocked equipment.
 */
export function createEquipmentMock(): Equipment[] {
  return [
    new Equipment({
      id: 1,
      owner_id: MOCK_OWNER_ID,
      equipment_code_uid: '3f6c1a2e-8b4d-4e71-9a0f-1c2d3e4f5a01',
      name: 'Walk-In Freezer #02',
      equipment_type: EquipmentType.FREEZER,
      status: StatusEquipment.ACTIVE,
      site_id: 1,
      online: true,
      reminder_interval_days: 90,
      temperature_threshold: { min_celsius: -20, max_celsius: -16 },
      last_reading_at: secondsAgo(6),
      last_known_temperature: -12.1,
    }),
    new Equipment({
      id: 2,
      owner_id: MOCK_OWNER_ID,
      equipment_code_uid: '7a2d9e41-0c3b-4f8a-b6d5-2e1f0a9c8b02',
      name: 'Walk-In Freezer #04',
      equipment_type: EquipmentType.FREEZER,
      status: StatusEquipment.ACTIVE,
      site_id: 1,
      online: true,
      reminder_interval_days: 90,
      temperature_threshold: { min_celsius: -20, max_celsius: -16 },
      last_reading_at: secondsAgo(8),
      last_known_temperature: -18.4,
    }),
    new Equipment({
      id: 3,
      owner_id: MOCK_OWNER_ID,
      equipment_code_uid: 'c9e8f7a6-5b4c-4d3e-8f2a-1b0c9d8e7f03',
      name: 'Cold Room #02',
      equipment_type: EquipmentType.COLD_ROOM,
      status: StatusEquipment.ACTIVE,
      site_id: 1,
      online: true,
      reminder_interval_days: 120,
      temperature_threshold: { min_celsius: 0, max_celsius: 4 },
      last_reading_at: secondsAgo(11),
      last_known_temperature: 1.9,
    }),
    new Equipment({
      id: 4,
      owner_id: MOCK_OWNER_ID,
      equipment_code_uid: '1b2c3d4e-5f6a-4b7c-9d8e-0f1a2b3c4d04',
      name: 'Display Chiller #05',
      equipment_type: EquipmentType.REFRIGERATOR,
      status: StatusEquipment.ACTIVE,
      site_id: 2,
      online: true,
      reminder_interval_days: 60,
      temperature_threshold: { min_celsius: 1, max_celsius: 5 },
      last_reading_at: secondsAgo(10),
      last_known_temperature: 4.7,
    }),
    new Equipment({
      id: 5,
      owner_id: MOCK_OWNER_ID,
      equipment_code_uid: '8e7d6c5b-4a39-4281-b7c6-d5e4f3a2b105',
      name: 'Ice Cream Freezer #09',
      equipment_type: EquipmentType.FREEZER,
      status: StatusEquipment.MAINTENANCE,
      site_id: 2,
      online: true,
      reminder_interval_days: 60,
      temperature_threshold: { min_celsius: -25, max_celsius: -18 },
      last_reading_at: secondsAgo(12),
      last_known_temperature: -21.8,
    }),
    new Equipment({
      id: 6,
      owner_id: MOCK_OWNER_ID,
      equipment_code_uid: '4d5e6f7a-8b9c-4dae-bf01-23456789ab06',
      name: 'Cold Room #01',
      equipment_type: EquipmentType.COLD_ROOM,
      status: StatusEquipment.ACTIVE,
      site_id: 3,
      online: true,
      reminder_interval_days: 120,
      temperature_threshold: { min_celsius: 0, max_celsius: 4 },
      last_reading_at: secondsAgo(5),
      last_known_temperature: 2.4,
    }),
    new Equipment({
      id: 7,
      owner_id: MOCK_OWNER_ID,
      equipment_code_uid: 'f0e1d2c3-b4a5-4697-8879-6a5b4c3d2e07',
      name: 'Cold Room #03',
      equipment_type: EquipmentType.COLD_ROOM,
      status: StatusEquipment.REPAIR,
      site_id: 3,
      online: false,
      reminder_interval_days: 120,
      temperature_threshold: { min_celsius: 0, max_celsius: 4 },
      last_reading_at: secondsAgo(47 * 60),
      last_known_temperature: 3.3,
    }),
    new Equipment({
      id: 8,
      owner_id: MOCK_OWNER_ID,
      equipment_code_uid: '2a3b4c5d-6e7f-4a8b-9c0d-1e2f3a4b5c08',
      name: 'Blast Freezer #07',
      equipment_type: EquipmentType.FREEZER,
      status: StatusEquipment.ACTIVE,
      site_id: 4,
      online: true,
      reminder_interval_days: 45,
      temperature_threshold: { min_celsius: -35, max_celsius: -28 },
      last_reading_at: secondsAgo(9),
      last_known_temperature: -31.6,
    }),
    new Equipment({
      id: 9,
      owner_id: MOCK_OWNER_ID,
      equipment_code_uid: '6f5e4d3c-2b1a-4098-a7b6-c5d4e3f2a109',
      name: 'Reach-In Refrigerator #11',
      equipment_type: EquipmentType.REFRIGERATOR,
      status: StatusEquipment.ACTIVE,
      site_id: 4,
      online: true,
      reminder_interval_days: 60,
      temperature_threshold: { min_celsius: 1, max_celsius: 5 },
      last_reading_at: secondsAgo(14),
      last_known_temperature: 3.6,
    }),
    new Equipment({
      id: 10,
      owner_id: MOCK_OWNER_ID,
      equipment_code_uid: '9c8b7a69-5847-4362-9150-4f3e2d1c0b10',
      name: 'Prep Line Refrigerator #12',
      equipment_type: EquipmentType.REFRIGERATOR,
      status: StatusEquipment.DESACTIVATE,
      site_id: 4,
      online: false,
      reminder_interval_days: 60,
      temperature_threshold: { min_celsius: 1, max_celsius: 5 },
      last_reading_at: null,
      last_known_temperature: null,
    }),
  ];
}
