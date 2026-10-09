import { environment } from '@env/environment';
import { CreateDashboardConfigRequest } from '@profiles/infrastructure/api/create-dashboard-config.request';
import { Observable } from 'rxjs';
import { DashboardConfigResponse } from '@profiles/infrastructure/api/dashboard-config.response';
import { HttpClient } from '@angular/common/http';
import { AddDashboardCardRequest } from '@profiles/infrastructure/api/add-dashboard-card.request';
import { UpdateDashboardDefaultsRequest } from '@profiles/infrastructure/api/update-dashboard-defaults.request';

/**
 * This class provides methods to interact with the dashboard configuration API endpoints.
 * It allows creating dashboard configurations, toggling card visibility,
 * and updating dashboard defaults for a specific user.
 */
export class DashboardConfigApiEndpoint {

}
