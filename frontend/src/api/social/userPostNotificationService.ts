import { apiClient } from "@/lib/api";
import type { 
  UserPostNotificationSettings, 
  UserPostNotificationResponse 
} from "@/types/profile";

export const userPostNotificationService = {
  // 유저 포스트 알림 설정 조회
  getUserPostNotificationSettings: async (
    userId: string
  ): Promise<UserPostNotificationResponse> => {
    const response = await apiClient.get(
      `/web_user/${userId}/notifications/userpost`
    );
    return response.data;
  },

  // 유저 포스트 알림 설정 업데이트
  updateUserPostNotificationSettings: async (
    userId: string,
    settings: Partial<UserPostNotificationSettings>
  ): Promise<UserPostNotificationResponse> => {
    const response = await apiClient.put(
      `/web_user/${userId}/notifications/userpost`,
      settings
    );
    return response.data;
  },
};
