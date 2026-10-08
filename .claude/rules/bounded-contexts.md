## Web role boundaries

The Angular web application is exclusively for `OWNER_ROLE`.

### OWNER_ROLE

Owners may use all documented owner web capabilities:

- Dashboard and dashboard preferences.
- Sites and refrigeration equipment.
- Equipment temperature thresholds.
- Monitoring-device pairing and device credential actions.
- Dashboard metrics, telemetry, and alerts.
- Service request creation, tracking, cancellation, and technician assignment.
- Technician profile consultation for assignment.
- Intervention history.
- Service reviews.
- Notifications.
- Reports.

### TECHNICIAN_ROLE

Technicians are registered IceTrack users, but they are not web-platform users.

Technicians:

- May authenticate through IAM.
- Must be redirected to `iam/technician-redirect`.
- Must not access any owner bounded-context route.
- Must not receive owner navigation or owner shell components.
- Must not load owner context stores, APIs, dashboard cards, notification center data, assets, telemetry, alerts, reports, or service request data.
- Must use the mobile application for technician field workflows.

The technician redirect page belongs to IAM because it is an authorization-routing result, not a technician web bounded context.

### Technician data shown to owners

The owner web application may display technician information only as read-only data necessary for assignment and service history, such as:

- Name.
- Specialty.
- Certification number.
- Average rating, when available.
- Service history, when provided by backend contracts.

This is not technician self-service web access and must not result in technician web modules.
