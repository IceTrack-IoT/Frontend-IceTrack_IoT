import { DashboardConfig } from '@profiles/domain/model/dashboard-config.entity';
import { CardType } from '@profiles/domain/value-objects/card-type';

/**
 * Mocked dashboard configuration of the signed-in owner and the data its cards show. Profiles owns the
 * configuration; the card data comes from other contexts (sites from Assets Management, temperatures and
 * alerts from Monitoring and Alerting, orders from Service Request Management).
 * TODO: Replace with the ProfilesStore for the configuration and with the data those contexts expose.
 */

/** The user the mocked configuration belongs to. */
const MOCK_USER_ID = 1;

/** A site the dashboard can be scoped to. */
export interface DashboardSite {
  readonly id: number;
  readonly name: string;
}

/** The condition of the current temperature of an equipment item, as reported by Monitoring. */
export type TemperatureState = 'outside' | 'offline' | 'within' | 'none';

/** The current temperature of an equipment item. */
export interface EquipmentSnapshot {
  readonly id: number;
  readonly name: string;
  readonly siteId: number;
  /** The last reported temperature, or null when the equipment never reported telemetry. */
  readonly temperature: number | null;
  readonly minCelsius: number;
  readonly maxCelsius: number;
  /** When the last reading was recorded, or null when there is none. */
  readonly recordedAt: Date | null;
  readonly state: TemperatureState;
}

/** An open alert, as reported by Monitoring. */
export interface OpenAlertSummary {
  readonly id: number;
  readonly equipmentName: string;
  readonly siteId: number;
  readonly type: 'TEMPERATURE_EXCURSION' | 'DEVICE_OFFLINE';
  readonly severity: 'INFO' | 'WARNING' | 'CRITICAL';
  readonly openedAt: Date;
}

/** A service request that is not finished yet, as reported by Service Request Management. */
export interface ActiveOrderSummary {
  readonly id: number;
  readonly equipmentName: string;
  readonly siteId: number;
  readonly status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS';
  /** The assigned technician, or null while unassigned. */
  readonly technicianName: string | null;
}

const ago = (seconds: number): Date => new Date(Date.now() - seconds * 1000);

export const DASHBOARD_SITES: readonly DashboardSite[] = [
  { id: 1, name: 'San Miguel Depot' },
  { id: 2, name: 'Miraflores Market' },
  { id: 3, name: 'Callao Logistics Hub' },
  { id: 4, name: 'Surco Central Kitchen' },
  { id: 5, name: 'Chorrillos Seafood Plant' },
];

/** The cards of a new dashboard: every card, visible, in this order. */
export const DEFAULT_CARD_ORDER: readonly CardType[] = [
  CardType.MONITORED_EQUIPMENT,
  CardType.OPEN_ALERTS,
  CardType.ACTIVE_ORDERS,
  CardType.EQUIPMENT_STATUS,
];

/**
 * Creates the mocked dashboard configuration of the owner, with the active orders card hidden. Each call
 * returns a new instance.
 * @returns The mocked dashboard configuration.
 */
export function createDashboardConfigMock(): DashboardConfig {
  return new DashboardConfig({
    id: 1,
    user_id: MOCK_USER_ID,
    default_site_id: 1,
    default_temperature_range: { min: -20, max: -16, unit: '°C', label: 'Frozen goods' },
    cards: [
      { card_id: 11, card_type: CardType.MONITORED_EQUIPMENT, order: 1, is_visible: true },
      { card_id: 12, card_type: CardType.OPEN_ALERTS, order: 2, is_visible: true },
      { card_id: 13, card_type: CardType.ACTIVE_ORDERS, order: 3, is_visible: false },
      { card_id: 14, card_type: CardType.EQUIPMENT_STATUS, order: 4, is_visible: true },
    ],
  });
}

/**
 * Creates the current temperatures of the owner's equipment.
 * @returns The equipment snapshots.
 */
export function createEquipmentSnapshotsMock(): EquipmentSnapshot[] {
  const item = (
    id: number,
    name: string,
    siteId: number,
    temperature: number | null,
    [minCelsius, maxCelsius]: [number, number],
    secondsAgo: number | null,
    state: TemperatureState,
  ): EquipmentSnapshot => ({
    id,
    name,
    siteId,
    temperature,
    minCelsius,
    maxCelsius,
    recordedAt: secondsAgo === null ? null : ago(secondsAgo),
    state,
  });
  return [
    item(1, 'Walk-In Freezer #02', 1, -12.1, [-20, -16], 6, 'outside'),
    item(2, 'Walk-In Freezer #04', 1, -18.4, [-20, -16], 8, 'within'),
    item(3, 'Cold Room #02', 1, 1.9, [0, 4], 11, 'within'),
    item(4, 'Display Chiller #05', 2, 4.7, [1, 5], 10, 'within'),
    item(5, 'Ice Cream Freezer #09', 2, -21.8, [-25, -18], 12, 'within'),
    item(6, 'Cold Room #01', 3, 2.4, [0, 4], 5, 'within'),
    item(7, 'Cold Room #03', 3, 3.3, [0, 4], 47 * 60, 'offline'),
    item(8, 'Blast Freezer #07', 4, -31.6, [-35, -28], 9, 'within'),
    item(9, 'Reach-In Refrigerator #11', 4, 3.6, [1, 5], 14, 'within'),
    item(10, 'Prep Line Refrigerator #12', 4, null, [1, 5], null, 'none'),
  ];
}

/**
 * Creates the open alerts of the owner, newest first.
 * @returns The open alerts.
 */
export function createOpenAlertsMock(): OpenAlertSummary[] {
  return [
    {
      id: 1,
      equipmentName: 'Walk-In Freezer #02',
      siteId: 1,
      type: 'TEMPERATURE_EXCURSION',
      severity: 'CRITICAL',
      openedAt: ago(14 * 60),
    },
    {
      id: 2,
      equipmentName: 'Display Chiller #05',
      siteId: 2,
      type: 'TEMPERATURE_EXCURSION',
      severity: 'WARNING',
      openedAt: ago(29 * 60),
    },
    {
      id: 3,
      equipmentName: 'Cold Room #03',
      siteId: 3,
      type: 'DEVICE_OFFLINE',
      severity: 'CRITICAL',
      openedAt: ago(44 * 60),
    },
  ];
}

/**
 * Creates the service requests of the owner that are not finished yet, newest first.
 * @returns The active orders.
 */
export function createActiveOrdersMock(): ActiveOrderSummary[] {
  return [
    {
      id: 9,
      equipmentName: 'Walk-In Freezer #02',
      siteId: 1,
      status: 'PENDING',
      technicianName: null,
    },
    {
      id: 8,
      equipmentName: 'Display Chiller #05',
      siteId: 2,
      status: 'ACCEPTED',
      technicianName: 'Carlos Mendoza',
    },
    {
      id: 7,
      equipmentName: 'Cold Room #03',
      siteId: 3,
      status: 'IN_PROGRESS',
      technicianName: 'Lucía Paredes',
    },
    {
      id: 6,
      equipmentName: 'Blast Freezer #07',
      siteId: 4,
      status: 'IN_PROGRESS',
      technicianName: 'Carlos Mendoza',
    },
  ];
}
