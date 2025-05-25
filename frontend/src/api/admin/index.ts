import { userManagementApi } from "./userManagement";
import { adminPointMonitoringService } from "./pointMonitoringService";
import { themeAdsService } from "./themeAdsService";

export const adminApi = {
    userManagement: userManagementApi,
    pointMonitoring: adminPointMonitoringService,
    themeAds: themeAdsService,
};

export * from './pointMonitoringService';
export * from './themeAdsService';
