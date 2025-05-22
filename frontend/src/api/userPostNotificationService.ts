import { apiClient } from "@/lib/api";

export interface UserPostNotificationSettings {
    userPostNew: boolean;
    userPostComment: boolean;
    userPostCommentReply: boolean;
}

export interface BasicNotificationSettings {
    email: boolean;
    discord: boolean;
}

export const userPostNotificationService = {
    // 유저 포스트 알림 설정 조회
    getUserPostNotificationSettings: async (
        userId: string
    ): Promise<UserPostNotificationSettings> => {
        const response = await apiClient.get(
            `/web_user/${userId}/notifications/userpost`
        );
        return response.data;
    },

    // 유저 포스트 알림 설정 업데이트
    updateUserPostNotificationSettings: async (
        userId: string,
        settings: Partial<UserPostNotificationSettings>
    ): Promise<UserPostNotificationSettings> => {
        const response = await apiClient.put(
            `/web_user/${userId}/notifications/userpost`,
            settings
        );
        return response.data;
    },

    // 기본 알림 설정 조회
    getBasicNotificationSettings: async (userId: string): Promise<BasicNotificationSettings> => {
        const response = await apiClient.get(`/web_user/${userId}/notifications/settings`);
        return response.data;
    },

    // 이메일 알림 설정 업데이트
    updateEmailNotification: async (userId: string, enabled: boolean): Promise<BasicNotificationSettings> => {
        const response = await apiClient.put(`/web_user/${userId}/notifications/email`, { enabled });
        return response.data;
    },

    // 디스코드 알림 설정 업데이트
    updateDiscordNotification: async (userId: string, enabled: boolean): Promise<BasicNotificationSettings> => {
        const response = await apiClient.put(`/web_user/${userId}/notifications/discord`, { enabled });
        return response.data;
    },
};
