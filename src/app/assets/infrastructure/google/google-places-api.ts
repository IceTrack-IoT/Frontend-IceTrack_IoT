import { inject, Injectable } from '@angular/core';
import type { PlaceSuggestion } from '@assets/application/contracts/place-suggestion';
import {
  PLACE_QUERY_MIN_LENGTH,
  PlaceSuggestionsPort,
} from '@assets/application/ports/place-suggestions.port';
import { GoogleMapsLoader } from '@assets/infrastructure/google/google-maps-loader';

/** The library of the Maps JavaScript API that exposes Places API (New). */
const PLACES_LIBRARY = 'places';
/** The most suggestions returned for one query. */
const SUGGESTION_LIMIT = 5;
/** The country whose addresses are suggested; the backend still enforces the service area. */
const SUGGESTED_REGION = 'pe';

/*
 * Minimal Places API (New) members used by Assets Management, so the adapter does not depend on the
 * shape of the SDK. Reference: https://developers.google.com/maps/documentation/javascript/place-autocomplete-new
 */
interface PlaceText {
  readonly text?: unknown;
}

interface PlacePrediction {
  readonly placeId?: unknown;
  readonly text?: PlaceText | null;
  readonly mainText?: PlaceText | null;
  readonly secondaryText?: PlaceText | null;
}

interface AutocompleteSuggestion {
  readonly placePrediction?: PlacePrediction | null;
}

interface AutocompleteRequest {
  readonly input: string;
  readonly language: string;
  readonly includedRegionCodes: readonly string[];
  readonly sessionToken?: unknown;
}

interface AutocompleteSuggestionApi {
  fetchAutocompleteSuggestions(
    request: AutocompleteRequest,
  ): Promise<{ readonly suggestions?: readonly AutocompleteSuggestion[] }>;
}

interface PlacesLibrary {
  readonly AutocompleteSuggestion?: AutocompleteSuggestionApi;
  readonly AutocompleteSessionToken?: new () => unknown;
}

/** The Places API (New) members the adapter uses once the library is loaded. */
interface PlacesApi {
  readonly autocomplete: AutocompleteSuggestionApi;
  /** Creates a session token, or null when the library does not expose one. */
  readonly createSessionToken: (() => unknown) | null;
}

/**
 * GooglePlacesApi implements the place suggestions port with Places API (New), loaded on demand from the
 * same Maps JavaScript API script as the maps. A failure to load the library or to answer a query rejects
 * the promise; the caller treats it as having no suggestions.
 */
@Injectable({
  providedIn: 'root',
})
export class GooglePlacesApi implements PlaceSuggestionsPort {
  private readonly loader = inject(GoogleMapsLoader);

  private library: Promise<PlacesApi> | null = null;
  private session: unknown = null;

  async suggest(query: string, language: string): Promise<readonly PlaceSuggestion[]> {
    const input = query.trim();

    if (input.length < PLACE_QUERY_MIN_LENGTH) {
      return [];
    }

    const places = await this.places();
    const sessionToken = this.sessionToken(places);

    const response = await places.autocomplete.fetchAutocompleteSuggestions({
      input,
      language,
      includedRegionCodes: [SUGGESTED_REGION],
      ...(sessionToken === null ? {} : { sessionToken }),
    });

    return (response.suggestions ?? [])
      .slice(0, SUGGESTION_LIMIT)
      .map(toPlaceSuggestion)
      .filter((suggestion): suggestion is PlaceSuggestion => suggestion !== null);
  }

  completeSelection(): void {
    this.session = null;
  }

  /** Loads Places API (New) once; a failed load is forgotten, so the next query can try again. */
  private places(): Promise<PlacesApi> {
    this.library ??= this.loadPlaces().catch((error: unknown) => {
      this.library = null;
      throw error;
    });

    return this.library;
  }

  private async loadPlaces(): Promise<PlacesApi> {
    const loaded = await this.loader.importLibrary(PLACES_LIBRARY);
    const places = loaded as Partial<PlacesLibrary> | null;
    const autocomplete = places?.AutocompleteSuggestion;

    if (
      autocomplete === undefined ||
      typeof autocomplete.fetchAutocompleteSuggestions !== 'function'
    ) {
      throw new Error('Google Places is unavailable.');
    }

    const sessionToken = places?.AutocompleteSessionToken;

    return {
      autocomplete,
      createSessionToken: typeof sessionToken === 'function' ? () => new sessionToken() : null,
    };
  }

  private sessionToken(places: PlacesApi): unknown {
    if (places.createSessionToken === null) {
      return null;
    }

    this.session ??= places.createSessionToken();

    return this.session;
  }
}

function toPlaceSuggestion(suggestion: AutocompleteSuggestion): PlaceSuggestion | null {
  const prediction = suggestion.placePrediction;
  const placeId = prediction?.placeId;
  const address = readText(prediction?.text);

  if (typeof placeId !== 'string' || address === null) {
    return null;
  }

  return {
    placeId,
    mainText: readText(prediction?.mainText) ?? address,
    secondaryText: readText(prediction?.secondaryText) ?? '',
    address,
  };
}

function readText(text: PlaceText | null | undefined): string | null {
  return typeof text?.text === 'string' && text.text.trim() !== '' ? text.text : null;
}
