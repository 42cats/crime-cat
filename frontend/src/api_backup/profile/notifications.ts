import { apiClient } from "@/lib/api";
import { NotificationSettings } from "./types";

/**
 * 알림 설정 조회 API
 * @param userId 사용자 ID
 * @returns 사용자의 알림 설정 정보
 */
export const getNotificationSettings = async (
    userId: string
): Promise<NotificationSettings> => {
    try {
        const response = await apiClient.get<NotificationSettings>(
            `/web_user/${userId}/notifications/settings`
        );
        return response;
    } catch (error) {
        console.error("알림 설정 조회 실패:", error);
        throw error;
    }
};

/**
 * 이메일 알림 설정 업데이트 API
 * @param userId 사용자 ID
 * @param enabled 활성화 여부
 * @returns 업데이트된 알림 설정 정보
 */
export const updateEmailNotifications = async (
    userId: string,
    enabled: boolean
): Promise<NotificationSettings> => {
    try {
        const response = await apiClient.put<NotificationSettings>(
            `/web_user/${userId}/notifications/email`,
            {
                enabled,
            }
        );
        return response;
    } catch (error) {
        console.error("이메일 알림 설정 업데이트 실패:", error);
        throw error;
    }
};

/**
 * 디스코드 알림 설정 업데이트 API
 * @param userId 사용자 ID
 * @param enabled 활성화 여부
 * @returns 업데이트된 알림 설정 정보
 */
export const updateDiscordNotifications = async (
    userId: string,
    enabled: boolean
): Promise<NotificationSettings> => {
    try {
        const response = await apiClient.put<NotificationSettings>(
            `/web_user/${userId}/notifications/discord`,
            {
                enabled,
            }
        );
        return response;
    } catch (error) {
        console.error("디스코드 알림 설정 업데이트 실패:", error);
        throw error;
    }
};

/**
 * 모든 알림 설정 업데이트 API
 * @param userId 사용자 ID
 * @param settings 알림 설정 정보
 * @returns 업데이트된 알림 설정 정보
 */
export const updateAllNotificationSettings = async (
    userId: string,
    settings: NotificationSettings
): Promise<NotificationSettings> => {
    try {
        const response = await apiClient.put<NotificationSettings>(
            `/web_user/${userId}/notifications/settings`,
            settings
        );
        return response;
    } catch (error) {
        console.error("알림 설정 전체 업데이트 실패:", error);
        throw error;
    }
};
