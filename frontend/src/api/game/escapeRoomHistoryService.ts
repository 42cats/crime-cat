import { apiClient } from "@/lib/api";

export type SuccessStatus = "SUCCESS" | "FAIL" | "PARTIAL";

export interface EscapeRoomHistoryRequest {
    escapeRoomThemeId: string;
    escapeRoomLocationId?: string;
    teamSize: number;
    successStatus: SuccessStatus;
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
    escapeRoomThemeTitle: string;
    escapeRoomLocationId?: string;
    escapeRoomLocationName?: string;
    userId: string;
    userNickname: string;
    userAvatarUrl?: string;
    successStatus: SuccessStatus;
    clearTime?: number;
    formattedClearTime?: string;
    difficultyRating?: number;
    difficultyRatingStars?: number;
    teamSize: number;
    hintCount?: number;
    funRating?: number;
    funRatingStars?: number;
    storyRating?: number;
    storyRatingStars?: number;
    playDate: string;
    memo?: string;
    isSpoiler: boolean;
    createdAt: string;
    updatedAt: string;
    isAuthor: boolean;
    isOwn?: boolean;
}

export interface EscapeRoomHistoryStats {
    totalRecords: number;
    publicRecords: number;
    successCount: number;
    failCount: number;
    successRate: number;
    averageEscapeTime?: number;
    averageFeltDifficulty?: number;
    averageFeltDifficultyStars?: number;
    averageSatisfaction?: number;
    averageSatisfactionStars?: number;
    averageParticipants?: number;
    averageHintUsed?: number;
    averageFunRating?: number;
    averageFunRatingStars?: number;
    averageStoryRating?: number;
    averageStoryRatingStars?: number;
    fastestEscapeTime?: number;
    slowestEscapeTime?: number;
    formattedAverageEscapeTime?: string;
    formattedFastestTime?: string;
    formattedSlowestTime?: string;
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

const baseURI = "/escape-room-histories";
const publicBaseURI = "/public/escape-room-histories";

export const escapeRoomHistoryService = {
    // 방탈출 기록 생성
    createHistory: async (
        data: EscapeRoomHistoryRequest
    ): Promise<EscapeRoomHistoryResponse> => {
        try {
            return await apiClient.post<EscapeRoomHistoryResponse>(
                baseURI,
                data
            );
        } catch (error) {
            console.error("방탈출 기록 생성 실패:", error);
            throw error;
        }
    },

    // 방탈출 기록 수정
    updateHistory: async (
        historyId: string,
        data: EscapeRoomHistoryRequest
    ): Promise<EscapeRoomHistoryResponse> => {
        try {
            return await apiClient.put<EscapeRoomHistoryResponse>(
                `${baseURI}/${historyId}`,
                data
            );
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
    getHistory: async (
        historyId: string
    ): Promise<EscapeRoomHistoryResponse> => {
        try {
            return await apiClient.get<EscapeRoomHistoryResponse>(
                `${baseURI}/${historyId}`
            );
        } catch (error) {
            console.error("방탈출 기록 조회 실패:", error);
            throw error;
        }
    },

    // 내 방탈출 기록 목록 조회
    getMyHistories: async (
        page: number = 0,
        size: number = 20
    ): Promise<PageResponse<EscapeRoomHistoryResponse>> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort: "playDate,desc",
            });
            return await apiClient.get<PageResponse<EscapeRoomHistoryResponse>>(
                `${baseURI}/my?${params}`
            );
        } catch (error) {
            console.error("내 방탈출 기록 목록 조회 실패:", error);
            throw error;
        }
    },

    // 특정 테마의 기록 목록 조회 (공개)
    getThemeHistories: async (
        themeId: string,
        page: number = 0,
        size: number = 20
    ): Promise<PageResponse<EscapeRoomHistoryResponse>> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort: "playDate,desc",
            });
            return await apiClient.get<PageResponse<EscapeRoomHistoryResponse>>(
                `${publicBaseURI}/theme/${themeId}?${params}`
            );
        } catch (error) {
            console.error("테마별 방탈출 기록 목록 조회 실패:", error);
            throw error;
        }
    },

    // 현재 사용자가 특정 테마를 플레이했는지 확인
    hasPlayedTheme: async (themeId: string): Promise<boolean> => {
        try {
            return await apiClient.get<boolean>(
                `${baseURI}/theme/${themeId}/played`
            );
        } catch (error) {
            console.error("테마 플레이 여부 확인 실패:", error);
            throw error;
        }
    },

    // 최근 방탈출 기록 조회 (공개)
    getRecentHistories: async (
        limit: number = 10
    ): Promise<EscapeRoomHistoryResponse[]> => {
        try {
            return await apiClient.get<EscapeRoomHistoryResponse[]>(
                `${publicBaseURI}/recent?limit=${limit}`
            );
        } catch (error) {
            console.error("최근 방탈출 기록 조회 실패:", error);
            throw error;
        }
    },

    // 특정 테마의 통계 조회
    getThemeStatistics: async (
        themeId: string
    ): Promise<EscapeRoomHistoryStats> => {
        try {
            return await apiClient.get<EscapeRoomHistoryStats>(
                `${publicBaseURI}/theme/${themeId}/statistics`
            );
        } catch (error) {
            console.error("테마 통계 조회 실패:", error);
            throw error;
        }
    },
};
