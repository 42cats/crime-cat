import { apiClient } from "@/lib/api";
import { Theme } from "@/lib/types";

// 백엔드 응답 타입
export interface ThemeAdvertisementResponse {
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
    theme?: {
        theme: Theme;
    };
}

// 프론트엔드용 타입
export interface ThemeAdvertisement {
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

export interface CreateThemeAdvertisementRequest {
    themeId: string;
    themeType: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD";
    startDate: string;
    endDate: string;
    displayOrder?: number;
}

export interface UpdateThemeAdvertisementRequest {
    startDate?: string;
    endDate?: string;
    displayOrder?: number;
    isActive?: boolean;
}

const adminBaseURI = "/admin/theme-ads";
const publicBaseURI = "/public/theme-ads";

export const themeAdsService = {
    // ================================
    // 공개 API (메인 페이지용)
    // ================================
    
    /**
     * 현재 활성화된 광고 목록 조회
     */
    getActiveAdvertisements: async (): Promise<ThemeAdvertisement[]> => {
        try {
            const response = await apiClient.get<ThemeAdvertisementResponse[]>(`${publicBaseURI}/active`);
            // 백엔드 응답 변환: GetGameThemeResponse 구조에서 실제 theme 추출
            return response.map(ad => ({
                ...ad,
                theme: ad.theme?.theme // theme.theme에서 실제 Theme 객체 추출
            }));
        } catch (error) {
            console.error("활성 광고 목록 불러오기 실패:", error);
            throw error;
        }
    },

    // ================================
    // 어드민 API
    // ================================
    
    /**
     * 모든 광고 목록 조회 (어드민)
     */
    getAllAdvertisements: async (): Promise<ThemeAdvertisement[]> => {
        try {
            const response = await apiClient.get<ThemeAdvertisementResponse[]>(adminBaseURI);
            // 백엔드 응답 변환: GetGameThemeResponse 구조에서 실제 theme 추출
            return response.map(ad => ({
                ...ad,
                theme: ad.theme?.theme // theme.theme에서 실제 Theme 객체 추출
            }));
        } catch (error) {
            console.error("전체 광고 목록 불러오기 실패:", error);
            throw error;
        }
    },

    /**
     * 광고 생성
     */
    createAdvertisement: async (data: CreateThemeAdvertisementRequest): Promise<ThemeAdvertisement> => {
        try {
            const response = await apiClient.post<ThemeAdvertisementResponse>(adminBaseURI, data);
            return {
                ...response,
                theme: response.theme?.theme
            };
        } catch (error) {
            console.error("광고 생성 실패:", error);
            throw error;
        }
    },

    /**
     * 광고 수정
     */
    updateAdvertisement: async (id: string, data: UpdateThemeAdvertisementRequest): Promise<ThemeAdvertisement> => {
        try {
            const response = await apiClient.put<ThemeAdvertisementResponse>(`${adminBaseURI}/${id}`, data);
            return {
                ...response,
                theme: response.theme?.theme
            };
        } catch (error) {
            console.error("광고 수정 실패:", error);
            throw error;
        }
    },

    /**
     * 광고 삭제
     */
    deleteAdvertisement: async (id: string): Promise<void> => {
        try {
            await apiClient.delete(`${adminBaseURI}/${id}`);
        } catch (error) {
            console.error("광고 삭제 실패:", error);
            throw error;
        }
    },

    /**
     * 광고 순서 변경 (헬퍼 함수)
     */
    reorderAdvertisements: async (advertisements: { id: string; displayOrder: number }[]): Promise<void> => {
        try {
            // 각 광고의 순서를 업데이트
            await Promise.all(
                advertisements.map(ad => 
                    themeAdsService.updateAdvertisement(ad.id, { displayOrder: ad.displayOrder })
                )
            );
        } catch (error) {
            console.error("광고 순서 변경 실패:", error);
            throw error;
        }
    },
};
