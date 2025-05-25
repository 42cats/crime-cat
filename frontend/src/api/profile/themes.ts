import { apiClient } from "@/lib/api";

/**
 * 테마 관련 타입 정의
 */
export interface CrimesceneThemeSummeryDto {
  themeId: string;
  thumbNail: string;
  themeTitle: string;
  themePrice: number;
  themeMinPlayer: number;
  themeMaxPlayer: number;
}

export interface CrimesceneThemeSummeryListDto {
  themeList: CrimesceneThemeSummeryDto[];
}

/**
 * 사용자가 제작한 테마 목록 조회 API
 * @param userId 사용자 ID
 * @returns 사용자가 제작한 테마 목록
 */
export const getUserThemes = async (userId: string): Promise<CrimesceneThemeSummeryListDto> => {
  try {
    // 오타가 있을 수 있으니 'creator'로 수정 및 헤더 추가
    const response = await apiClient.get<CrimesceneThemeSummeryListDto>(`/public/themes/creator/${userId}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    return response;
  } catch (error) {
    // 오류 발생 시 빈 배열 반환
    console.error(`사용자 테마 조회 실패:`, error);
    return { themeList: [] };
  }
};

/**
 * 특정 테마 상세 정보 조회 API
 * @param themeId 테마 ID
 * @returns 테마 상세 정보
 */
export const getThemeDetail = async (themeId: string) => {
  try {
    const response = await apiClient.get(`/public/themes/${themeId}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    return response.theme;
  } catch (error) {
    console.error(`테마 상세 정보 조회 실패:`, error);
    throw error;
  }
};
