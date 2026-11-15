# Notifications

Package `pe.edu.upc.ice.track.platform.notifications`. API: [../api/notifications/endpoints.md](../api/notifications/endpoints.md), contracts: [../api/notifications/contracts.md](../api/notifications/contracts.md). Push: [../integrations/firebase-cloud-messaging.md](../integrations/firebase-cloud-messaging.md).

## Responsibilities

In-app notification inbox per user (owners and technicians), device (FCM) token registry, and delivery of pushes.

## Package organization (actual)

```text
notifications/
  application/commandservices   DeviceTokenCommandService, NotificationCommandService
  application/queryservices     NotificationQueryService
  application/internal/eventhandlers   NotificationCreatedEventHandler (@Async push)
  application/internal/messages        NotificationMessageComposer (messages.properties `notification.*`, localized, cut to 255 chars)
  application/internal/outboundservices
      acl/ExternalAssetManagementServiceForNotifications, ExternalProfilesServiceForNotifications
      push/PushGateway
  domain/model/aggregates   Notification, DeviceToken ; valueobjects NotificationType, NotificationSeverity, DevicePlatform, NotificationPage ...
  infrastructure/monitoring/events, infrastructure/servicerequest/events   listeners for other contexts' integration events
  infrastructure/push/fcm (FcmPushGateway, FcmConfiguration), push/NoOpPushGateway
  interfaces/acl/NotificationsContextFacade ; interfaces/rest  NotificationsController, DeviceTokensController
```

## Behavior visible through the API

- The recipient is always derived from the access token (`ExternalProfilesServiceForNotifications.fetchRecipientUserIdByUsername`); there is no way to read someone else's inbox. A notification addressed to someone else answers `404` with an **empty body**.
- `GET /api/v1/notifications`: `page` (default 0), `size` (default 20, 1 to 100, larger capped at 100), `unread_only` (default false). Active (not dismissed) notifications, most recent first. Response `PagedNotificationResource` uses `items`, not `content`. A caller with neither profile gets an empty page (paging values are still validated).
- `PUT .../read` and `PUT .../dismiss` return the updated `NotificationResource`.
- `unread-count` returns `{ "unread_count": n }` for the badge.
- Notification `message` is stored as English text composed at event time by `NotificationMessageComposer` in a fixed locale, `RECIPIENT_LOCALE = Locale.ENGLISH`; `Accept-Language` does not affect it. Each notification also stores its template: `message_key` (one key per producer, the catalogue in [../api/notifications/contracts.md](../api/notifications/contracts.md)) and `message_params` (the values to fill in: unit name, technician name, temperature, limit, reason, ...). Clients render the translation of `message_key` with `message_params` and fall back to `message` for an unknown key. The values are resolved when the notification is created, so a later rename of a unit does not change a stored notification. `MessageTemplate` (domain) and `NotificationCommandServiceImpl` build the template; `MessageParamsPersistenceConverter` stores it as JSON in `message_params`.
- Types: `MAINTENANCE_REMINDER`, `TEMPERATURE_EXCURSION`, `DEVICE_OFFLINE`, `LOW_BATTERY`, `SENSOR_FAILURE`, `SERVICE_REQUEST_UPDATE`, `MAINTENANCE_WINDOW`, `UNLINKED_MAINTENANCE_WINDOW`. Producers in code: thermal alert raised, technician assigned/unassigned, request rejected, request canceled, maintenance window opened/closed. No producer exists for `MAINTENANCE_REMINDER` or `LOW_BATTERY`.

## Internal data flow, thermal alert to owner

`EdgeEventsController.recordEvent` (monitoring) -> `AlertRaisedEvent` -> `AlertRaisedEventHandler` publishes `AlertRaisedIntegrationEvent` -> `AlertRaisedEventListener` (notifications) -> `NotificationCommandServiceImpl.handle(NotifyAlertRaisedCommand)` -> `ExternalAssetManagementServiceForNotifications.fetchEquipmentOwnerId` (`AssetContextFacade.getEquipmentOwnerId`) -> `Notification` saved -> `NotificationCreatedEvent` -> `NotificationCreatedEventHandler` (async) -> `PushGateway` (FCM or no-op). The frontend then sees the item in `GET /api/v1/notifications` and, for owners with an open stream, the alert in the SSE stream.

## Dependencies

Outbound: assets (unit owner), iam + profiles (recipient). Inbound: `NotificationsContextFacade` (no callers). Subscribes to monitoring and service.request integration events.
