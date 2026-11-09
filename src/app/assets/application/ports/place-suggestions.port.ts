import type { PlaceSuggestion } from '@assets/application/contracts/place-suggestion';

/** The shortest query that asks the provider for suggestions, in characters. */
export const PLACE_QUERY_MIN_LENGTH = 3;

/**
 * PlaceSuggestionsPort is the outbound port used to suggest places while the owner types the address of
 * a site. A suggestion is only a typing aid: it is not a verified address, so the backend still verifies
 * the address that the owner saves.
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class PlaceSuggestionsPort {
  /**
   * Asks the provider for the places matching what the owner is typing.
   * @param query - The address text the owner typed.
   * @param language - The interface language of the suggestions, such as `en` or `es`.
   * @returns A promise of a few suggestions, or an empty list when the query is too short.
   */
  abstract suggest(query: string, language: string): Promise<readonly PlaceSuggestion[]>;

  /**
   * Ends the provider session that groups the queries of the address the owner selected. The next query
   * starts a new one.
   */
  abstract completeSelection(): void;
}
