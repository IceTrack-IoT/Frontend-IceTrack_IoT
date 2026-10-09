import { Speciality } from '@profiles/domain/value-objects/speciality';
import { Intervention } from '@service/domain/model/intervention.entity';
import { Review } from '@service/domain/model/review.entity';
import { ServiceRequest } from '@service/domain/model/service-request.entity';
import { InterventionStatus } from '@service/domain/value-objects/intervention-status';
import { ServicePriority } from '@service/domain/value-objects/service-priority';
import { ServiceStatus } from '@service/domain/value-objects/service-status';
import { ServiceType } from '@service/domain/value-objects/service-type';

/**
 * Mocked service requests, interventions and reviews of the signed-in owner.
 * TODO: Replace with the service requests store once the service request use cases are implemented.
 */

/** The signed-in owner, who is also the requester of the mocked requests. */
export const MOCK_OWNER_ID = 1;

/**
 * An equipment item a service can be requested for. Requests only store identifiers; names come from
 * Assets Management.
 */
export interface ServiceEquipment {
  readonly id: number;
  readonly name: string;
  readonly siteId: number;
  readonly siteName: string;
}

/**
 * The read-only technician data an owner needs to pick an assignee. Profiles and Preferences Management
 * owns the technician profile; the average rating comes from the service reviews.
 */
export interface TechnicianCandidate {
  readonly technicianProfileId: number;
  readonly fullName: string;
  readonly specialty: Speciality;
  readonly certificationNumber: string;
  /** The average review score, or null when the technician has no reviews yet. */
  readonly averageRating: number | null;
  readonly completedServices: number;
}

export const SERVICE_EQUIPMENT: readonly ServiceEquipment[] = [
  { id: 1, name: 'Walk-In Freezer #02', siteId: 1, siteName: 'San Miguel Depot' },
  { id: 2, name: 'Walk-In Freezer #04', siteId: 1, siteName: 'San Miguel Depot' },
  { id: 3, name: 'Cold Room #02', siteId: 1, siteName: 'San Miguel Depot' },
  { id: 4, name: 'Display Chiller #05', siteId: 2, siteName: 'Miraflores Market' },
  { id: 5, name: 'Ice Cream Freezer #09', siteId: 2, siteName: 'Miraflores Market' },
  { id: 6, name: 'Cold Room #01', siteId: 3, siteName: 'Callao Logistics Hub' },
  { id: 7, name: 'Cold Room #03', siteId: 3, siteName: 'Callao Logistics Hub' },
  { id: 8, name: 'Blast Freezer #07', siteId: 4, siteName: 'Surco Central Kitchen' },
  { id: 9, name: 'Reach-In Refrigerator #11', siteId: 4, siteName: 'Surco Central Kitchen' },
  { id: 10, name: 'Prep Line Refrigerator #12', siteId: 4, siteName: 'Surco Central Kitchen' },
];

export const TECHNICIAN_CANDIDATES: readonly TechnicianCandidate[] = [
  {
    technicianProfileId: 1,
    fullName: 'Carlos Mendoza',
    specialty: Speciality.REFRIGERATION,
    certificationNumber: 'HVAC-PER-8821',
    averageRating: 4.9,
    completedServices: 42,
  },
  {
    technicianProfileId: 2,
    fullName: 'Lucía Paredes',
    specialty: Speciality.REFRIGERATION,
    certificationNumber: 'RFG-PER-5530',
    averageRating: 4.7,
    completedServices: 31,
  },
  {
    technicianProfileId: 3,
    fullName: 'Ana Torres',
    specialty: Speciality.GENERAL,
    certificationNumber: 'GEN-PER-2204',
    averageRating: 4.5,
    completedServices: 18,
  },
  {
    technicianProfileId: 4,
    fullName: 'Javier Ruiz',
    specialty: Speciality.ELECTRICAL,
    certificationNumber: 'ELC-PER-9917',
    averageRating: null,
    completedServices: 0,
  },
];

const daysAgo = (days: number): Date => new Date(Date.now() - days * 86_400_000);

/**
 * Creates the mocked service requests of the owner, newest first. Each call returns new instances.
 * @returns The mocked service requests.
 */
