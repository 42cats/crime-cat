import { apiClient } from '@/lib/api';
import { authService } from '@/api/auth';

// User theme interface for advertisement modal
export interface UserTheme {
    id: string;
    name: string;
    type: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD";
    isPublished: boolean;
}

export interface UserThemesResponse {
    themes: UserTheme[];
}

// Backend response interfaces
interface CrimesceneThemeSummeryDto {
    themeId: string;
    thumbNail: string;
    themeTitle: string;
    themePrice: number;
    themeMinPlayer: number;
    themeMaxPlayer: number;
}

interface CrimesceneThemeSummeryListDto {
    themeList: CrimesceneThemeSummeryDto[];
}

/**
 * 사용자가 제작한 출간된 테마 목록 조회 (광고 가능한 테마만)
 */
export const getUserPublishedThemes = async (): Promise<UserTheme[]> => {
    try {
        // 현재 로그인한 사용자 정보 가져오기
        const currentUser = await authService.getCurrentUser();
        
        if (!currentUser || !currentUser.id) {
            console.log('사용자 정보 없음 - 로그인 필요');
            return [];
        }

        console.log('사용자 테마 조회 시작, userId:', currentUser.id);

        // 사용자 테마 조회 API 호출
        const response = await apiClient.get<CrimesceneThemeSummeryListDto>(`/public/themes/creator/${currentUser.id}`);
        
        console.log('API 응답 받음:', response);

        // 응답 데이터 구조에 맞게 변환
        if (response && response.themeList && Array.isArray(response.themeList)) {
            const themes = response.themeList.map((theme: CrimesceneThemeSummeryDto) => ({
                id: theme.themeId,
                name: theme.themeTitle,
                type: 'CRIMESCENE' as const, // 현재 API는 크라임씬 테마만 반환
                isPublished: true // 공개 API에서 가져온 테마는 모두 출간된 것으로 간주
            }));
            
            console.log('변환된 테마 목록:', themes);
            return themes;
        }
        
        console.log('응답에 themeList가 없거나 배열이 아님');
        return [];
    } catch (error: any) {
        console.error('사용자 테마 목록 조회 실패:', error);
        
        // 구체적인 에러 정보 로깅 (디버깅용)
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            
            // 404 에러는 메이커 팀 소속이 아니거나 테마가 없는 경우
            if (error.response.status === 404) {
                console.log('404 에러 - 메이커 팀 소속이 아니거나 테마가 없음');
            }
            
            // 인증 오류
            if (error.response.status === 401) {
                console.log('401 에러 - 인증 필요');
            }
        }
        
        // 에러 발생 시에도 빈 배열 반환
        return [];
    }
};