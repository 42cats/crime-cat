import { apiClient } from "@/lib/api";
import { Theme } from "@/lib/types";

// 새로운 큐 시스템 기반 광고 응답 타입 (실제 백엔드 응답에 맞춰 수정)
export interface QueueThemeAdvertisementResponse {
    id: string;
    userId: string;
    themeId: string;
    themeType: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD";
    themeName: string;
    requestedDays: number;
    remainingDays?: number;
    totalCost: number;
    requestedAt: string;
    startedAt?: string;
    expiresAt?: string;
    status: string;
    clickCount: number;
    exposureCount: number;
    // 호환성을 위한 추가 필드들
    displayOrder?: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    createdAt?: string;
    createdBy?: string;
    updatedAt?: string;
    updatedBy?: string;
    theme?: {
        theme: Theme;
    };
}

// 프론트엔드용 타입 (기존 ThemeAdvertisement와 호환)
export interface QueueThemeAdvertisement {
    id: string;
    themeId: string;
    themeType: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD";
    displayOrder: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
    createdBy: string;
    updatedAt?: string;
    updatedBy?: string;
    theme?: Theme;
}

const publicBaseURI = "/public/theme-ads";

export const queueThemeAdsService = {
    /**
     * 현재 활성화된 광고 목록 조회 (새로운 큐 시스템 기반)
     */
    getActiveAdvertisements: async (): Promise<QueueThemeAdvertisement[]> => {
        try {
            console.log("광고 API 호출 시작");
            const response = await apiClient.get<QueueThemeAdvertisementResponse[]>(`${publicBaseURI}/active-compatible`);
            console.log("광고 API 응답:", response);
            
            // 백엔드 응답을 GameAdsCarousel 호환 형식으로 변환
            const transformed = response.map(ad => ({
                id: ad.id,
                themeId: ad.themeId,
                themeType: ad.themeType,
                displayOrder: 0, // 임시값
                startDate: ad.startedAt || ad.requestedAt,
                endDate: ad.expiresAt || ad.requestedAt,
                isActive: ad.status === 'ACTIVE',
                createdAt: ad.requestedAt,
                createdBy: "system",
                theme: ad.theme?.theme // theme.theme에서 실제 Theme 객체 추출
            }));
            
            console.log("변환된 광고 데이터:", transformed);
            return transformed;
        } catch (error) {
            console.error("활성 광고 목록 불러오기 실패:", error);
            throw error;
        }
    },
    
    /**
     * 광고 클릭 기록
     */
    recordClick: async (requestId: string): Promise<void> => {
        try {
            await apiClient.post(`${publicBaseURI}/click/${requestId}`);
        } catch (error) {
            console.error("광고 클릭 기록 실패:", error);
            throw error;
        }
    },
    
    /**
     * 큐 상태 조회
     */
    getQueueStatus: async (): Promise<{
        activeCount: number;
        maxActiveSlots: number;
        queuedCount: number;
        estimatedWaitTime: string;
    }> => {
        try {
            const response = await apiClient.get(`${publicBaseURI}/queue-status`);
            return response;
        } catch (error) {
            console.error("큐 상태 조회 실패:", error);
            throw error;
        }
    },
};