export function createServiceRequestsMock(): ServiceRequest[] {
  const request = (
    id: number,
    equipmentId: number,
    technicianProfileId: number | null,
    type: ServiceType,
    priority: ServicePriority,
    status: ServiceStatus,
    description: string,
    completedDaysAgo: number | null = null,
    canceledDaysAgo: number | null = null,
  ): ServiceRequest =>
    new ServiceRequest({
      id,
      owner_id: MOCK_OWNER_ID,
      requester_id: MOCK_OWNER_ID,
      site_id: SERVICE_EQUIPMENT.find((item) => item.id === equipmentId)?.siteId ?? 0,
      equipment_id: equipmentId,
      technician_profile_id: technicianProfileId,
      type,
      priority,
      description,
      status,
      completed_at: completedDaysAgo === null ? null : daysAgo(completedDaysAgo),
      canceled_at: canceledDaysAgo === null ? null : daysAgo(canceledDaysAgo),
    });

  const { REPAIR, PREVENTIVE_MAINTENANCE, INSTALLATION, INSPECTION, OTHER } = ServiceType;
  const { LOW, MEDIUM, HIGH, URGENT } = ServicePriority;
  const { PENDING, ACCEPTED, REJECTED, IN_PROGRESS, CANCELED, COMPLETED } = ServiceStatus;
  return [
    request(
      9,
      1,
      null,
      REPAIR,
      URGENT,
      PENDING,
      'Walk-In Freezer #02 is above its maximum temperature (-12.1 °C). Suspected compressor or door seal failure.',
    ),
    request(
      8,
      4,
      1,
      REPAIR,
      HIGH,
      ACCEPTED,
      'The display chiller drifts above 4.5 °C during the afternoon peak. Check condenser airflow and the door heater.',
    ),
    request(
      7,
      7,
      2,
      REPAIR,
      MEDIUM,
      IN_PROGRESS,
      'The monitoring device went offline and the evaporator fan is noisy. Inspect the fan motor and the device power supply.',
    ),
    request(
      6,
      8,
      1,
      INSPECTION,
      HIGH,
      IN_PROGRESS,
      'Quarterly inspection of the defrost heater and door gaskets.',
    ),
    request(
      5,
      9,
      4,
      REPAIR,
      LOW,
      REJECTED,
      'Intermittent sensor readings on the reach-in refrigerator.',
    ),
    request(
      4,
      2,
      1,
      PREVENTIVE_MAINTENANCE,
      MEDIUM,
      COMPLETED,
      'Scheduled preventive maintenance: condenser cleaning and gasket check.',
      2,
    ),
    request(3, 6, 3, INSPECTION, LOW, COMPLETED, 'Inspection after a power outage at the hub.', 10),
    request(
      2,
      5,
      null,
      OTHER,
      LOW,
      CANCELED,
      'Relocate the ice cream freezer within the store.',
      null,
      14,
    ),
    request(
      1,
      1,
      1,
      INSTALLATION,
      MEDIUM,
      COMPLETED,
      'Install the temperature probe and the monitoring device.',
      300,
    ),
  ];
}

/**
 * Creates the mocked field interventions of the service requests. Each call returns new instances.
 * @returns The mocked interventions.
 */
export function createInterventionsMock(): Intervention[] {
  const intervention = (
    id: string,
    requestId: number,
    status: InterventionStatus,
    summary: string,
    startDaysAgo: number,
    endDaysAgo: number | null,
  ): Intervention =>
    new Intervention({
      id,
      service_request_id: requestId,
      intervention_status: status,
      summary,
      start_time: daysAgo(startDaysAgo),
      end_time: endDaysAgo === null ? null : daysAgo(endDaysAgo),
    });

  const { PENDING, COMPLETED } = InterventionStatus;
  return [
    intervention('ITV-2026-0007', 7, PENDING, '', 0.1, null),
    intervention('ITV-2026-0006', 6, PENDING, '', 1, null),
    intervention(
      'ITV-2026-0004',
      4,
      COMPLETED,
      'Condenser coil cleaned, left door gasket replaced and pull-down to -19.1 °C verified in 28 minutes.',
      2.1,
      2,
    ),
    intervention(
      'ITV-2026-0003',
      3,
      COMPLETED,
      'Compressor, fans and door switches inspected after the outage. No faults found.',
      10.05,
      10,
    ),
    intervention(
      'ITV-2025-0001',
      1,
      COMPLETED,
      'PT1000 probe and monitoring device installed; readings verified against a reference thermometer.',
      300.2,
      300,
    ),
  ];
}

/**
 * Creates the mocked reviews of completed service requests. Each call returns new instances.
 * @returns The mocked reviews.
 */
export function createReviewsMock(): Review[] {
  return [
    new Review({
      id: 31,
      service_request_id: 3,
      technician_profile_id: 3,
      rating: { communication: 5, efficacy: 4, performance: 4 },
      comment: 'Clear explanations and on time.',
    }),
    new Review({
      id: 11,
      service_request_id: 1,
      technician_profile_id: 1,
      rating: { communication: 5, efficacy: 5, performance: 5 },
      comment: 'Excellent installation work.',
    }),
  ];
}
