import { TemperatureRange } from '@profiles/domain/value-objects/temperature-range';
import { DashboardCard } from '@profiles/domain/value-objects/dashboard-card';

/**
 * Represents the configuration of a user's dashboard, including default settings and the arrangement of dashboard cards.
 * This class encapsulates the properties and methods related to a user's dashboard configuration.
 */
export class DashboardConfig {
  private _id: number;
  private _user_id: number;
  private _default_site_id: number;
  private _default_temperature_range: TemperatureRange;
  private _cards: DashboardCard[];

  /**
   * Creates an instance of DashboardConfig with the specified configuration.
   * @param dashboardConfig - An object containing the dashboard configuration properties.
   */
  public constructor(dashboardConfig: {
    id: number;
    user_id: number;
    default_site_id: number;
    default_temperature_range: TemperatureRange;
    cards: DashboardCard[];
  }) {
    this._id = dashboardConfig.id;
    this._user_id = dashboardConfig.user_id;
    this._default_site_id = dashboardConfig.default_site_id;
    this._default_temperature_range = dashboardConfig.default_temperature_range;
    this._cards = dashboardConfig.cards;
  }

  get id(): number {
    return this._id;
  }
  set id(id: number) {
    this._id = id;
  }
  get user_id(): number {
    return this._user_id;
  }
  set user_id(user_id: number) {
    this._user_id = user_id;
  }
  get default_site_id(): number {
    return this._default_site_id;
  }
  set default_site_id(default_site_id: number) {
    this._default_site_id = default_site_id;
  }
  get default_temperature_range(): TemperatureRange {
    return this._default_temperature_range;
  }
  set default_temperature_range(default_temperature_range: TemperatureRange) {
    this._default_temperature_range = default_temperature_range;
  }
  get cards(): DashboardCard[] {
    return this._cards;
  }
  set cards(cards: DashboardCard[]) {
    this._cards = cards;
  }
}
