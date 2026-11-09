# Notifications - REST endpoints

Every endpoint below was discovered from the controllers named in its entry. "Declared statuses" are the `@ApiResponse` codes the controller documents. Statuses produced by shared handlers apply to every endpoint (see [../../errors/error-contract.md](../../errors/error-contract.md)): `400` for unreadable bodies, failed validation and bad parameter types; `401` for a missing or invalid bearer token; `403` for method-security denials; `500` for unexpected errors.

Base URL: see [../../README.md](../../README.md#5-base-url). All paths are relative to it. JSON bodies use `snake_case`.

| # | Method | Path | Auth | Summary |
|---|---|---|---|---|
| 1 | `PUT` | `/api/v1/notifications/device-tokens` | Authenticated (any valid bearer token) | Register device token |
| 2 | `DELETE` | `/api/v1/notifications/device-tokens` | Authenticated (any valid bearer token) | Unregister device token |
| 3 | `GET` | `/api/v1/notifications` | Authenticated (any valid bearer token) | List my notifications |
| 4 | `GET` | `/api/v1/notifications/unread-count` | Authenticated (any valid bearer token) | Count my unread notifications |
| 5 | `GET` | `/api/v1/notifications/{notificationId}` | Authenticated (any valid bearer token) | Get notification by ID |
| 6 | `PUT` | `/api/v1/notifications/{notificationId}/read` | Authenticated (any valid bearer token) | Mark notification as read |
| 7 | `PUT` | `/api/v1/notifications/{notificationId}/dismiss` | Authenticated (any valid bearer token) | Dismiss notification |

## `PUT /api/v1/notifications/device-tokens`

**Register device token** - Registers or refreshes the FCM token of the caller's device. Idempotent: call it on every app start and whenever FCM rotates the token.

| Field | Value |
|---|---|
| Bounded context | Notifications |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/DeviceTokensController.java` - method `registerDeviceToken` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `RegisterDeviceTokenResource` - [`requests/RegisterDeviceTokenResource.json`](requests/RegisterDeviceTokenResource.json), schema [`RegisterDeviceTokenResource.schema.json`](../../schemas/notifications/RegisterDeviceTokenResource.schema.json) |
| Declared statuses / responses | `204` - no JSON body (Token registered)<br>`400` - error body - Invalid token or platform<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - ACCESS_DENIED - the account has no owner or technician profile |
| Application flow | controller -> `deviceTokenCommandService`, `externalProfilesService` |

## `DELETE /api/v1/notifications/device-tokens`

**Unregister device token** - Stops pushing to the given device. Call it on logout. Idempotent.

| Field | Value |
|---|---|
| Bounded context | Notifications |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/DeviceTokensController.java` - method `unregisterDeviceToken` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | `token` (String; required) |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `204` - no JSON body (Token removed (or it was not registered))<br>`401` - error body - Unauthorized - JWT token required or invalid<br>`403` - error body - ACCESS_DENIED - the account has no owner or technician profile |
| Application flow | controller -> `deviceTokenCommandService`, `externalProfilesService` |

## `GET /api/v1/notifications`

**List my notifications** - Returns one page of the authenticated caller's active (not dismissed) notifications, most recent first, optionally only the unread ones. The recipient is derived from the access token. size defaults to 20 and is capped at 100.

| Field | Value |
|---|---|
| Bounded context | Notifications |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/NotificationsController.java` - method `listMyNotifications` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | `page` (int; optional; default `0`)<br>`size` (int; optional; default `20`, 1 to 100, larger values capped at 100)<br>`unread_only` (boolean; optional; default `false`) |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `PagedNotificationResource` ([`responses/PagedNotificationResource.json`](responses/PagedNotificationResource.json)) - Page of notifications; empty when the caller has none<br>`400` - `ErrorResource` - VALIDATION_ERROR - a negative page or a size below 1<br>`401` - error body - Unauthorized - JWT token required or invalid |
| Application flow | controller -> `externalProfilesService`, `notificationQueryService` |

## `GET /api/v1/notifications/unread-count`

**Count my unread notifications** - Returns how many of the authenticated caller's notifications are neither read nor dismissed, for the unread badge. The recipient is derived from the access token.

| Field | Value |
|---|---|
| Bounded context | Notifications |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/NotificationsController.java` - method `countMyUnreadNotifications` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `UnreadNotificationCountResource` ([`responses/UnreadNotificationCountResource.json`](responses/UnreadNotificationCountResource.json)) - Unread count; 0 when the caller has none<br>`401` - error body - Unauthorized - JWT token required or invalid |
| Application flow | controller -> `externalProfilesService`, `notificationQueryService` |

## `GET /api/v1/notifications/{notificationId}`

**Get notification by ID** - Retrieves one of the authenticated caller's notifications by its unique identifier.

| Field | Value |
|---|---|
| Bounded context | Notifications |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/NotificationsController.java` - method `getNotificationById` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `notificationId` (Long; Java `notificationId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `NotificationResource` ([`responses/NotificationResource.json`](responses/NotificationResource.json)) - Notification found and retrieved successfully<br>`404` - error body - NOTIFICATION_NOT_FOUND - no such notification is addressed to the caller<br>`401` - error body - Unauthorized - JWT token required or invalid |
| Application flow | controller -> `externalProfilesService`, `notificationQueryService` |

## `PUT /api/v1/notifications/{notificationId}/read`

**Mark notification as read** - Marks one of the authenticated caller's notifications as read.

| Field | Value |
|---|---|
| Bounded context | Notifications |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/NotificationsController.java` - method `markNotificationAsRead` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `notificationId` (Long; Java `notificationId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `NotificationResource` ([`responses/NotificationResource.json`](responses/NotificationResource.json)) - Notification marked as read successfully<br>`404` - error body - NOTIFICATION_NOT_FOUND - no such notification is addressed to the caller<br>`401` - error body - Unauthorized - JWT token required or invalid |
| Application flow | controller -> `externalProfilesService`, `notificationCommandService` |

## `PUT /api/v1/notifications/{notificationId}/dismiss`

**Dismiss notification** - Dismisses one of the authenticated caller's notifications from the active inbox.

| Field | Value |
|---|---|
| Bounded context | Notifications |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/NotificationsController.java` - method `dismissNotification` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | `notificationId` (Long; Java `notificationId`) |
| Query parameters | none |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `NotificationResource` ([`responses/NotificationResource.json`](responses/NotificationResource.json)) - Notification dismissed successfully<br>`404` - error body - NOTIFICATION_NOT_FOUND - no such notification is addressed to the caller<br>`401` - error body - Unauthorized - JWT token required or invalid |
| Application flow | controller -> `externalProfilesService`, `notificationCommandService` |
