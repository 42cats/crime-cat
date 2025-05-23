import { Theme, ThemePage, ThemeType, Like } from "@/lib/types";
import { apiClient } from "@/lib/api";

const publicBaseURI = "/public/themes";
const baseURI = "/themes";

export const themesService = {
    getLatestThemes: async (
        category: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD"
    ): Promise<Theme[]> => {
        try {
            const response = await apiClient.get<ThemePage>(
                `${publicBaseURI}?limit=5&category=${category}&sort=LATEST`
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
        filters?: Partial<{
            priceMin: string;
            priceMax: string;
            playerMin: string;
            playerMax: string;
            timeMin: string;
            timeMax: string;
            difficultyMin: string;
            difficultyMax: string;
        }>
    ): Promise<ThemePage> => {
        try {
            const params = new URLSearchParams();

            params.append("limit", String(limit));
            params.append("page", String(page));
            params.append("category", category);

            if (sort.trim()) {
                params.append("sort", sort.trim());
            }

            if (keyword.trim()) {
                params.append("keyword", keyword.trim());
            }

            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value?.trim()) {
                        params.append(key, value.trim());
                    }
                });
            }

            const response = await apiClient.get<ThemePage>(
                `${publicBaseURI}?${params.toString()}`
            );
            return response;
        } catch (error) {
            console.error("테마 불러오기 실패:", error);
            throw error;
        }
    },

    getThemeById: async (id: string): Promise<Theme> => {
        try {
            const response = await apiClient.get<ThemeType>(
                `${publicBaseURI}/${id}`
            );
            return response.theme;
        } catch (error) {
            console.error(`테마 ID로 조회 실패:`, error);
            throw error;
        }
    },

    createTheme: async (data: FormData): Promise<Theme> => {
        try {
            return await apiClient.post<Theme>(`${baseURI}`, data);
        } catch (error) {
            console.error(`테마 생성 실패:`, error);
            throw error;
        }
    },

    updateTheme: async (id: string, data: FormData): Promise<Theme> => {
        try {
            return await apiClient.post<Theme>(`${baseURI}/${id}`, data);
        } catch (error) {
            console.error(`테마 수정 실패:`, error);
            throw error;
        }
    },

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
