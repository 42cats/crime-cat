import { apiClient } from "@/lib/api";
import {
    Notification,
    NotificationPage,
    UnreadCountResponse,
    NotificationType,
    NotificationStatus,
} from "@/types/notification";

const baseURI = "/notifications";

// 게임 기록 액션용 DTO 타입 정의
export interface GameRecordAcceptDto {
    isWin: boolean;
    gameDate: string; // ISO string format
    characterName: string;
    ownerMemo?: string;
}

export interface GameRecordDeclineDto {
    declineMessage: string;
}

export const notificationService = {
    /**
     * 미읽은 알림 개수 조회
     */
    getUnreadCount: async (): Promise<number> => {
        try {
            const response = await apiClient.get<UnreadCountResponse>(
                `${baseURI}/unread/count`
            );
            return response.count;
        } catch (error) {
            console.error("미읽은 알림 개수 조회 실패:", error);
            throw error;
        }
    },

    /**
     * 최근 알림 목록 조회 (드롭다운용)
     */
    getRecentNotifications: async (
        limit: number = 10
    ): Promise<Notification[]> => {
        try {
            const response = await apiClient.get<NotificationPage>(
                `${baseURI}?page=0&size=${limit}`
            );
            return response.content;
        } catch (error) {
            console.error("최근 알림 목록 조회 실패:", error);
            throw error;
        }
    },

    /**
     * 알림 목록 조회 (페이지네이션)
     */
    getNotifications: async (
        page: number = 0,
        size: number = 20,
        types?: NotificationType[],
        statuses?: NotificationStatus[],
        keyword?: string,
        sort?: string[]
    ): Promise<NotificationPage> => {
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());
            
            if (types && types.length > 0) {
                types.forEach(type => params.append('types', type));
            }
            
            if (statuses && statuses.length > 0) {
                statuses.forEach(status => params.append('statuses', status));
            }
            
            if (keyword && keyword.trim()) {
                params.append('keyword', keyword.trim());
            }
            
            if (sort && sort.length > 0) {
                sort.forEach(s => params.append('sort', s));
            }
            
            return await apiClient.get<NotificationPage>(`${baseURI}?${params}`);
        } catch (error) {
            console.error("알림 목록 조회 실패:", error);
            throw error;
        }
    },

    /**
     * 특정 알림 조회
     */
    getNotification: async (id: string): Promise<Notification> => {
        try {
            return await apiClient.get<Notification>(`${baseURI}/${id}`);
        } catch (error) {
            console.error("알림 조회 실패:", error);
            throw error;
        }
    },

    /**
     * 알림 읽음 처리
     */
    markAsRead: async (id: string): Promise<void> => {
        try {
            await apiClient.put<void>(`${baseURI}/${id}/read`);
        } catch (error) {
            console.error("알림 읽음 처리 실패:", error);
            throw error;
        }
    },

    /**
     * 알림 액션 처리 (승인/거절 등)
     */
    processAction: async (
        id: string,
        action: string,
        data?: any
    ): Promise<void> => {
        try {
            await apiClient.post(`${baseURI}/${id}/${action}`, data);
        } catch (error) {
            console.error("알림 액션 처리 실패:", error);
            throw error;
        }
    },
};

// 게임 기록 액션 전용 함수
export const gameRecordActions = {
    /**
     * 게임 기록 요청 승인
     */
    accept: async (id: string, data: GameRecordAcceptDto): Promise<void> => {
        try {
            await apiClient.post(`${baseURI}/${id}/accept`, data);
        } catch (error) {
            console.error("게임 기록 승인 실패:", error);
            throw error;
        }
    },

    /**
     * 게임 기록 요청 거절
     */
    decline: async (id: string, data: GameRecordDeclineDto): Promise<void> => {
        try {
            await apiClient.post(`${baseURI}/${id}/decline`, data);
        } catch (error) {
            console.error("게임 기록 거절 실패:", error);
            throw error;
        }
    },
};
