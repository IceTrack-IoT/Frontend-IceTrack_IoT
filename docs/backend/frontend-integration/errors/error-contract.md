# Error contract

Sources: `shared/interfaces/rest/GlobalExceptionHandler`, `shared/interfaces/rest/transform/ErrorResponseAssembler`, `shared/interfaces/rest/resources/ErrorResource`, `shared/application/result/ApplicationError`, `iam/interfaces/rest/AuthenticationExceptionHandler`, `iam/.../UnauthorizedRequestHandlerEntryPoint`, `SignInRateLimitFilter`, `src/main/resources/messages.properties`.

**Not every endpoint answers errors the same way.** Besides the standard body there are a few special shapes, listed below. Build the client error model as a union.

## 1. Standard error body (`ErrorResource`)

```json
{ "code": "EQUIPMENT_NOT_FOUND", "message": "No equipment matches the supplied identifier", "details": "optional extra context" }
```

| Property | Type | Notes |
|---|---|---|
| `code` | string | Machine-readable. Branch on this, never on `message` |
| `message` | string | Human-readable, localized with `Accept-Language` (`en` default, `es`). Always present: a code without a message of its own falls back to the generic text of its family (`No <entity> matches the supplied identifier` for `*_NOT_FOUND`) and finally to `The request could not be completed` |
| `details` | string | Optional context. **Omitted** when null. For 5xx it is always `Reference: <uuid>`; the real cause is only in the server log |

`ErrorResource` is `@JsonInclude(NON_NULL)`: absent properties are omitted, not `null`.

For codes whose message template is `{0}`, `message` equals `details` (for example `VALIDATION_ERROR`, `INVALID_STATUS_TRANSITION`, `*_CONFLICT`, `UNAUTHORIZED`, `ROLE_CHANNEL_MISMATCH`).

### Messages of the address and lookup codes

| Code | `message` |
|---|---|
| `SITE_NOT_FOUND` | `No site matches the supplied identifier` |
| `REPORT_NOT_FOUND` | `No report matches the supplied identifier` |
| `NOTIFICATION_NOT_FOUND` | `No notification matches the supplied identifier` |
| `ADDRESS_OUT_OF_COVERAGE` | `The address is outside the service area` |
| `ADDRESS_VALIDATION_REQUIRED` | `A valid address validation token is required` |
| `PIN_OUT_OF_RANGE` | `The pin is too far from the verified address` |
| `GEOCODING_UNAVAILABLE` | `The address verification service is unavailable` |

`details` keeps the specific explanation (for example the coverage area, or how to obtain a validation token).

## 2. Code to HTTP status (`ErrorResponseAssembler.toStatusFromErrorCode`)

| Status | Codes |
|---|---|
| 400 | `VALIDATION_ERROR`, `ADDRESS_VALIDATION_REQUIRED`, `PIN_OUT_OF_RANGE` |
| 401 | `UNAUTHORIZED`, `BAD_CREDENTIALS`, `INVALID_TOKEN` |
| 403 | `ACCESS_DENIED`, `ROLE_CHANNEL_MISMATCH` |
| 404 | any code ending in `_NOT_FOUND`: `USER_NOT_FOUND`, `OWNER_NOT_FOUND`, `TECHNICIAN_NOT_FOUND`, `DASHBOARD_CONFIG_NOT_FOUND`, `DASHBOARD_CARD_NOT_FOUND`, `EQUIPMENT_NOT_FOUND`, `SITE_NOT_FOUND`, `DEVICE_NOT_FOUND`, `ALERT_NOT_FOUND`, `NOTIFICATION_NOT_FOUND`, `SERVICE_REQUEST_NOT_FOUND`, `REVIEW_NOT_FOUND`, `REPORT_NOT_FOUND`, `GOOGLE_ACCOUNT_NOT_FOUND` |
| 409 | `INVALID_STATUS_TRANSITION`, `TECHNICIAN_NOT_ELIGIBLE`, `REVIEW_NOT_ALLOWED`, `ACCOUNT_LINK_REQUIRED`, any code ending in `_CONFLICT` (`USER_CONFLICT`, `PROFILE_CONFLICT`, `OWNER_CONFLICT`, `TECHNICIAN_CONFLICT`, `DASHBOARD_CONFIG_CONFLICT`, `EQUIPMENT_CONFLICT`, `DEVICE_CONFLICT`, `READING_CONFLICT`, `EDGE_EVENT_CONFLICT`, `DUPLICATE_RESOURCE_CONFLICT`, `CONCURRENT_MODIFICATION_CONFLICT`, `IDEMPOTENCY_KEY_CONFLICT`) |
| 422 | `BUSINESS_RULE_VIOLATION`, `ADDRESS_OUT_OF_COVERAGE`, `ADDRESS_NOT_VERIFIED` |
| 429 | `TOO_MANY_REQUESTS` |
| 503 | `GEOCODING_UNAVAILABLE` |
| 500 | everything else, including `UNEXPECTED_ERROR` |

## 3. Global handlers (apply to every controller)

