import { apiClient } from "@/lib/api";
import { CheckPlayResponseDto, GameRecordRequest, GameRecordResponse, ExistingRequest } from "@/types/gameHistory";

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
   * 기존 기록 요청이 있는지 확인
   * TODO: Backend에 해당 API 엔드포인트가 없으므로 현재는 mock으로 구현
   * 추후 Backend API가 준비되면 실제 API로 대체 필요
   * @param gameThemeId 게임 테마 ID
   * @returns Promise<ExistingRequest | null> 기존 요청 정보 또는 null
   */
  checkExistingRequest: async (gameThemeId: string): Promise<ExistingRequest | null> => {
    // 임시 mock 구현 - 실제 API 엔드포인트 준비 시 대체 필요
    const mockRequests: ExistingRequest[] = [
      { gameThemeId: "theme1", status: "pending" },
      { gameThemeId: "theme2", status: "completed" },
    ];
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockRequests.find((req) => req.gameThemeId === gameThemeId) || null;
  },

  /**
   * 게임 기록 요청 전송
   * TODO: Backend에 해당 API 엔드포인트가 없으므로 현재는 mock으로 구현
   * 추후 Backend API가 준비되면 실제 API로 대체 필요
   * @param data 요청 데이터
   * @returns Promise<GameRecordResponse> 요청 결과
   */
  requestGameRecord: async (data: GameRecordRequest): Promise<GameRecordResponse> => {
    // 임시 mock 구현 - 실제 API 엔드포인트 준비 시 대체 필요
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (Math.random() > 0.1) {
      return {
        success: true,
        message: "요청이 성공적으로 전송되었습니다.",
      };
    } else {
      throw new Error("요청 전송 중 오류가 발생했습니다.");
    }
  },
};
