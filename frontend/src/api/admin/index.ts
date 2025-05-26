import { userManagementApi } from "./userManagement";
import { adminPointMonitoringService } from "./pointMonitoringService";
import { themeAdsService } from "./themeAdsService";
import { permissionManagementService } from "./permissionManagement";

export const adminApi = {
    userManagement: userManagementApi,
    pointMonitoring: adminPointMonitoringService,
    themeAds: themeAdsService,
    permissionManagement: permissionManagementService,
};

export * from './pointMonitoringService';
export * from './themeAdsService';
export * from './permissionManagement';
