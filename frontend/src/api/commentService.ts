import axios from "axios";
import { Comment, CommentRequest, CommentPage } from "@/types/comment";

const BASE_URL = "/api/v1/gamethemes";

export const commentService = {
    // 댓글 목록 조회 (최신순)
    getComments: async (
        gameThemeId: string,
        page = 0,
        size = 10
    ): Promise<CommentPage> => {
        const response = await axios.get(
            `${BASE_URL}/${gameThemeId}/comments`,
            {
                params: { page, size },
            }
        );
        return response.data;
    },

    // 댓글 목록 조회 (인기순)
    getPopularComments: async (
        gameThemeId: string,
        page = 0,
        size = 10
    ): Promise<CommentPage> => {
        const response = await axios.get(
            `${BASE_URL}/${gameThemeId}/comments/popular`,
            {
                params: { page, size },
            }
        );
        return response.data;
    },

    // 댓글 작성
    createComment: async (
        gameThemeId: string,
        commentData: CommentRequest
    ): Promise<Comment> => {
        const response = await axios.post(
            `${BASE_URL}/${gameThemeId}/comments`,
            commentData
        );
        return response.data;
    },

    // 댓글 수정
    updateComment: async (
        gameThemeId: string,
        commentId: string,
        commentData: CommentRequest
    ): Promise<Comment> => {
        const response = await axios.put(
            `${BASE_URL}/${gameThemeId}/comments/${commentId}`,
            commentData
        );
        return response.data;
    },

    // 댓글 삭제
    deleteComment: async (
        gameThemeId: string,
        commentId: string
    ): Promise<void> => {
        return axios.delete(`${BASE_URL}/${gameThemeId}/comments/${commentId}`);
    },

    // 댓글 좋아요
    likeComment: async (
        gameThemeId: string,
        commentId: string
    ): Promise<void> => {
        return axios.post(
            `${BASE_URL}/${gameThemeId}/comments/${commentId}/like`
        );
    },

    // 댓글 좋아요 취소
    unlikeComment: async (
        gameThemeId: string,
        commentId: string
    ): Promise<void> => {
        return axios.delete(
            `${BASE_URL}/${gameThemeId}/comments/${commentId}/like`
        );
    },

    // 사용자가 해당 게임을 플레이했는지 확인 (스포일러 표시 여부용)
    checkGamePlayed: async (gameThemeId: string): Promise<boolean> => {
        try {
            // 실제 API 엔드포인트는 프로젝트에 맞게 수정 필요
            const response = await axios.get(
                `/api/v1/histories/check-played/${gameThemeId}`
            );
            return response.data.hasPlayed;
        } catch (error) {
            console.error("게임 플레이 여부 확인 중 오류 발생:", error);
            return false;
        }
    },
};
