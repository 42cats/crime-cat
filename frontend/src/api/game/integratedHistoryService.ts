import { apiClient } from "@/lib/api";
import {
  IntegratedGameHistoryFilterRequest,
  IntegratedGameHistoryResponse,
  GameType,
} from "@/types/integratedGameHistory";

// 로그인 필요한 엔드포인트
const baseURI = "/game-histories";

// 서비스 객체
export const integratedHistoryService = {
  /**
   * 사용자의 통합 게임 기록 조회
   * 한 번의 요청으로 모든 게임 타입의 기록과 통계를 조회
   */
  getUserGameHistories: async (
    userId: string,
    filter: IntegratedGameHistoryFilterRequest
  ): Promise<IntegratedGameHistoryResponse> => {
    try {
      // 쿼리 파라미터 생성
      const params = new URLSearchParams();
      
      // 필터 파라미터 추가
      if (filter.gameType) params.append("gameType", filter.gameType);
      if (filter.keyword) params.append("keyword", filter.keyword);
      if (filter.isWin !== undefined) params.append("isWin", String(filter.isWin));
      if (filter.startDate) params.append("startDate", filter.startDate);
      if (filter.endDate) params.append("endDate", filter.endDate);
      if (filter.hasTheme !== undefined) params.append("hasTheme", String(filter.hasTheme));
      
      // 방탈출 전용 필터
      if (filter.successStatus) params.append("successStatus", filter.successStatus);
      if (filter.minClearTime !== undefined) params.append("minClearTime", String(filter.minClearTime));
      if (filter.maxClearTime !== undefined) params.append("maxClearTime", String(filter.maxClearTime));
      if (filter.minDifficulty !== undefined) params.append("minDifficulty", String(filter.minDifficulty));
      if (filter.maxDifficulty !== undefined) params.append("maxDifficulty", String(filter.maxDifficulty));
      if (filter.minFunRating !== undefined) params.append("minFunRating", String(filter.minFunRating));
      if (filter.maxFunRating !== undefined) params.append("maxFunRating", String(filter.maxFunRating));
      if (filter.minStoryRating !== undefined) params.append("minStoryRating", String(filter.minStoryRating));
      if (filter.maxStoryRating !== undefined) params.append("maxStoryRating", String(filter.maxStoryRating));
      
      // 정렬 및 페이징
      if (filter.sortBy) params.append("sortBy", filter.sortBy);
      if (filter.sortDirection) params.append("sortDirection", filter.sortDirection);
      if (filter.page !== undefined) params.append("page", String(filter.page));
      if (filter.size !== undefined) params.append("size", String(filter.size));
      
      const queryString = params.toString();
      const url = `${baseURI}/user/${userId}/integrated${queryString ? `?${queryString}` : ""}`;
      
      return await apiClient.get<IntegratedGameHistoryResponse>(url);
    } catch (error) {
      console.error("통합 게임 기록 조회 실패:", error);
      throw error;
    }
  },
  
  /**
   * 특정 게임 타입의 기록만 조회하는 헬퍼 메서드
   */
  getCrimeSceneHistories: async (
    userId: string,
    filter: Omit<IntegratedGameHistoryFilterRequest, 'gameType'>
  ) => {
    return integratedHistoryService.getUserGameHistories(userId, {
      ...filter,
      gameType: GameType.CRIMESCENE,
    });
  },
  
  getEscapeRoomHistories: async (
    userId: string,
    filter: Omit<IntegratedGameHistoryFilterRequest, 'gameType'>
  ) => {
    return integratedHistoryService.getUserGameHistories(userId, {
      ...filter,
      gameType: GameType.ESCAPE_ROOM,
    });
  },
};
