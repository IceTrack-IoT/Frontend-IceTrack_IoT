import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AlertPolicyPort } from '@monitoring/application/ports/alert-policy.port';
import { AlertsPort } from '@monitoring/application/ports/alerts.port';
import { DashboardSummaryPort } from '@monitoring/application/ports/dashboard-summary.port';
import { DashboardSummaryApi } from '@monitoring/infrastructure/api/dashboard-summary-api';
import { MonitoringStreamPort } from '@monitoring/application/ports/monitoring-stream.port';
import { TelemetryPort } from '@monitoring/application/ports/telemetry.port';
import { AlertPolicyApi } from '@monitoring/infrastructure/api/alert-policy-api';
import { AlertsApi } from '@monitoring/infrastructure/api/alerts-api';
import { TelemetryApi } from '@monitoring/infrastructure/api/telemetry-api';
import { MonitoringStreamApi } from '@monitoring/infrastructure/streaming/monitoring-stream-api';
import { OwnerStreamFacade } from '@monitoring/application/facades/owner-stream.facade';
import { OwnerStreamSourcePort as DeviceOwnerStreamSourcePort } from '@device/application/ports/owner-stream-source.port';
import { OwnerStreamSourcePort as NotificationsOwnerStreamSourcePort } from '@notifications/application/ports/owner-stream-source.port';
import { OwnerStreamSourcePort as ReportingOwnerStreamSourcePort } from '@reporting/application/ports/owner-stream-source.port';

/**
 * Binds the Monitoring and Alerting application ports to their infrastructure adapters. The equipment
 * directory port is bound by Assets Management, which owns that data. The single owner event stream is
 * held here, so the owner stream source ports of Device Management, Notifications and Reporting are bound
 * to the facade that forwards their events; each of those contexts parses its own events.
 */
export function provideMonitoring(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AlertsPort, useExisting: AlertsApi },
    { provide: TelemetryPort, useExisting: TelemetryApi },
    { provide: AlertPolicyPort, useExisting: AlertPolicyApi },
    { provide: DashboardSummaryPort, useExisting: DashboardSummaryApi },
    { provide: MonitoringStreamPort, useExisting: MonitoringStreamApi },
    { provide: DeviceOwnerStreamSourcePort, useExisting: OwnerStreamFacade },
    { provide: NotificationsOwnerStreamSourcePort, useExisting: OwnerStreamFacade },
    { provide: ReportingOwnerStreamSourcePort, useExisting: OwnerStreamFacade },
  ]);
}
