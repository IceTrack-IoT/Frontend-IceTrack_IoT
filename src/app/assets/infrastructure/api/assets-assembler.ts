import { Equipment } from '@assets/domain/model/equipment.entity';
import { Site } from '@assets/domain/model/site.entity';
import { isCoverageArea } from '@assets/domain/value-objects/coverage-area';
import {
  type EquipmentConnectivity,
  isConnectivityState,
} from '@assets/domain/value-objects/equipment-connectivity';
import { isEquipmentType } from '@assets/domain/value-objects/equipment-type';
import { isGeocodingFailureReason } from '@assets/domain/value-objects/geocoding-failure-reason';
import { isGeocodingStatus } from '@assets/domain/value-objects/geocoding-status';
import { isStatusEquipment } from '@assets/domain/value-objects/status-equipment';
import type { EquipmentPage } from '@assets/application/contracts/equipment-page';
import type { EquipmentDirectoryEntry } from '@assets/application/contracts/equipment-directory-entry';
import type {
  EquipmentChanges,
  NewEquipment,
} from '@assets/application/contracts/equipment-registration';
import type { NewSite, SiteDetails } from '@assets/application/contracts/site-registration';
import type { VerifiedAddress } from '@assets/application/contracts/verified-address';
import type {
  RegisterEquipmentRequest,
  RegisterSiteRequest,
  UpdateEquipmentRequest,
  UpdateSiteRequest,
} from '@assets/infrastructure/api/assets.requests';
import type {
  EquipmentConnectivityResource,
  EquipmentDirectoryEntryResource,
  EquipmentResource,
  PagedEquipmentResource,
} from '@assets/infrastructure/api/equipment.response';
import type {
  AddressValidationResource,
  SiteResource,
} from '@assets/infrastructure/api/site.response';

/**
 * AssetsAssembler converts the Assets Management resources into domain entities and application
 * contracts, and application input into request bodies.
 *
 * A resource carrying a value outside the documented enumerations or an unreadable instant is rejected
 * with an error instead of being shown wrongly.
 */
export class AssetsAssembler {
  /**
   * Converts a SiteResource to a Site entity.
   * @param resource - The resource to convert.
   * @returns The corresponding Site entity.
   */
  toSiteFromResource(resource: SiteResource): Site {
    if (!isGeocodingStatus(resource.geocoding_status)) {
      throw new Error('The site has an unknown geocoding status.');
    }
    const failureReason = resource.geocoding_failure_reason ?? null;
    if (failureReason !== null && !isGeocodingFailureReason(failureReason)) {
      throw new Error('The site has an unknown geocoding failure reason.');
    }
    const location = resource.location ?? null;
    return new Site({
      id: resource.id,
      owner_id: resource.owner_id,
      name: resource.name,
      address: resource.address,
      contact_name: resource.contact_name,
      phone: { value: resource.phone },
      equipment_count: resource.equipment_count,
      geocoding_status: resource.geocoding_status,
      location:
        location === null
          ? null
          : {
              latitude: location.latitude,
              longitude: location.longitude,
              place_id: location.place_id ?? null,
            },
      navigation_url: resource.navigation_url ?? null,
      geocoding_failure_reason: failureReason,
      version: resource.version,
    });
  }

  /**
   * Converts an EquipmentResource to an Equipment entity.
   * @param resource - The resource to convert.
   * @returns The corresponding Equipment entity.
   */
  toEquipmentFromResource(resource: EquipmentResource): Equipment {
    const { equipment_type, status } = resource;
    if (!isEquipmentType(equipment_type) || !isStatusEquipment(status)) {
      throw new Error('The equipment has an unknown type or status.');
    }
    return new Equipment({
      id: resource.id,
      equipment_code_uid: resource.uid,
      name: resource.name,
      equipment_type,
      status,
      site_id: resource.site_id,
      site_name: resource.site_name,
      connectivity: toConnectivity(resource.connectivity),
      reminder_interval_days: resource.reminder_interval_days,
      temperature_threshold: {
        min_celsius: resource.min_celsius,
        max_celsius: resource.max_celsius,
      },
      last_reading_at: toOptionalInstant(resource.last_reading_at),
      last_known_temperature: resource.last_known_temperature ?? null,
      config_version: resource.config_version,
      version: resource.version,
    });
  }

