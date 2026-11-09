# Google Maps Platform (Geocoding) - site address verification

Sources: `assets/interfaces/rest/SiteController`, `assets/application/internal/commandservices/AddressValidationCommandServiceImpl`, `SiteCommandServiceImpl`, `assets/application/internal/outboundservices/geocoding/GeocodingPort`, `assets/infrastructure/geocoding/adapters/GoogleMapsGeocodingAdapter`, `assets/infrastructure/addressvalidation/*`, `assets/domain/model/policies/*`.

Only the **Geocoding API** is used, server-side. The frontend never calls Google for address verification and the Maps API key never leaves the server. The only Google Maps artifact the frontend receives is a plain **navigation URL** (`navigation_url`) it can open in a map app.

## Two different calls

| Call | Made by | Goes to | Purpose |
|---|---|---|---|
| `POST /api/v1/assets/sites/validate-address` | Web frontend (owner) | IceTrack | Ask the backend to verify an address; nothing is saved |
| `GET https://maps.googleapis.com/maps/api/geocode/json?address=...&key=...` (or `place_id=...`) | Spring Boot (`GoogleMapsGeocodingAdapter`) | Google | Geocode the text; connect timeout 2 s, read timeout 3 s, **single attempt, no retry** |

## Flow

1. The owner types an address. The web app sends `POST /api/v1/assets/sites/validate-address` with `ValidateAddressResource`:
   ```json
   { "address": "Av. Primavera 123, Santiago de Surco", "place_id": null }
   ```
   `address` is required (1 to 255 chars). `place_id` is optional (max 256); when present the backend geocodes by `place_id` instead of by text (use it to confirm one of Google's suggestions).
2. The backend checks the caller has an owner profile (else `403 ACCESS_DENIED`) and a limit of **20 validations per rolling minute per user** (in memory; `429 TOO_MANY_REQUESTS`, header `Retry-After: 60`).
3. It calls Google and normalizes the answer:
   - exactly one match, not a partial match, with coordinates: `RESOLVED`;
   - zero results, several results (ambiguous), a partial match, or a match without usable coordinates: not verified, with up to 5 candidate addresses;
   - Google `OVER_QUERY_LIMIT`/`UNKNOWN_ERROR`, HTTP 5xx or 429, timeout, unreachable, unreadable response: transient failure; any other Google status (for example `REQUEST_DENIED`): permanent failure. Both map to `503 GEOCODING_UNAVAILABLE` with `Retry-After: 30`.
4. **Coverage check** (`CoveragePolicy`): the point must fall inside the bounding box of Metropolitan Lima (lat -12.65..-11.65, lng -77.25..-76.65) or Callao (lat -12.07..-11.77, lng -77.20..-77.05; checked first). Outside both: `422 ADDRESS_OUT_OF_COVERAGE`.
5. On success the backend returns `200 AddressValidationResource`:
   ```json
   {
     "formatted_address": "Av. Primavera 123, Santiago de Surco, Lima, Peru",
     "latitude": -12.0931, "longitude": -77.0465,
     "place_id": "ChIJ8e8c9yLIBZERt0P0wP0xV5A",
     "district": "Santiago de Surco",
     "area": "LIMA_METROPOLITANA",
     "validation_token": "eyJhbGciOiJIUzI1NiJ9..."
   }
   ```
   `place_id` and `district` may be `null`. `area` is `LIMA_METROPOLITANA` or `CALLAO`. `district` is the first of `sublocality_level_1`, `locality`, `administrative_area_level_3` found in Google's address components.
6. The owner reviews the normalized address on the map and may drag a pin.
7. The frontend registers the site with `POST /api/v1/assets/sites` (`RegisterSiteResource`: `name`, `contact_name`, `phone`, `validation_token`, optional `pin {latitude, longitude}`), or moves an existing site with `PUT /api/v1/assets/sites/{siteId}/address` (`UpdateSiteAddressResource`: `validation_token`, optional `pin`). The site is saved as `RESOLVED` and the maps service is **not** queried again.

## Validation token

- A JWT (HS256) signed with `ADDRESS_VALIDATION_SECRET`, a key separate from the user JWT key. Treat it as opaque.
- Valid **15 minutes**, bound to the owner that requested it (audience `icetrack-site-registration`, subject = owner id). A token from another owner, an expired token or a forged one is `400 ADDRESS_VALIDATION_REQUIRED` (`message` absent; use `code` and `details`).
- It carries the verified address, coordinates, place id, district and area, so the client cannot register an address that was not verified. Re-verify after 15 minutes.

## Pin adjustment rule

An optional `pin` may move the site marker. It must lie within **150 meters** (haversine) of the verified point, else `400 PIN_OUT_OF_RANGE`. `latitude` and `longitude` must be sent together (`@NotNull` each; latitude -90..90, longitude -180..180). The saved location keeps the verified `place_id`. With no pin the verified point is used.

## Site response

`SiteResource` includes `geocoding_status` (`PENDING`, `RESOLVED`, `FAILED`, `NOT_FOUND`), `location {latitude, longitude, place_id}` and `navigation_url`. `location` and `navigation_url` are **omitted** (`NON_NULL`) when the site is not located. With the current verified-token flow, sites are created and re-addressed as `RESOLVED`, so they are normally present. `navigation_url` has the form `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&destination_place_id=<id>` (the place id part only when known); the mobile app can open it to start navigation.

## Failure matrix for `validate-address`

| Status | Code | Body | Retry |
|---|---|---|---|
| 200 | | `AddressValidationResource` | n/a |
| 400 | `VALIDATION_ERROR` | missing/blank `address` | fix input |
| 401 / 403 | `UNAUTHORIZED` / `ACCESS_DENIED` | no token / not an owner | n/a |
| 422 | `ADDRESS_NOT_VERIFIED` | `{code, message, candidates[]}` (not the standard body) | offer candidates, user corrects the text |
| 422 | `ADDRESS_OUT_OF_COVERAGE` | standard body, `message` absent, `details` explains the service area | do not retry the same address |
| 429 | `TOO_MANY_REQUESTS` | standard body, `Retry-After: 60` | wait |
| 503 | `GEOCODING_UNAVAILABLE` | standard body, `message` absent, `details` is `TRANSIENT_FAILURE` or `PERMANENT_FAILURE`, `Retry-After: 30` | retry after ~30 s; `PERMANENT_FAILURE` indicates a server configuration problem (for example a rejected API key) |

## Configuration (names only)

`google.maps.api-key` (placeholder default `YOUR_MAPS_DEMO_KEY`; with the placeholder every verification is refused by Google and answered `503`), `google.maps.geocoding-url`, `assets.address-validation.secret` (`ADDRESS_VALIDATION_SECRET`).
