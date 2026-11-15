import { TemperatureRange } from '@profiles/domain/value-objects/temperature-range';
import { DashboardCard } from '@profiles/domain/value-objects/dashboard-card';

/**
 * Represents the configuration of a user's dashboard, including default settings and the arrangement of dashboard cards.
 * This class encapsulates the properties and methods related to a user's dashboard configuration.
 *
 * A dashboard holds exactly one card of each type, at the positions 1 to N without gaps or repeats. An
 * account has at most one configuration; `user_id` is the platform account id, not a profile id.
 */
export class DashboardConfig {
  private _id: number;
  private _user_id: number;
  private _default_site_id: number;
  private _default_temperature_range: TemperatureRange;
  private _cards: DashboardCard[];
  private _version: number;

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
    version: number;
  }) {
    this._id = dashboardConfig.id;
    this._user_id = dashboardConfig.user_id;
    this._default_site_id = dashboardConfig.default_site_id;
    this._default_temperature_range = dashboardConfig.default_temperature_range;
    this._cards = dashboardConfig.cards;
    this._version = dashboardConfig.version;
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
  /** The concurrency version; it grows on every change of the configuration, cards included. */
  get version(): number {
    return this._version;
  }
  set version(version: number) {
    this._version = version;
  }

  /**
   * The cards the dashboard shows, in their configured order.
   * @returns The visible cards, sorted by their order.
   */
  visibleCards(): DashboardCard[] {
    return this._cards
      .filter((card) => card.is_visible)
      .sort((first, second) => first.order - second.order);
  }

  /**
   * Checks whether a layout places every card exactly where it is now and with the same visibility.
   * @param layout - The position and visibility of each card.
   * @returns True when applying the layout would change nothing.
   */
  hasLayout(layout: readonly DashboardCard[]): boolean {
    return (
      layout.length === this._cards.length &&
      layout.every((placement) =>
        this._cards.some(
          (card) =>
            card.card_id === placement.card_id &&
            card.order === placement.order &&
            card.is_visible === placement.is_visible,
        ),
      )
    );
  }

  /**
   * Checks whether the dashboard already opens on the given site and temperature range.
   * @param siteId - The identifier of the default site.
   * @param range - The default temperature range.
   * @returns True when applying the defaults would change nothing.
   */
  hasDefaults(siteId: number, range: TemperatureRange): boolean {
    const current = this._default_temperature_range;
    return (
      this._default_site_id === siteId &&
      current.min === range.min &&
      current.max === range.max &&
      current.unit === range.unit &&
      current.label === range.label
    );
  }
}
