/**
 * A place the map provider suggests while the owner types the address of a site. Selecting one only fills
 * the address field: the backend still verifies the address before a site is registered or moved to it.
 */
export interface PlaceSuggestion {
  /** The provider identifier of the place. */
  readonly placeId: string;
  /** The primary line of the suggestion, such as the street and its number. */
  readonly mainText: string;
  /** The secondary line of the suggestion, such as the district and region; empty when absent. */
  readonly secondaryText: string;
  /** The full address text that belongs in the address field. */
  readonly address: string;
}
