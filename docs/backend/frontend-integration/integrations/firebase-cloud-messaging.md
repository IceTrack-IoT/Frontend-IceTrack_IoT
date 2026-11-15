# Firebase Cloud Messaging (push notifications)

Additional integration discovered in the source. It is **separate from file storage**: Firebase is used only for push messages (`firebase-admin` 9.5), never for files.

Sources: `notifications/interfaces/rest/DeviceTokensController`, `NotificationsController`, `notifications/application/internal/eventhandlers/NotificationCreatedEventHandler`, `notifications/application/internal/outboundservices/push/PushGateway`, `notifications/infrastructure/push/fcm/FcmPushGateway`, `FcmConfiguration`, `push/NoOpPushGateway`, `application.properties` (`notifications.push.*`).

## Responsibilities

| Frontend / mobile app | Backend |
|---|---|
| Integrate the FCM SDK, obtain the registration token, request OS notification permission | Store tokens per recipient, send pushes through the Firebase Admin SDK, delete tokens FCM reports as dead |
| Call `PUT /api/v1/notifications/device-tokens` on **every app start**, after sign-in and whenever FCM rotates the token | Create the in-app notification first, then push it asynchronously |
| Call `DELETE /api/v1/notifications/device-tokens?token=...` on logout | |
| Handle taps and data payloads; call the notification endpoints to refresh the inbox | |

## Endpoints

| Method | Path | Body / query | Success | Failure |
|---|---|---|---|---|
| `PUT` | `/api/v1/notifications/device-tokens` | `RegisterDeviceTokenResource` `{ "token": "<fcm token, max 512>", "platform": "ANDROID" }` (`platform`: `ANDROID`, `IOS` or `WEB`) | `204`, no body. Idempotent register-or-refresh | `400` invalid token/platform; `401`; `403 ACCESS_DENIED` (standard error body) when the account has neither an owner nor a technician profile |
| `DELETE` | `/api/v1/notifications/device-tokens?token=<fcm token>` | query `token` (required) | `204`, also when the token was not registered | `401`; `403 ACCESS_DENIED` as above |

Any authenticated owner or technician may register tokens (no role restriction). The same user may hold several tokens (several devices).

## What the push looks like

Created by `NotificationCreatedEventHandler` (async, after the notification exists):

| Part | Value |
|---|---|
| FCM `notification.title` | `IceTrack - Critical alert` (severity `CRITICAL`), `IceTrack - Warning` (`WARNING`), `IceTrack` (`INFO`) |
| FCM `notification.body` | The notification `message` (English text composed by `NotificationMessageComposer`) |
| FCM `data` map (all values are strings) | `notification_id`, `type` (`NotificationType`), `severity`, and when present `equipment_id`, `alert_id` |
| Android priority | `HIGH` |
| Batching | 500 tokens per multicast |
| Dead tokens | `UNREGISTERED` and `SENDER_ID_MISMATCH` responses delete the token. When the Admin SDK cannot read FCM's error body (observed against the real provider: the code arrives empty), an HTTP `404` still counts as `UNREGISTERED`. Other errors, such as `400 INVALID_ARGUMENT` for a malformed token, are only logged and the token is kept |

`type` values: `MAINTENANCE_REMINDER`, `TEMPERATURE_EXCURSION`, `DEVICE_OFFLINE`, `LOW_BATTERY`, `SENSOR_FAILURE`, `SERVICE_REQUEST_UPDATE`, `MAINTENANCE_WINDOW`, `UNLINKED_MAINTENANCE_WINDOW`. Not every value has a producer today: `MAINTENANCE_REMINDER`, `LOW_BATTERY` and `SENSOR_FAILURE` are never created, and `DEVICE_OFFLINE` is created by the scheduled offline detection (see [../bounded-contexts/monitoring.md](../bounded-contexts/monitoring.md#device-offline-detection)).

## Who is notified (from the event listeners)

| Event | Notified |
|---|---|
| Thermal alert raised (`AlertRaisedIntegrationEvent`) | the **owner** of the unit |
| Technician assigned | the assigned technician (and a "reassigned" notice to the previous one) |
| Service request rejected by the technician | the owner |
| Service request canceled by the owner | the assigned technician, if any |
| Maintenance window opened / closed | recipients resolved by `NotificationCommandServiceImpl` |

Technicians do **not** receive thermal-alert pushes in the current code (backlog US-32 expects them).

## In-app inbox endpoints

Push is a hint; the notification list is the source of truth. See [../api/notifications/endpoints.md](../api/notifications/endpoints.md): `GET /api/v1/notifications` (paged, `page`, `size` 1 to 100 default 20, `unread_only`), `GET /api/v1/notifications/unread-count`, `GET /api/v1/notifications/{id}`, `PUT .../read`, `PUT .../dismiss`. The paged response is `PagedNotificationResource` with property **`items`** (other paged resources use `content`).

## Provider switch

`notifications.push.provider` (`PUSH_PROVIDER`, default `fcm` in `application.properties`): `fcm` delivers through Firebase using `FCM_CREDENTIALS_PATH`; `none` only logs pushes (the default when the property is absent). The service account file is configuration, never exposed. With `none`, tokens can still be registered but nothing is delivered.

## Verification against the provider

Exercised locally with the development service account (`FCM_CREDENTIALS_PATH`), never with a real user's device:

| Check | Result |
|---|---|
| Firebase initialization from the service account | Succeeded at startup |
| `PUT` / `DELETE /notifications/device-tokens` | `204`, idempotent; `400` for an unknown `platform`; `400` without `token` on `DELETE` |
| Push submission | A notification created for a recipient holding a test token was pushed to FCM (asynchronously, after the notification was stored) |
| Provider response for a fabricated token | `HTTP 400`, platform code `INVALID_ARGUMENT`; the token is kept and the rejection logged |
| Delivery to a device | **Not verified**: no registered test device was available. Provider acceptance of a valid token was not observed either |

