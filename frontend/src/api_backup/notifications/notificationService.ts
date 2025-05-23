import { apiClient } from "@/lib/api";

// 백엔드 AlarmType enum에 맞는 타입 정의
export type AlarmType = 'EMAIL' | 'DISCORD' | 'POST' | 'COMMENT' | 'COMMENT_COMMENT';

// 백엔드 DTO에 맞는 인터페이스
export interface NotificationSettingsResponse {
  email: boolean;
  discord: boolean;
  post: boolean;
  postComment: boolean;
  commentComment: boolean;
}

export interface NotificationSettingsRequest {
  email?: boolean;
  discord?: boolean;
  post?: boolean;
  comment?: boolean;
  commentComment?: boolean;
}

export const notificationService = {
  // 알림 설정 조회
  getNotificationSettings: async (userId: string): Promise<NotificationSettingsResponse> => {
    return await apiClient.get(`/web_user/${userId}/notifications/settings`);
  },

  // 특정 알림 타입 설정 업데이트
  updateNotificationSetting: async (
    userId: string, 
    type: AlarmType, 
    request: NotificationSettingsRequest
  ): Promise<NotificationSettingsResponse> => {
    return await apiClient.put(`/web_user/${userId}/notifications/${type}`, request);
  },

  // 이메일 알림 설정
  updateEmailNotification: async (userId: string, enabled: boolean): Promise<NotificationSettingsResponse> => {
    return await notificationService.updateNotificationSetting(userId, 'EMAIL', { email: enabled });
  },

  // 디스코드 알림 설정
  updateDiscordNotification: async (userId: string, enabled: boolean): Promise<NotificationSettingsResponse> => {
    return await notificationService.updateNotificationSetting(userId, 'DISCORD', { discord: enabled });
  },

  // 포스트 알림 설정
  updatePostNotification: async (userId: string, enabled: boolean): Promise<NotificationSettingsResponse> => {
    return await notificationService.updateNotificationSetting(userId, 'POST', { post: enabled });
  },

  // 댓글 알림 설정
  updateCommentNotification: async (userId: string, enabled: boolean): Promise<NotificationSettingsResponse> => {
    return await notificationService.updateNotificationSetting(userId, 'COMMENT', { comment: enabled });
  },

  // 대댓글 알림 설정
  updateCommentCommentNotification: async (userId: string, enabled: boolean): Promise<NotificationSettingsResponse> => {
    return await notificationService.updateNotificationSetting(userId, 'COMMENT_COMMENT', { commentComment: enabled });
  },
};
