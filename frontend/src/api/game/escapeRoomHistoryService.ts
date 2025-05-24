import { apiClient } from "@/lib/api";

export interface EscapeRoomHistoryRequest {
    escapeRoomThemeId: string;
    escapeRoomLocationId?: string;
    teamSize: number;
    successStatus: 'SUCCESS' | 'FAIL' | 'PARTIAL';
    clearTime?: number;
    hintCount?: number;
    difficultyRating?: number;
    funRating?: number;
    storyRating?: number;
    playDate: string;
    memo?: string;
    isSpoiler: boolean;
}

export interface EscapeRoomHistoryResponse {
    id: string;
    escapeRoomThemeId: string;
    escapeRoomThemeName: string;
    escapeRoomLocationId?: string;
    escapeRoomLocationName?: string;
    userId: string;
    userNickname: string;
    teamSize: number;
    successStatus: 'SUCCESS' | 'FAIL' | 'PARTIAL';
    clearTime?: number;
    hintCount?: number;
    difficultyRating?: number;
    funRating?: number;
    storyRating?: number;
    playDate: string;
    memo?: string;
    isSpoiler: boolean;
    isOwn: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    numberOfElements: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

const baseURI = "/api/v1/escape-room-histories";

export const escapeRoomHistoryService = {
    // 방탈출 기록 생성
    createHistory: async (data: EscapeRoomHistoryRequest): Promise<EscapeRoomHistoryResponse> => {
        try {
            return await apiClient.post<EscapeRoomHistoryResponse>(baseURI, data);
        } catch (error) {
            console.error("방탈출 기록 생성 실패:", error);
            throw error;
        }
    },

    // 방탈출 기록 수정
    updateHistory: async (historyId: string, data: EscapeRoomHistoryRequest): Promise<EscapeRoomHistoryResponse> => {
        try {
            return await apiClient.put<EscapeRoomHistoryResponse>(`${baseURI}/${historyId}`, data);
        } catch (error) {
            console.error("방탈출 기록 수정 실패:", error);
            throw error;
        }
    },

    // 방탈출 기록 삭제
    deleteHistory: async (historyId: string): Promise<void> => {
        try {
            await apiClient.delete(`${baseURI}/${historyId}`);
        } catch (error) {
            console.error("방탈출 기록 삭제 실패:", error);
            throw error;
        }
    },

    // 특정 기록 상세 조회
    getHistory: async (historyId: string): Promise<EscapeRoomHistoryResponse> => {
        try {
            return await apiClient.get<EscapeRoomHistoryResponse>(`${baseURI}/${historyId}`);
        } catch (error) {
            console.error("방탈출 기록 조회 실패:", error);
            throw error;
        }
    },

    // 내 방탈출 기록 목록 조회
    getMyHistories: async (page: number = 0, size: number = 20): Promise<PageResponse<EscapeRoomHistoryResponse>> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort: 'playDate,desc'
            });
            return await apiClient.get<PageResponse<EscapeRoomHistoryResponse>>(`${baseURI}/my?${params}`);
        } catch (error) {
            console.error("내 방탈출 기록 목록 조회 실패:", error);
            throw error;
        }
    },

    // 특정 테마의 공개 기록 목록 조회
    getThemeHistories: async (themeId: string, page: number = 0, size: number = 20): Promise<PageResponse<EscapeRoomHistoryResponse>> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort: 'playDate,desc'
            });
            return await apiClient.get<PageResponse<EscapeRoomHistoryResponse>>(`${baseURI}/theme/${themeId}?${params}`);
        } catch (error) {
            console.error("테마별 방탈출 기록 목록 조회 실패:", error);
            throw error;
        }
    },

    // 현재 사용자가 특정 테마를 플레이했는지 확인
    hasPlayedTheme: async (themeId: string): Promise<boolean> => {
        try {
            return await apiClient.get<boolean>(`${baseURI}/theme/${themeId}/played`);
        } catch (error) {
            console.error("테마 플레이 여부 확인 실패:", error);
            throw error;
        }
    },

    // 최근 방탈출 기록 조회
    getRecentHistories: async (limit: number = 10): Promise<EscapeRoomHistoryResponse[]> => {
        try {
            return await apiClient.get<EscapeRoomHistoryResponse[]>(`${baseURI}/recent?limit=${limit}`);
        } catch (error) {
            console.error("최근 방탈출 기록 조회 실패:", error);
            throw error;
        }
    }
};