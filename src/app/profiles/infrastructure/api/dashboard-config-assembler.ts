import { DashboardConfig } from '@profiles/domain/model/dashboard-config.entity';
import { isCardType } from '@profiles/domain/value-objects/card-type';
import type { DashboardCard } from '@profiles/domain/value-objects/dashboard-card';
import {
  isTemperatureUnit,
  type TemperatureRange,
} from '@profiles/domain/value-objects/temperature-range';
import type { DashboardDefaults } from '@profiles/application/contracts/dashboard-config-change';
import type { CreateDashboardConfigRequest } from '@profiles/infrastructure/api/create-dashboard-config.request';
import type {
  DashboardCardResource,
  DashboardConfigResponse,
  TemperatureRangeResource,
} from '@profiles/infrastructure/api/dashboard-config.response';
import type { UpdateDashboardDefaultsRequest } from '@profiles/infrastructure/api/update-dashboard-defaults.request';
import type { UpdateDashboardLayoutRequest } from '@profiles/infrastructure/api/update-dashboard-layout.request';

/**
 * DashboardConfigAssembler converts dashboard configuration resources into entities, and layouts and
 * defaults into request bodies.
 */
export class DashboardConfigAssembler {
  /**
   * Converts a DashboardConfigResponse to a DashboardConfig entity. A card of a type this client does not
   * know yet is left out, so a new backend card type does not break the dashboard.
   * @param response - The DashboardConfigResponse to convert.
   * @returns The corresponding DashboardConfig entity.
   */
  toEntityFromResponse(response: DashboardConfigResponse): DashboardConfig {
    return new DashboardConfig({
      id: response.id,
      user_id: response.user_id,
      default_site_id: response.default_site_id,
      default_temperature_range: this.toTemperatureRange(response.default_temperature_range),
      cards: response.cards.flatMap((card) => this.toCards(card)),
    });
  }

  /**
   * Converts the defaults of a new dashboard to the body of the creation request.
   * @param userId - The caller's own platform account id.
   * @param defaults - The site and temperature range the dashboard opens on.
   * @returns The corresponding CreateDashboardConfigRequest.
   */
  toCreateRequest(userId: number, defaults: DashboardDefaults): CreateDashboardConfigRequest {
    return { user_id: userId, ...this.toDefaultsRequest(defaults) };
  }

  /**
   * Converts a layout to the body of the layout update request.
   * @param layout - Every card with its position and visibility.
   * @returns The corresponding UpdateDashboardLayoutRequest.
   */
  toLayoutRequest(layout: readonly DashboardCard[]): UpdateDashboardLayoutRequest {
    return {
      cards: layout.map((card) => ({
        card_id: card.card_id,
        order: card.order,
        is_visible: card.is_visible,
      })),
    };
  }

  /**
   * Converts dashboard defaults to the body of the defaults update request.
   * @param defaults - The site and temperature range the dashboard opens on.
   * @returns The corresponding UpdateDashboardDefaultsRequest.
   */
  toDefaultsRequest(defaults: DashboardDefaults): UpdateDashboardDefaultsRequest {
    const range = defaults.defaultTemperatureRange;
    return {
      default_site_id: defaults.defaultSiteId,
      default_temperature_range: {
        min: range.min,
        max: range.max,
        unit: range.unit,
        label: range.label,
      },
    };
  }

  private toCards(resource: DashboardCardResource): DashboardCard[] {
    const cardType = resource.card_type;
    if (!isCardType(cardType)) {
      return [];
    }
    return [
      {
        card_id: resource.card_id,
        card_type: cardType,
        order: resource.order,
        is_visible: resource.is_visible,
      },
    ];
  }

  private toTemperatureRange(resource: TemperatureRangeResource): TemperatureRange {
    if (!isTemperatureUnit(resource.unit)) {
      throw new Error(`Unsupported temperature unit: ${resource.unit}`);
    }
    return { min: resource.min, max: resource.max, unit: resource.unit, label: resource.label };
  }
}
