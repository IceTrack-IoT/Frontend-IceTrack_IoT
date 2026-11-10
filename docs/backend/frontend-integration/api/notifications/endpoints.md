# Notifications - REST endpoints

Every endpoint below was discovered from the controllers named in its entry. "Declared statuses" are the `@ApiResponse` codes the controller documents. Statuses produced by shared handlers apply to every endpoint (see [../../errors/error-contract.md](../../errors/error-contract.md)): `400` for unreadable bodies, failed validation and bad parameter types; `401` for a missing or invalid bearer token; `403` for method-security denials; `500` for unexpected errors.

Base URL: see [../../README.md](../../README.md#5-base-url). All paths are relative to it. JSON bodies use `snake_case`.

| # | Method | Path | Auth | Summary |
|---|---|---|---|---|
| 1 | `PUT` | `/api/v1/notifications/device-tokens` | Authenticated (any valid bearer token) | Register device token |
| 2 | `DELETE` | `/api/v1/notifications/device-tokens` | Authenticated (any valid bearer token) | Unregister device token |
| 3 | `GET` | `/api/v1/notifications` | Authenticated (any valid bearer token) | List my notifications |
| 4 | `GET` | `/api/v1/notifications/unread-count` | Authenticated (any valid bearer token) | Count my unread notifications |
| 5 | `PUT` | `/api/v1/notifications/read-all` | Authenticated (any valid bearer token) | Mark all my notifications as read |
| 6 | `PUT` | `/api/v1/notifications/read` | Authenticated (any valid bearer token) | Mark several of my notifications as read |
| 7 | `GET` | `/api/v1/notifications/{notificationId}` | Authenticated (any valid bearer token) | Get notification by ID |
| 8 | `PUT` | `/api/v1/notifications/{notificationId}/read` | Authenticated (any valid bearer token) | Mark notification as read |
| 9 | `PUT` | `/api/v1/notifications/{notificationId}/dismiss` | Authenticated (any valid bearer token) | Dismiss notification |

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

**List my notifications** - Returns one page of the authenticated caller's active (not dismissed) notifications, most recent first, optionally only the unread ones, and optionally narrowed by severity, type and unit. The filters combine with each other and only narrow the caller's own notifications, so a unit of another owner yields an empty page. The recipient is derived from the access token. size defaults to 20 and is capped at 100.

| Field | Value |
|---|---|
| Bounded context | Notifications |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/NotificationsController.java` - method `listMyNotifications` |
| Authentication / authorization | Authenticated (any valid bearer token) |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | `page` (int; optional; default `0`)<br>`size` (int; optional; default `20`, 1 to 100, larger values capped at 100)<br>`unread_only` (boolean; optional; default `false`)<br>`severity` (comma-separated `INFO`, `WARNING`, `CRITICAL`; optional)<br>`type` (comma-separated `NotificationType`; optional; the eight values listed in [contracts.md](contracts.md#notificationresource-response))<br>`equipment_id` (Long; optional) |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `PagedNotificationResource` ([`responses/PagedNotificationResource.json`](responses/PagedNotificationResource.json)) - Page of notifications; empty when the caller has none<br>`400` - `ErrorResource` - VALIDATION_ERROR - a negative page, a size below 1, or an unknown severity or type (`details`: `Parameter 'severity' must be one of [INFO, WARNING, CRITICAL]`)<br>`401` - error body - Unauthorized - JWT token required or invalid |
| Application flow | controller -> `externalProfilesService`, `notificationQueryService` |

## `PUT /api/v1/notifications/read-all`

**Mark all my notifications as read** - Marks every active, unread notification of the authenticated caller as read, or only those matching the optional severity, type and unit filters, which work as on the listing. Idempotent: a second call updates 0. Answers how many changed and the unread count afterward, so the badge needs no second request.

| Field | Value |
|---|---|
| Bounded context | Notifications |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/NotificationsController.java` - method `markAllMyNotificationsAsRead` |
| Authentication / authorization | Authenticated (any valid bearer token); recipient derived from the token |
| Headers | `Accept: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | `severity` (comma-separated; optional)<br>`type` (comma-separated; optional)<br>`equipment_id` (Long; optional) |
| Request body | none (no JSON request body) |
| Declared statuses / responses | `200` - `BulkReadResultResource` ([`responses/BulkReadResultResource.json`](responses/BulkReadResultResource.json)) - Matching notifications marked as read<br>`400` - `ErrorResource` - VALIDATION_ERROR - an unknown severity or type<br>`401` - error body - Unauthorized - JWT token required or invalid |
| Application flow | controller -> `externalProfilesService`, `notificationCommandService` (one conditional bulk `UPDATE`, then the unread count) |

## `PUT /api/v1/notifications/read`

**Mark several of my notifications as read** - Marks the listed notifications of the authenticated caller as read. Identifiers not addressed to the caller, already read or dismissed are skipped silently. Answers how many changed and the unread count afterward.

| Field | Value |
|---|---|
| Bounded context | Notifications |
| Controller | `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/NotificationsController.java` - method `markSeveralOfMyNotificationsAsRead` |
| Authentication / authorization | Authenticated (any valid bearer token); recipient derived from the token |
| Headers | `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <access token>` |
| Path parameters | none |
| Query parameters | none |
| Request body | `BulkNotificationReadRequest` - [`requests/BulkNotificationReadRequest.json`](requests/BulkNotificationReadRequest.json), schema [`BulkNotificationReadRequest.schema.json`](../../schemas/notifications/BulkNotificationReadRequest.schema.json) |
| Declared statuses / responses | `200` - `BulkReadResultResource` ([`responses/BulkReadResultResource.json`](responses/BulkReadResultResource.json)) - Listed notifications marked as read<br>`400` - `ErrorResource` - VALIDATION_ERROR - `notification_ids` missing, empty, or holding more than 100 identifiers<br>`401` - error body - Unauthorized - JWT token required or invalid |
| Application flow | controller -> `externalProfilesService`, `notificationCommandService` (one conditional bulk `UPDATE`, then the unread count) |

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
