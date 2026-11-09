# Real-Time Monitoring: IceTrack Web Application

## Purpose

This document describes how the Angular web application presents monitoring data and reacts to live telemetry and alert updates.

The frontend consumes monitoring information. It does not ingest telemetry, evaluate thresholds, calculate excursions, detect device silence, or manage Edge hardware behavior.

## Web capabilities

The web application supports:

- Dashboard metrics.
- Current temperature display.
- Last-known temperature display.
- Historical telemetry visualization.
- Recent alert visibility.
- Thermal alert visibility.
- Device-offline alert visibility.
- Alert acknowledgement.
- Alert dismissal with reason.
- Navigation from alert to equipment.
- Drafting a corrective service request from a critical alert.
- Manual dashboard refresh where supported.
- Real-time dashboard update rendering where streaming is available.

## Backend-authoritative behavior

The backend/edge is authoritative for:

- Telemetry ingestion.
- Aggregation.
- Temperature threshold evaluation.
- Excursion detection.
- Hysteresis behavior.
- Alert creation.
- Alert resolution.
- Device-offline detection.
- Alert severity.
- Alert lifecycle validation.
- Telemetry stream authorization and tenant isolation.
- Chain-of-cold calculations.

The frontend must not reproduce these algorithms as authoritative business logic.

## Data ownership

| Data | Owning context |
|---|---|
| Equipment identity, type, site, threshold | Assets Management |
| Paired device and credential lifecycle | Device Management |
| Telemetry, live measurements, alerts | Monitoring and Alerting |
| Corrective service request lifecycle | Service Request Management |
| Dashboard card layout/visibility | Profiles and Preferences Management |

## Dashboard

Documented dashboard data may include:

- Count of sites.
- Count of monitored equipment.
- Open alert count.
- Active service request count.
- Current temperature by sensor/equipment.
- Recent reports.

Dashboard card configuration belongs to user preferences.

The dashboard must:

- Load an initial data snapshot.
- Show loading/error/empty/populated states.
- Respect user-configured card order and visibility when available.
- Render timestamps/freshness when supplied.
- Allow manual refresh only if backend support exists.
- Reconcile live stream events with loaded state.

## Live updates

The architecture for live data should be:

```text
Monitoring view/store
  -> monitoring application use case
  -> monitoring streaming port
  -> monitoring infrastructure stream adapter
  -> configured backend streaming channel
  -> mapped application event
  -> store signal update
  -> UI rerender
```

Rules:

- Raw SSE/WebSocket transport stays in infrastructure.
- UI components do not open or manage raw streams.
- Use cases/stores expose domain-safe values.
- Avoid duplicate subscriptions.
- Clean up subscriptions correctly.
- Handle errors/reconnection according to existing project behavior.
- Do not invent a fallback transport without a documented API contract.
- Do not claim that a client-only update is authoritative if the backend action fails.

## Telemetry charts

Charts must:

- Clearly label measurement units.
- Clearly label time axes.
- Distinguish current and historical readings.
- Represent excursion periods with accessible labels/text, not color alone.
- Show a meaningful empty state when no device is paired or no telemetry exists.
- Avoid misleading interpolation when data gaps exist.
- Respect the project locale/date-time convention.
- Provide an accessible textual summary if the chart library is not fully accessible.

## Alert lifecycle

The UI can render and request documented alert transitions:

```text
OPEN
ACKNOWLEDGED
RESOLVED
DISMISSED
```

Actual allowed states must come from backend/application contracts.

For alert actions:

- Acknowledge records user intent through the application layer.
- Dismiss requires a reason when required by the contract.
- Resolution is shown from backend state; do not imply a manual resolution action if it is not supported.
- Failed actions must preserve or restore previous UI state and show translated feedback.
- Severity must be shown with text/icon plus color.
- Thermal and device-offline alerts must be distinguishable.

## Alert to service request

A critical alert can start a corrective service request draft:

```text
Alert detail/list
  -> user selects corrective service action
  -> application navigates with explicit draft data
  -> service request form receives equipment/site/REPAIR/alert context
  -> user confirms submission
  -> Service Request Management creates request
```

The frontend must never silently create a service request simply because an alert appears.
