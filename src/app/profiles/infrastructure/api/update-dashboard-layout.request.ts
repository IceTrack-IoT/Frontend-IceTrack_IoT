/**
 * UpdateDashboardLayoutRequest is the request body of
 * `PUT /profiles/dashboard-configs/user/{userId}/layout`. It must place every card of the dashboard exactly
 * once, at the positions 1 to N.
 */
export interface UpdateDashboardLayoutRequest {
  cards: CardLayoutItemResource[];
}

/**
 * The requested position and visibility of one card.
 */
export interface CardLayoutItemResource {
  card_id: number;
  /** The 1-based position of the card. */
  order: number;
  is_visible: boolean;
}
