import { apiClient } from "@/lib/api";
import { Comment, CommentRequest, CommentPage } from "@/types/comment";

export const commentService = {
    // 댓글 목록 조회 (정렬 옵션 적용)
    getComments: async (
        gameThemeId: string,
        page = 0,
        size = 10,
        sortType = "LATEST", // LATEST, OLDEST, LIKES 등 백엔드에서 지원하는 정렬 옵션
        isAuthenticated = false // 로그인 상태를 매개변수로 받음
    ): Promise<CommentPage> => {
        const basePath = isAuthenticated
            ? `/gamethemes/${gameThemeId}/comments`
            : `/public/gamethemes/${gameThemeId}/comments`;
        
        return apiClient.get(basePath, {
            params: { page, size, sortType },
        });
    },

    // 댓글 작성
    createComment: async (
        gameThemeId: string,
        commentData: CommentRequest
    ): Promise<Comment> => {
        // 로그인된 사용자만 실행 가능하므로 인증 경로 사용
        return apiClient.post(`/gamethemes/${gameThemeId}/comments`, commentData);
    },

    // 댓글 수정
    updateComment: async (
        gameThemeId: string,
        commentId: string,
        commentData: CommentRequest
    ): Promise<Comment> => {
        return apiClient.put(`/gamethemes/${gameThemeId}/comments/${commentId}`, commentData);
    },

    // 댓글 삭제
    deleteComment: async (
        gameThemeId: string,
        commentId: string
    ): Promise<void> => {
        return apiClient.delete(`/gamethemes/${gameThemeId}/comments/${commentId}`);
    },

    // 댓글 좋아요
    likeComment: async (
        gameThemeId: string,
        commentId: string
    ): Promise<void> => {
        return apiClient.post(`/gamethemes/${gameThemeId}/comments/${commentId}/like`);
    },

    // 댓글 좋아요 취소
    unlikeComment: async (
        gameThemeId: string,
        commentId: string
    ): Promise<void> => {
        return apiClient.delete(`/gamethemes/${gameThemeId}/comments/${commentId}/like`);
    },

    // 사용자가 해당 게임을 플레이했는지 확인 (스포일러 표시 여부용)
    checkGamePlayed: async (gameThemeId: string): Promise<boolean> => {
        try {
            // 실제 API 엔드포인트는 프로젝트에 맞게 수정 필요
            const response = await apiClient.get<{hasPlayed: boolean}>(`/histories/check-played/${gameThemeId}`);
            return response.hasPlayed;
        } catch (error) {
            console.error("게임 플레이 여부 확인 중 오류 발생:", error);
            return false;
        }
    },
};