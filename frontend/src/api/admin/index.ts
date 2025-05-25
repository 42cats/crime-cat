import { userManagementApi } from "./userManagement";
import { adminPointMonitoringService } from "./pointMonitoringService";

export const adminApi = {
    userManagement: userManagementApi,
    pointMonitoring: adminPointMonitoringService,
};

export * from './pointMonitoringService';
