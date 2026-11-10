# Enumerations and documented value sets

Values are exchanged as upper-case strings exactly as written. A value outside the set is rejected with `400 VALIDATION_ERROR`. Generated from the `*Resource` enums and from the `allowableValues` documented on string properties.

## Java enums exposed in requests, responses or query parameters

| Enum | Values | Context | Source |
|---|---|---|---|
| `ClientChannelResource` | `WEB`, `MOBILE` | iam | `src/main/java/pe/edu/upc/ice/track/platform/iam/interfaces/rest/resources/ClientChannelResource.java` |
| `EquipmentTypeResource` | `DISPLAY_CASE`, `COLD_ROOM`, `REFRIGERATOR`, `OTHER` | assets | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/EquipmentTypeResource.java` |
| `GeocodingStatusResource` | `PENDING`, `RESOLVED`, `FAILED`, `NOT_FOUND` | assets | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/GeocodingStatusResource.java` |
| `StatusEquipmentResource` | `ACTIVE`, `MAINTENANCE`, `REPAIR`, `DEACTIVATED` | assets | `src/main/java/pe/edu/upc/ice/track/platform/assets/interfaces/rest/resources/StatusEquipmentResource.java` |
| `DeviceStatusResource` | `UNPAIRED`, `PAIRED`, `REVOKED` | device | `src/main/java/pe/edu/upc/ice/track/platform/device/interfaces/rest/resources/DeviceStatusResource.java` |
| `ClosureReasonResource` | `MANUAL_APP`, `MANUAL_BUTTON`, `INTERVENTION_COMPLETED`, `EXPIRED`, `SAFETY_LIMIT` | monitoring | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/ClosureReasonResource.java` |
| `EdgeEventTypeResource` | `THERMAL_EXCURSION_DETECTED`, `THERMAL_EXCURSION_NORMALIZED`, `MAINTENANCE_WINDOW_STARTED`, `MAINTENANCE_WINDOW_ENDED` | monitoring | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/EdgeEventTypeResource.java` |
| `MaintenanceOriginResource` | `APP`, `BUTTON` | monitoring | `src/main/java/pe/edu/upc/ice/track/platform/monitoring/interfaces/rest/resources/MaintenanceOriginResource.java` |
| `ServicePriorityResource` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` | service-request | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/resources/ServicePriorityResource.java` |
| `ServiceStatusResource` | `PENDING`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELED` | service-request | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/resources/ServiceStatusResource.java` |
| `ServiceTypeResource` | `PREVENTIVE_MAINTENANCE`, `REPAIR` | service-request | `src/main/java/pe/edu/upc/ice/track/platform/service/request/interfaces/rest/resources/ServiceTypeResource.java` |

| `DevicePlatform` | `ANDROID`, `IOS`, `WEB` | notifications | `notifications/domain/model/valueobjects/DevicePlatform.java` |

## String properties with a documented value set

