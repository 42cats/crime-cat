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

const crimeSceneBaseURI = "/public/crime-scene-histories";
const escapeRoomBaseURI = "/public/escape-room-histories";

export const userGameHistoryService = {
    // 크라임씬 기록 개수 조회
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

    // 방탈출 기록 개수 조회
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