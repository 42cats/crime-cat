import { Theme, ThemePage, ThemeType, Like, EscapeRoomThemeDetailType } from "@/lib/types";
import { apiClient } from "@/lib/api";

const publicBaseURI = "/public/themes";
const baseURI = "/themes";

// 테마 타입 매핑
const THEME_TYPE_MAPPING = {
    CRIMESCENE: "crimescene",
    ESCAPE_ROOM: "escape-room", 
    MURDER_MYSTERY: "murder-mystery",
    REALWORLD: "realworld"
} as const;

export const themesService = {
    // ================================
    // 공통 조회 기능
    // ================================
    
    // 방탈출 테마 상세 조회
    getEscapeRoomTheme: async (id: string): Promise<EscapeRoomThemeDetailType> => {
        try {
            const response = await apiClient.get(`${publicBaseURI}/escape-room/${id}`);
            return response.theme;
        } catch (error) {
            console.error("방탈출 테마 상세 불러오기 실패:", error);
            throw error;
        }
    },
    
    getLatestThemes: async (
        category: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD"
    ): Promise<Theme[]> => {
        try {
            const themeEndpoint = THEME_TYPE_MAPPING[category];
            const response = await apiClient.get<ThemePage>(
                `${publicBaseURI}/${themeEndpoint}?limit=5&sort=LATEST`
            );
            return response.themes;
        } catch (error) {
            console.error("최신 테마 불러오기 실패:", error);
            throw error;
        }
    },

    getThemes: async (
        category: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD",
        limit: number,
        page: number,
        sort: string,
        keyword: string,
        filters?: any
    ): Promise<ThemePage> => {
        try {
            const themeEndpoint = THEME_TYPE_MAPPING[category];
            const params = new URLSearchParams();

            params.append("limit", String(limit));
            params.append("page", String(page));

            if (sort.trim()) {
                params.append("sort", sort.trim());
            }

            if (keyword.trim()) {
                params.append("keyword", keyword.trim());
            }

            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    // hasPlayed가 "all"인 경우 파라미터에 추가하지 않음
                    if (key === "hasPlayed" && value === "all") {
                        return;
                    }
                    
                    if (Array.isArray(value) && value.length > 0) {
                        params.append(key, value.join(","));
                    } else if (typeof value === "string" && value.trim()) {
                        params.append(key, value.trim());
                    }
                });
            }

            const response = await apiClient.get<ThemePage>(
                `${publicBaseURI}/${themeEndpoint}?${params.toString()}`
            );
            return response;
        } catch (error) {
            console.error("테마 불러오기 실패:", error);
            throw error;
        }
    },

    getThemeById: async (id: string, category?: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD"): Promise<Theme> => {
        try {
            let endpoint = `${publicBaseURI}/${id}`;
            
            // 카테고리가 주어진 경우 전용 엔드포인트 사용
            if (category) {
                const themeEndpoint = THEME_TYPE_MAPPING[category];
                endpoint = `${publicBaseURI}/${themeEndpoint}/${id}`;
            }
            
            const response = await apiClient.get<ThemeType>(endpoint);
            return response.theme;
        } catch (error) {
            console.error(`테마 ID로 조회 실패:`, error);
            throw error;
        }
    },

    // ================================
    // 크라임씬 테마 전용
    // ================================
    
    createCrimesceneTheme: async (data: FormData): Promise<Theme> => {
        try {
            return await apiClient.post<Theme>(`${baseURI}/crimescene`, data);
        } catch (error) {
            console.error(`크라임씬 테마 생성 실패:`, error);
            throw error;
        }
    },

    updateCrimesceneTheme: async (id: string, data: FormData): Promise<Theme> => {
        try {
            return await apiClient.post<Theme>(`${baseURI}/crimescene/${id}`, data);
        } catch (error) {
            console.error(`크라임씬 테마 수정 실패:`, error);
            throw error;
        }
    },

    // ================================
    // 방탈출 테마 전용
    // ================================
    
    getEscapeRoomThemes: async (params: {
        type: string;
        page: number;
        size: number;
        sort: string;
        keyword?: string;
        filters?: any;
    }): Promise<ThemePage> => {
        try {
            const queryParams = new URLSearchParams();
            
            // 기본 파라미터
            queryParams.append("limit", String(params.size));
            queryParams.append("page", String(params.page));
            queryParams.append("sort", params.sort);
            
            // 키워드 검색 (지역 검색 포함)
            if (params.keyword?.trim()) {
                queryParams.append("keyword", params.keyword.trim());
            }
            
            // 필터 파라미터 변환
            if (params.filters) {
                const filters = params.filters;
                
                // 기본 범위 필터
                if (filters.playerMin) queryParams.append("playerMin", filters.playerMin);
                if (filters.playerMax) queryParams.append("playerMax", filters.playerMax);
                if (filters.priceMin) queryParams.append("priceMin", filters.priceMin);
                if (filters.priceMax) queryParams.append("priceMax", filters.priceMax);
                if (filters.playtimeMin) queryParams.append("playtimeMin", filters.playtimeMin);
                if (filters.playtimeMax) queryParams.append("playtimeMax", filters.playtimeMax);
                if (filters.difficultyMin) queryParams.append("difficultyMin", filters.difficultyMin);
                if (filters.difficultyMax) queryParams.append("difficultyMax", filters.difficultyMax);
                
                // 방탈출 전용 필터
                if (filters.horrorMin) queryParams.append("horrorLevelMin", filters.horrorMin);
                if (filters.horrorMax) queryParams.append("horrorLevelMax", filters.horrorMax);
                if (filters.deviceMin) queryParams.append("deviceRatioMin", filters.deviceMin);
                if (filters.deviceMax) queryParams.append("deviceRatioMax", filters.deviceMax);
                if (filters.activityMin) queryParams.append("activityLevelMin", filters.activityMin);
                if (filters.activityMax) queryParams.append("activityLevelMax", filters.activityMax);
                
                // 운영 상태
                if (filters.isOperating && filters.isOperating !== "all") {
                    queryParams.append("isOperating", filters.isOperating === "operating" ? "true" : "false");
                }
                
                // 플레이 여부
                if (filters.hasPlayed && filters.hasPlayed !== "all") {
                    queryParams.append("hasPlayed", filters.hasPlayed === "true" ? "true" : "false");
                }
                
                // 지역 검색은 keyword로 처리
                if (filters.location?.trim() && !params.keyword) {
                    queryParams.append("keyword", filters.location.trim());
                }
            }
            
            const response = await apiClient.get<ThemePage>(
                `${publicBaseURI}/escape-room?${queryParams.toString()}`
            );
            return response;
        } catch (error) {
            console.error("방탈출 테마 목록 불러오기 실패:", error);
            throw error;
        }
    },
    
    createEscapeRoomTheme: async (data: FormData): Promise<Theme> => {
        try {
            return await apiClient.post<Theme>(`${baseURI}/escape-room`, data);
        } catch (error) {
            console.error(`방탈출 테마 생성 실패:`, error);
            throw error;
        }
    },

    updateEscapeRoomTheme: async (id: string, data: FormData): Promise<Theme> => {
        try {
            return await apiClient.post<Theme>(`${baseURI}/escape-room/${id}`, data);
        } catch (error) {
            console.error(`방탈출 테마 수정 실패:`, error);
            throw error;
        }
    },

    // ================================
    // 머더미스터리 테마 전용
    // ================================
    
    createMurderMysteryTheme: async (data: FormData): Promise<Theme> => {
        try {
            return await apiClient.post<Theme>(`${baseURI}/murder-mystery`, data);
        } catch (error) {
            console.error(`머더미스터리 테마 생성 실패:`, error);
            throw error;
        }
    },

    updateMurderMysteryTheme: async (id: string, data: FormData): Promise<Theme> => {
        try {
            return await apiClient.post<Theme>(`${baseURI}/murder-mystery/${id}`, data);
        } catch (error) {
            console.error(`머더미스터리 테마 수정 실패:`, error);
            throw error;
        }
    },

    // ================================
    // 리얼월드 테마 전용
    // ================================
    
    createRealWorldTheme: async (data: FormData): Promise<Theme> => {
        try {
            return await apiClient.post<Theme>(`${baseURI}/realworld`, data);
        } catch (error) {
            console.error(`리얼월드 테마 생성 실패:`, error);
            throw error;
        }
    },

    updateRealWorldTheme: async (id: string, data: FormData): Promise<Theme> => {
        try {
            return await apiClient.post<Theme>(`${baseURI}/realworld/${id}`, data);
        } catch (error) {
            console.error(`리얼월드 테마 수정 실패:`, error);
            throw error;
        }
    },

    // ================================
    // 통합 생성/수정 함수 (테마 타입에 따라 분기)
    // ================================
    
    createTheme: async (data: FormData, themeType: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD"): Promise<Theme> => {
        switch (themeType) {
            case "CRIMESCENE":
                return themesService.createCrimesceneTheme(data);
            case "ESCAPE_ROOM":
                return themesService.createEscapeRoomTheme(data);
            case "MURDER_MYSTERY":
                return themesService.createMurderMysteryTheme(data);
            case "REALWORLD":
                return themesService.createRealWorldTheme(data);
            default:
                throw new Error(`지원하지 않는 테마 타입: ${themeType}`);
        }
    },

    updateTheme: async (id: string, data: FormData, themeType: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD"): Promise<Theme> => {
        switch (themeType) {
            case "CRIMESCENE":
                return themesService.updateCrimesceneTheme(id, data);
            case "ESCAPE_ROOM":
                return themesService.updateEscapeRoomTheme(id, data);
            case "MURDER_MYSTERY":
                return themesService.updateMurderMysteryTheme(id, data);
            case "REALWORLD":
                return themesService.updateRealWorldTheme(id, data);
            default:
                throw new Error(`지원하지 않는 테마 타입: ${themeType}`);
        }
    },

    // ================================
    // 공통 기능들
    // ================================

    deleteTheme: async (id: string): Promise<void> => {
        try {
            await apiClient.delete(`${baseURI}/${id}`);
        } catch (error) {
            console.error(`테마 삭제 실패:`, error);
            throw error;
        }
    },

    getLikeStatus: async (id: string): Promise<boolean> => {
        try {
            const response = await apiClient.get<Like>(
                `${baseURI}/${id}/like/status`
            );
            return response.status;
        } catch (error) {
            console.error(`좋아요 조회 실패:`, error);
            throw error;
        }
    },

    setLike: async (id: string): Promise<void> => {
        try {
            await apiClient.post<void>(`${baseURI}/${id}/like`);
        } catch (error) {
            console.error(`좋아요 실패:`, error);
            throw error;
        }
    },

    cancelLike: async (id: string): Promise<void> => {
        try {
            await apiClient.delete<void>(`${baseURI}/${id}/like`);
        } catch (error) {
            console.error(`좋아요 취소 실패:`, error);
            throw error;
        }
    },
};