| Property | Values | Resource | Context |
|---|---|---|---|
| `role` | `OWNER_ROLE`, `TECHNICIAN_ROLE` | `AuthenticatedUserResource` | iam |
| `provider` | `LOCAL`, `GOOGLE` | `AuthenticatedUserResource` | iam |
| `code` | `REFRESH_TOKEN_RECENTLY_ROTATED`, `REFRESH_TOKEN_REPLAY_DETECTED`, `REFRESH_TOKEN_EXPIRED`, `REFRESH_TOKEN_REVOKED`, `REFRESH_TOKEN_INVALID` | `AuthErrorResource` | iam |
| `role` | `OWNER_ROLE`, `TECHNICIAN_ROLE` | `CurrentUserResource` | iam |
| `provider` | `LOCAL`, `GOOGLE` | `CurrentUserResource` | iam |
| `name` | `OWNER_ROLE`, `TECHNICIAN_ROLE` | `RoleResource` | iam |
| `role` | `OWNER_ROLE`, `TECHNICIAN_ROLE` | `UserResource` | iam |
| `provider` | `LOCAL`, `GOOGLE` | `UserResource` | iam |
| `card_type` | `MONITORED_EQUIPMENT`, `OPEN_ALERTS`, `ACTIVE_ORDERS`, `EQUIPMENT_STATUS` | `DashboardCardResource` | profiles |
| `unit` | `C`, `F` | `TemperatureRangeResource` | profiles |
| `area` | `LIMA_METROPOLITANA`, `CALLAO` | `AddressValidationResource` | assets |
| `new_status` | `UNPAIRED`, `PAIRED`, `REVOKED` | `ChangeDeviceStatusResource` | device |
| `type` | `TEMPERATURE_EXCURSION`, `DEVICE_OFFLINE` | `AlertResource` | monitoring |
| `severity` | `INFO`, `WARNING`, `CRITICAL` | `AlertResource` | monitoring |
| `status` | `OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `DISMISSED` | `AlertResource` | monitoring |
| `type` | `ALERT_STATUS_CHANGED` | `AlertStatusChangedStreamResource` | monitoring |
| `alert_type` | `TEMPERATURE_EXCURSION`, `DEVICE_OFFLINE` | `AlertStatusChangedStreamResource` | monitoring |
| `severity` | `INFO`, `WARNING`, `CRITICAL` | `AlertStatusChangedStreamResource` | monitoring |
| `previous_status` | `OPEN`, `ACKNOWLEDGED` | `AlertStatusChangedStreamResource` | monitoring |
| `status` | `OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `DISMISSED` | `AlertStatusChangedStreamResource` | monitoring |
| `type` | `THERMAL_EXCURSION_DETECTED`, `THERMAL_EXCURSION_NORMALIZED`, `MAINTENANCE_WINDOW_STARTED`, `MAINTENANCE_WINDOW_ENDED` | `EdgeEventResource` | monitoring |
| `result` | `ALERT_OPENED`, `ALERT_ALREADY_ACTIVE`, `ALERT_RESOLVED`, `NO_ACTIVE_ALERT`, `SUPPRESSED_BY_MAINTENANCE`, `MAINTENANCE_WINDOW_OPENED`, `MAINTENANCE_WINDOW_PROMOTED`, `MAINTENANCE_ALREADY_ACTIVE`, `MAINTENANCE_WINDOW_CLOSED`, `NO_ACTIVE_MAINTENANCE` | `EdgeEventResource` | monitoring |
| `origin` | `APP`, `BUTTON` | `MaintenanceWindowResource` | monitoring |
| `closure_reason` | `MANUAL_APP`, `MANUAL_BUTTON`, `INTERVENTION_COMPLETED`, `EXPIRED`, `SAFETY_LIMIT` | `MaintenanceWindowResource` | monitoring |
| `type` | `READING_RECORDED` | `ReadingRecordedStreamResource` | monitoring |
| `type` | `MAINTENANCE_REMINDER`, `TEMPERATURE_EXCURSION`, `DEVICE_OFFLINE`, `LOW_BATTERY`, `SENSOR_FAILURE`, `SERVICE_REQUEST_UPDATE`, `MAINTENANCE_WINDOW`, `UNLINKED_MAINTENANCE_WINDOW` | `NotificationResource` | notifications |
| `severity` | `INFO`, `WARNING`, `CRITICAL` | `NotificationResource` | notifications |
| `platform` | `ANDROID`, `IOS`, `WEB` | `RegisterDeviceTokenResource` | notifications |
| `type` | `MAINTENANCE_COMPLIANCE`, `EQUIPMENT_UPTIME`, `TECHNICIAN_PERFORMANCE`, `TEMPERATURE_EXCURSION` | `CreateReportResource` | reporting |
| `format` | `PDF`, `XLSX`, `CSV` | `CreateReportResource` | reporting |
| `type` | `MAINTENANCE_COMPLIANCE`, `EQUIPMENT_UPTIME`, `TECHNICIAN_PERFORMANCE`, `TEMPERATURE_EXCURSION` | `ReportResource` | reporting |
| `format` | `PDF`, `XLSX`, `CSV` | `ReportResource` | reporting |
| `status` | `PENDING`, `GENERATING`, `COMPLETED`, `FAILED` | `ReportResource` | reporting |
| `origin` | `APP`, `BUTTON` | `MaintenanceWindowLinkResource` | service-request |

`RoleResource.name` (`GET /api/v1/roles`) takes the values `OWNER_ROLE` and `TECHNICIAN_ROLE` (verified against a running backend).
