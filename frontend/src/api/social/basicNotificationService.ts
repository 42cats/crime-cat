import { apiClient } from "@/lib/api";
import type { 
  BasicNotificationSettings, 
  NotificationSettingsResponse 
} from "@/types/profile";

export const basicNotificationService = {
  // 기본 알림 설정 조회
  getNotificationSettings: async (userId: string): Promise<NotificationSettingsResponse> => {
    const response = await apiClient.get(`/web_user/${userId}/notifications/settings`);
    return response.data;
  },

  // 이메일 알림 설정 업데이트
  updateEmailNotification: async (userId: string, enabled: boolean): Promise<NotificationSettingsResponse> => {
    const response = await apiClient.put(`/web_user/${userId}/notifications/email`, { enabled });
    return response.data;
  },

  // 디스코드 알림 설정 업데이트
  updateDiscordNotification: async (userId: string, enabled: boolean): Promise<NotificationSettingsResponse> => {
    const response = await apiClient.put(`/web_user/${userId}/notifications/discord`, { enabled });
    return response.data;
  },

  // 전체 알림 설정 업데이트
  updateAllNotificationSettings: async (
    userId: string, 
    settings: BasicNotificationSettings
  ): Promise<NotificationSettingsResponse> => {
    const response = await apiClient.put(`/web_user/${userId}/notifications/settings`, settings);
    return response.data;
  },
};
