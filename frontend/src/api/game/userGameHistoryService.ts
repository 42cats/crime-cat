import { apiClient } from "@/lib/api";

export interface UserGameHistoryDto {
    uuid: string;
    guildSnowflake: string;
    userSnowflake: string;
    guildName: string;
    playerName: string;
    isWin: boolean;
    createdAt: string;
    characterName: string;
    memo?: string;
    themeId: string;
    themeName: string;
}

export interface EscapeRoomHistoryDto {
    id: string;
    escapeRoomThemeId: string;
    escapeRoomThemeTitle: string;
    userId: string;
    userNickname: string;
    userAvatarUrl?: string;
    successStatus: 'SUCCESS' | 'FAIL' | 'PARTIAL';
    playDate: string;
    createdAt: string;
    isAuthor: boolean;
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

export interface UserProfileStatsResponse {
    creationCount: number;
    crimeSceneCount: number;
    escapeRoomCount: number;
    followerCount: number;
    followingCount: number;
}

const crimeSceneBaseURI = "/public/crime-scene-histories";
const escapeRoomBaseURI = "/public/escape-room-histories";
const profileStatsBaseURI = "/public/user-profile-stats";

export const userGameHistoryService = {
    // 사용자 프로필 통계 정보 조회 (통합)
    getUserProfileStats: async (userId: string): Promise<UserProfileStatsResponse> => {
        try {
            return await apiClient.get<UserProfileStatsResponse>(`${profileStatsBaseURI}/user/${userId}`);
        } catch (error) {
            console.error("사용자 프로필 통계 조회 실패:", error);
            return {
                creationCount: 0,
                crimeSceneCount: 0,
                escapeRoomCount: 0,
                followerCount: 0,
                followingCount: 0,
            };
        }
    },

    // 크라임씬 기록 개수 조회 (개별 - 백업용)
    getCrimeSceneHistoryCount: async (userId: string): Promise<number> => {
        try {
            return await apiClient.get<number>(`${crimeSceneBaseURI}/user/${userId}/count`);
        } catch (error) {
            console.error("크라임씬 기록 개수 조회 실패:", error);
            return 0;
        }
    },

    // 크라임씬 기록 목록 조회
    getCrimeSceneHistories: async (
        userId: string,
        page: number = 0,
        size: number = 20
    ): Promise<PageResponse<UserGameHistoryDto>> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
            });
            return await apiClient.get<PageResponse<UserGameHistoryDto>>(
                `${crimeSceneBaseURI}/user/${userId}?${params}`
            );
        } catch (error) {
            console.error("크라임씬 기록 목록 조회 실패:", error);
            throw error;
        }
    },

    // 방탈출 기록 개수 조회 (개별 - 백업용)
    getEscapeRoomHistoryCount: async (userId: string): Promise<number> => {
        try {
            return await apiClient.get<number>(`${escapeRoomBaseURI}/user/${userId}/count`);
        } catch (error) {
            console.error("방탈출 기록 개수 조회 실패:", error);
            return 0;
        }
    },

    // 방탈출 기록 목록 조회
    getEscapeRoomHistories: async (
        userId: string,
        page: number = 0,
        size: number = 20
    ): Promise<PageResponse<EscapeRoomHistoryDto>> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
            });
            return await apiClient.get<PageResponse<EscapeRoomHistoryDto>>(
                `${escapeRoomBaseURI}/user/${userId}?${params}`
            );
        } catch (error) {
            console.error("방탈출 기록 목록 조회 실패:", error);
            throw error;
        }
    },
};