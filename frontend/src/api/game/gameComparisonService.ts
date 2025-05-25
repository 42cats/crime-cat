import { apiClient } from "@/lib/api";
import {
  GameComparisonRequest,
  GameComparisonResponse,
} from "@/types/gameComparison";
import { GameType } from "@/types/integratedGameHistory";

// 로그인 필요한 엔드포인트
const baseURI = "/game-histories";

// 서비스 객체
export const gameComparisonService = {
  /**
   * 게임 기록 비교
   * 여러 사용자가 공통으로 플레이하지 않은 테마 찾기
   */
  compareGameHistories: async (
    request: GameComparisonRequest
  ): Promise<GameComparisonResponse> => {
    try {
      const url = `${baseURI}/compare`;
      
      // 기본값 설정
      const requestData = {
        operatingOnly: true,
        sortBy: "RECOMMENDATION",
        page: 0,
        size: 20,
        ...request,
      };
      
      return await apiClient.post<GameComparisonResponse>(url, requestData);
    } catch (error) {
      console.error("게임 기록 비교 실패:", error);
      throw error;
    }
  },
  
  /**
   * 크라임씬 비교 헬퍼 메서드
   */
  compareCrimeSceneHistories: async (
    userIds: string[],
    params?: Omit<GameComparisonRequest, 'userIds' | 'gameType'>
  ) => {
    return gameComparisonService.compareGameHistories({
      userIds,
      gameType: GameType.CRIMESCENE,
      ...params,
    });
  },
  
  /**
   * 방탈출 비교 헬퍼 메서드
   */
  compareEscapeRoomHistories: async (
    userIds: string[],
    params?: Omit<GameComparisonRequest, 'userIds' | 'gameType'>
  ) => {
    return gameComparisonService.compareGameHistories({
      userIds,
      gameType: GameType.ESCAPE_ROOM,
      ...params,
    });
  },
};
