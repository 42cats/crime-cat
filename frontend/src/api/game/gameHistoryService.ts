import { apiClient } from "@/lib/api";
import {
    CheckPlayResponseDto,
    GameRecordRequest,
    GameRecordResponse,
    GameHistoryUpdateRequest,
} from "@/types/gameHistory";

/**
 * 게임 히스토리 관련 API 서비스
 */
export const gameHistoryService = {
    /**
     * 특정 테마를 플레이했는지 확인
     * @param gameThemeId 게임 테마 ID
     * @returns Promise<boolean> 플레이 여부
     */
    checkPlayTheme: async (gameThemeId: string): Promise<boolean> => {
        try {
            const response = await apiClient.get<CheckPlayResponseDto>(
                `/histories/check-played/${gameThemeId}`
            );
            return response.hasPlayed;
        } catch (error) {
            console.error("게임 플레이 여부 확인 중 오류:", error);
            return false;
        }
    },

    /**
     * 게임 기록 요청 전송
     * 백엔드에서 중복 체크와 요청 전송을 모두 처리
     * @param data 요청 데이터 (gameThemeId, message)
     * @returns Promise<GameRecordResponse> 요청 결과
     */
    requestGameRecord: async (
        data: GameRecordRequest
    ): Promise<GameRecordResponse> => {
        try {
            const response = await apiClient.post<GameRecordResponse>(
                `/histories/record/crime_scene/${data.gameThemeId}`,
                { message: data.message }
            );
            return response;
        } catch (error) {
            console.error("게임 기록 요청 중 오류:", error);
            throw error;
        }
    },

    /**
     * 크라임씬 게임 기록 수정 (테마 ID 기반)
     * @param themeId 테마 ID
     * @param data 수정할 데이터
     * @returns Promise<void>
     */
    updateCrimeSceneHistory: async (
        themeId: string,
        data: GameHistoryUpdateRequest
    ): Promise<void> => {
        try {
            await apiClient.patch(
                `/histories/crime_scene/theme/${themeId}`,
                data
            );
        } catch (error) {
            console.error("게임 기록 수정 중 오류:", error);
            throw error;
        }
    },
};