  /**
   * Converts an EquipmentDirectoryEntryResource to an EquipmentDirectoryEntry.
   * @param resource - The resource to convert.
   * @returns The corresponding directory entry.
   */
  toDirectoryEntryFromResource(resource: EquipmentDirectoryEntryResource): EquipmentDirectoryEntry {
    const { equipment_type, status } = resource;
    if (!isEquipmentType(equipment_type) || !isStatusEquipment(status)) {
      throw new Error('The directory entry has an unknown type or status.');
    }
    return {
      id: resource.id,
      uid: resource.uid,
      name: resource.name,
      type: equipment_type,
      status,
      siteId: resource.site_id,
      siteName: resource.site_name,
    };
  }

  /**
   * Converts a PagedEquipmentResource to an EquipmentPage.
   * @param resource - The resource to convert.
   * @returns The corresponding page.
   */
  toEquipmentPageFromResource(resource: PagedEquipmentResource): EquipmentPage {
    return {
      items: resource.content.map((item) => this.toEquipmentFromResource(item)),
      page: resource.page,
      size: resource.size,
      totalElements: resource.total_elements,
      totalPages: resource.total_pages,
    };
  }

  /**
   * Converts an AddressValidationResource to a VerifiedAddress.
   * @param resource - The resource to convert.
   * @returns The corresponding verified address.
   */
  toVerifiedAddressFromResource(resource: AddressValidationResource): VerifiedAddress {
    if (!isCoverageArea(resource.area)) {
      throw new Error('The verified address has an unknown coverage area.');
    }
    return {
      formattedAddress: resource.formatted_address,
      latitude: resource.latitude,
      longitude: resource.longitude,
      district: resource.district ?? null,
      area: resource.area,
      validationToken: resource.validation_token,
    };
  }

  /**
   * Converts the data of a new site to the registration request.
   * @param site - The data of the new site.
   * @returns The request body.
   */
  toRegisterSiteRequest(site: NewSite): RegisterSiteRequest {
    return { ...this.toUpdateSiteRequest(site), validation_token: site.validationToken };
  }

  /**
   * Converts the contact data of a site to the update request.
   * @param details - The contact data.
   * @returns The request body.
   */
  toUpdateSiteRequest(details: SiteDetails): UpdateSiteRequest {
    return { name: details.name, contact_name: details.contactName, phone: details.phone };
  }

  /**
   * Converts the data of a new equipment item to the registration request.
   * @param equipment - The data of the new equipment.
   * @returns The request body.
   */
  toRegisterEquipmentRequest(equipment: NewEquipment): RegisterEquipmentRequest {
    return {
      site_id: equipment.siteId,
      uid: equipment.uid,
      name: equipment.name,
      equipment_type: equipment.type,
      min_celsius: equipment.threshold.min_celsius,
      max_celsius: equipment.threshold.max_celsius,
      reminder_interval_days: equipment.reminderIntervalDays,
    };
  }

  /**
   * Converts the equipment changes to the update request.
   * @param changes - The new values.
   * @returns The request body.
   */
  toUpdateEquipmentRequest(changes: EquipmentChanges): UpdateEquipmentRequest {
    return {
      name: changes.name,
      equipment_type: changes.type,
      reminder_interval_days: changes.reminderIntervalDays,
    };
  }
}

function toConnectivity(resource: EquipmentConnectivityResource): EquipmentConnectivity {
  if (!isConnectivityState(resource.state)) {
    throw new Error('The equipment has an unknown connectivity state.');
  }
  return {
    state: resource.state,
    last_received_at: toOptionalInstant(resource.last_received_at),
    silent_after_seconds: resource.silent_after_seconds,
    silent_since: toOptionalInstant(resource.silent_since),
    under_maintenance: resource.under_maintenance,
    evaluated_at: toInstant(resource.evaluated_at),
  };
}

function toOptionalInstant(value: string | null | undefined): Date | null {
  return value === null || value === undefined ? null : toInstant(value);
}

function toInstant(value: string): Date {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) {
    throw new Error('The equipment resource has an unreadable instant.');
  }
  return instant;
}