| Trigger | Status | Body |
|---|---|---|
| Bean Validation failure on a body (`@Valid`) | 400 | `code: VALIDATION_ERROR`, `details`: `Field <name>: <reason>; Field <name>: <reason>`. `<name>` is the snake_case JSON property path the client sent (`Field min_celsius: must be between 0 and 30 °C`, `Field pin.latitude: ...`, `Field cards[0].order: ...`). Entries are sorted alphabetically and each appears once, so the same body always yields the same text. Cross-field rules appear under a snake_case rule name, for example `Field temperature_order_consistent: min_temperature <= avg_temperature <= max_temperature must hold` |
| Body is not JSON or holds an unknown enum value / wrong type | 400 | `VALIDATION_ERROR`, `The request body is malformed or holds a value outside the accepted set` |
| Path/query value of the wrong type (`?status=ON`, `site_id=abc`) | 400 | `VALIDATION_ERROR`, for an enum the details list the accepted values: `Parameter 'status' must be one of [ACTIVE, MAINTENANCE, REPAIR, DEACTIVATED]` |
| Missing required query parameter | 400 | `VALIDATION_ERROR`, `Parameter 'equipment_id' is required` |
| `IllegalArgumentException` from a domain rule (a value object refusing a value, for example a RUC that is not 11 digits) | 400 | `VALIDATION_ERROR`, `details` = the exception message in English (not localized) |
| `@PreAuthorize` denial | 403 | `ACCESS_DENIED`, `message: "Access denied"`, `details: "You are not allowed to perform this operation"` |
| Optimistic lock failure, or a stale `If-Match` version | 409 | `CONCURRENT_MODIFICATION_CONFLICT`: re-read the resource and retry; with `If-Match`, `details` names the current version |
| `Idempotency-Key` reused with another body, or while its first request runs | 409 | `IDEMPOTENCY_KEY_CONFLICT`: `details` is `in progress` (with `Retry-After: 1`) in the second case |
| Unique constraint violation (race on a unique value such as an equipment `uid`) | 409 | `DUPLICATE_RESOURCE_CONFLICT` |
| Anything else | 500 | `UNEXPECTED_ERROR`, `details: "Reference: <uuid>"` |

## 4. Other shapes

| Where | Status | Shape |
|---|---|---|
| Missing/invalid bearer token on the user chain | 401 | Standard body: `{"code":"UNAUTHORIZED","message":"A valid bearer token is required","details":"A valid bearer token is required"}` |
| Refresh token rejected | 401 | `AuthErrorResource` `{timestamp, status, error, code, message}`; codes `REFRESH_TOKEN_*` ([security/authentication.md](../security/authentication.md)) |
| Too many sign-in failures | 429 | Standard body `TOO_MANY_REQUESTS` + `Retry-After` header |
| Address validation rate limit (20/min per owner) | 429 | Standard body + `Retry-After: 60` |
| Maps service unavailable | 503 | Standard body `GEOCODING_UNAVAILABLE` + `Retry-After: 30` |
| `ADDRESS_NOT_VERIFIED` | 422 | **Not** the standard body: `{ "code", "message", "candidates": [ "formatted address", ... ] }` (up to 5 candidates, may be empty) |
| Stream ticket rejected (`GET /api/v1/telemetry/stream`) | 401 | Standard body, content type `application/json` |
| Reading batch rejected (`POST /api/v1/telemetry`) | 400 | `{ "code": "VALIDATION_ERROR", "message": "Invalid reading payload", "details": "humidity: ...; temperature_order_consistent: ..." }` (controller-level handlers; snake_case names, sorted, without the `Field` prefix) |
| Device API key rejected on edge routes | 401 | **Empty body** |
| Device token endpoints without an owner/technician profile | 403 | Standard body: `ACCESS_DENIED`, `details: "The authenticated account has no owner or technician profile"` |
| Conditional config poll unchanged | 304 | Empty body with `ETag` |

Every 404 of the user chain carries a standard body. The lookups that answer "not found" for a resource the caller may not reach use these codes: `GET /api/v1/users/{userId}` (`USER_NOT_FOUND`), `GET /api/v1/alert-policies/equipment/{equipmentId}` and `GET /api/v1/telemetry/equipment/{equipmentId}` (`EQUIPMENT_NOT_FOUND`), `GET /api/v1/alerts/{alertId}` (`ALERT_NOT_FOUND`), `GET /api/v1/notifications/{notificationId}`, `PUT .../read` and `PUT .../dismiss` (`NOTIFICATION_NOT_FOUND`).

## 5. Frontend handling guide

| Situation | Recommended handling |
|---|---|
| `400` | Show `details` as a form-level message. For field-level errors, split `details` on `; `, strip the `Field ` prefix and use the snake_case name before `:` as the form control key (it is the request property name) |
| `401` on a normal call | Run the single-flight refresh, replay once, otherwise sign out. Do not retry with the same expired token |
| `401 BAD_CREDENTIALS`, `INVALID_TOKEN` | Show a generic credential message; never say which part was wrong |
| `403 ROLE_CHANNEL_MISMATCH` | Tell the user which application to use (`details` says it) |
| `403 ACCESS_DENIED` | Hide or disable the action for the role; show a generic "not allowed" |
| `404` | Treat as "does not exist or is not yours"; do not distinguish |
| `409 INVALID_STATUS_TRANSITION`, `REVIEW_NOT_ALLOWED`, `TECHNICIAN_NOT_ELIGIBLE` | The local state is stale or the action is not allowed now; reload the resource, then show `message` |
| `409 CONCURRENT_MODIFICATION_CONFLICT` | Safe to reload and retry once |
| `409 DUPLICATE_RESOURCE_CONFLICT`, `*_CONFLICT` | Show `message`; a duplicate value (equipment uid, username, email) must be changed |
| `422` | Business rule: show `message`/`details`; for `ADDRESS_NOT_VERIFIED` offer the `candidates` list |
| `429` | Wait for `Retry-After` when readable, else back off (60 s for address validation, 5 min for sign-in) |
| `503 GEOCODING_UNAVAILABLE` | Retryable after ~30 s; allow the user to retry later |
| `5xx` | Retryable only for idempotent reads; show the `Reference` from `details` to the user for support |
| `204` / `304` / edge `401` | There is no JSON; do not call `response.json()` |
| Network failure on a `POST` that creates something | Do not blindly retry, except calls that carry a client-generated idempotency key (`client_generated_id`, `reading_uid`, `event_uid`) |
