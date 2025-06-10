import { apiClient } from '@/lib/api';

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

/**
 * 사용자가 제작한 출간된 테마 목록 조회 (광고 가능한 테마만)
 */
export const getUserPublishedThemes = async (): Promise<UserTheme[]> => {
    try {
        // 실제 API 엔드포인트가 준비되면 아래 주석을 해제
        // const response = await apiClient.get<UserThemesResponse>('/themes/my-published');
        // return response.themes.filter(theme => theme.isPublished);
        
        // 현재는 빈 배열 반환 (출간된 테마가 없는 상태)
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([]);
            }, 500);
        });
    } catch (error) {
        console.error('사용자 테마 목록 조회 실패:', error);
        throw error;
    }
};