# Notifications - request and response contracts

Generated from the REST resource records under `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/resources`. Property names are the **serialized** names: Jackson runs with `SNAKE_CASE` (`JacksonConfiguration`, `spring.jackson.property-naming-strategy`), so the Java component `fullName` is the JSON property `full_name`.

Legend: **Required** = enforced by Bean Validation (`@NotNull` / `@NotBlank`). Optional properties may be omitted or `null`. A resource marked `@JsonInclude(NON_NULL)` **omits** null properties; every other resource writes them as `null`.

## `BulkNotificationReadRequest` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/resources/BulkNotificationReadRequest.java`
- Example: [`requests/BulkNotificationReadRequest.json`](requests/BulkNotificationReadRequest.json) | JSON Schema: [`schemas/notifications/BulkNotificationReadRequest.schema.json`](../../schemas/notifications/BulkNotificationReadRequest.schema.json)
- Used by: `PUT /api/v1/notifications/read`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `notification_ids` | array<integer> | yes | 1 to 100 items; each not null and greater than zero | Notifications to mark as read; duplicates count once; identifiers not addressed to the caller, already read or dismissed are skipped |

## `BulkReadResultResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/resources/BulkReadResultResource.java`
- Example: [`responses/BulkReadResultResource.json`](responses/BulkReadResultResource.json) | JSON Schema: [`schemas/notifications/BulkReadResultResource.schema.json`](../../schemas/notifications/BulkReadResultResource.schema.json)
- Used by: `PUT /api/v1/notifications/read-all`, `PUT /api/v1/notifications/read`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `updated_count` | integer | no |  | Notifications that changed from unread to read; `0` on a repeated call |
| `unread_count` | integer | no |  | The caller's notifications neither read nor dismissed after the change |

## `NotificationResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/resources/NotificationResource.java`
- Example: [`responses/NotificationResource.json`](responses/NotificationResource.json) | JSON Schema: [`schemas/notifications/NotificationResource.schema.json`](../../schemas/notifications/NotificationResource.schema.json)
- Used by: `GET /api/v1/notifications/{notificationId}`, `PUT /api/v1/notifications/{notificationId}/read`, `PUT /api/v1/notifications/{notificationId}/dismiss`
- Embedded in: `PagedNotificationResource`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `id` | integer | no |  | Notification unique identifier |
| `recipient_user_id` | integer | no |  | Identifier of the owner or technician profile the notification is addressed to |
| `equipment_id` | integer | no |  | Identifier of the equipment the notification concerns; nullable |
| `device_id` | integer | no |  | Identifier of the device the notification concerns; nullable |
| `source_alert_id` | integer | no |  | Identifier of the alert that triggered the notification; nullable |
| `service_request_id` | integer | no |  | Identifier of the service request the notification is about; set for `SERVICE_REQUEST_UPDATE` notifications and for `MAINTENANCE_WINDOW` notifications of a window linked to a request, null otherwise; nullable |
| `message` | string | no |  | Notification text in English; the fallback to show when `message_key` is unknown |
| `message_key` | string | no |  | Stable key of the message template, never null: `alert.temperature_excursion.raised`, `alert.device_offline.raised`, `alert.sensor_failure.raised`, `service_request.assigned`, `service_request.unassigned`, `service_request.rejected`, `service_request.canceled`, `maintenance_window.opened`, `maintenance_window.closed`; `notification.untemplated` for a notification stored before templates existed |
| `message_params` | object | no |  | Values filled into the template, never null (possibly `{}`); strings or numbers, never markup. A value unknown when the notification was raised is left out. Per key: temperature excursion `equipment_id`, `equipment_name`, `temperature`, `limit` (`MAX`/`MIN`), `threshold`; device offline `equipment_id`, `equipment_name`, `silent_minutes`; sensor failure `equipment_id`, `equipment_name`; assigned `service_request_id`, `equipment_name`, `technician_name`; unassigned `service_request_id`, `equipment_name`; rejected and canceled `service_request_id`, `equipment_name`, `reason`; window opened `equipment_name`, `origin` (`APP`/`BUTTON`); window closed `equipment_name`, `closure_reason` |
| `type` | string | no |  | documented values: `MAINTENANCE_REMINDER`, `TEMPERATURE_EXCURSION`, `DEVICE_OFFLINE`, `LOW_BATTERY`, `SENSOR_FAILURE`, `SERVICE_REQUEST_UPDATE`, `MAINTENANCE_WINDOW`, `UNLINKED_MAINTENANCE_WINDOW`; Kind of event that produced the notification |
| `severity` | string | no |  | documented values: `INFO`, `WARNING`, `CRITICAL`; Urgency of the notification |
| `is_read` | boolean | no |  | Whether the user has already read the notification |
| `created_at` | string (date-time, UTC with Z) | no |  | When the notification was raised; never null. The inbox is ordered by it, most recent first |
| `read_at` | string (date-time, UTC with Z) | no |  | When the notification was read; null while unread; nullable |
| `dismissed_at` | string (date-time, UTC with Z) | no |  | When the user dismissed the notification; null while not dismissed; nullable |

## `PagedNotificationResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/resources/PagedNotificationResource.java`
- Example: [`responses/PagedNotificationResource.json`](responses/PagedNotificationResource.json) | JSON Schema: [`schemas/notifications/PagedNotificationResource.schema.json`](../../schemas/notifications/PagedNotificationResource.schema.json)
- Used by: `GET /api/v1/notifications`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `items` | array<object (`NotificationResource`)> | no |  | Notifications of this page, most recent first |
| `page` | integer | no |  | Zero-based index of this page |
| `size` | integer | no |  | Maximum number of notifications a page may hold |
| `total_elements` | integer | no |  | Total number of notifications matching the filter |
| `total_pages` | integer | no |  | Number of pages the matching notifications span; at least 1 |

## `RegisterDeviceTokenResource` (request)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/resources/RegisterDeviceTokenResource.java`
- Example: [`requests/RegisterDeviceTokenResource.json`](requests/RegisterDeviceTokenResource.json) | JSON Schema: [`schemas/notifications/RegisterDeviceTokenResource.schema.json`](../../schemas/notifications/RegisterDeviceTokenResource.schema.json)
- Used by: `PUT /api/v1/notifications/device-tokens`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `token` | string | yes | not blank; max length 512 | FCM registration token of the device |
| `platform` | string enum | yes |  | values: `ANDROID`, `IOS`, `WEB`; documented values: `ANDROID`, `IOS`, `WEB`; Operating system of the device |

## `UnreadNotificationCountResource` (response)

- Source: `src/main/java/pe/edu/upc/ice/track/platform/notifications/interfaces/rest/resources/UnreadNotificationCountResource.java`
- Example: [`responses/UnreadNotificationCountResource.json`](responses/UnreadNotificationCountResource.json) | JSON Schema: [`schemas/notifications/UnreadNotificationCountResource.schema.json`](../../schemas/notifications/UnreadNotificationCountResource.schema.json)
- Used by: `GET /api/v1/notifications/unread-count`

| JSON property | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `unread_count` | integer | no |  | Number of notifications neither read nor dismissed |
