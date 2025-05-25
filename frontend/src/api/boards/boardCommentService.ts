import { apiClient } from "@/lib/api";
import { da } from "date-fns/locale";

export interface BoardComment {
    id: string;
    content: string;
    authorName: string;
    authorProfileImage?: string;
    authorId: string;
    createdAt: string;
    updatedAt?: string;
    likes: number;
    isLikedByCurrentUser: boolean;
    isOwnComment: boolean;
    isDeleted: boolean;
    isSecret: boolean;
    replies?: BoardComment[];
}

export interface CreateBoardCommentRequest {
    content: string;
    isSecret?: boolean;
    parentId?: number;
}

export interface UpdateBoardCommentRequest {
    content: string;
    isSecret?: boolean;
}

export interface BoardCommentListResponse {
    content: BoardComment[];
    totalElements: number;
    totalPages: number;
    number: number; // 현재 페이지 번호
    first: boolean;
    last: boolean;
    empty: boolean;
}

export const boardCommentService = {
    // 댓글 목록 조회
    getComments: async (
        postId: string,
        page: number = 0,
        size: number = 20
    ): Promise<BoardCommentListResponse> => {
        const response = await apiClient.get(
            `/public/post_comments/${postId}?page=${page}&size=${size}`
        );

        // Spring Page 형식 그대로 반환
        return response;
    },

    // 댓글 작성
    createComment: async (
        postId: string,
        data: CreateBoardCommentRequest
    ): Promise<BoardComment> => {
        const response = await apiClient.post(`/post_comments/${postId}`, data);
        return response;
    },

    // 댓글 수정
    updateComment: async (
        postId: string,
        commentId: string,
        data: UpdateBoardCommentRequest
    ): Promise<BoardComment> => {
        const response = await apiClient.put(
            `/post_comments/${commentId}`,
            data
        );
        return response;
    },

    // 댓글 삭제
    deleteComment: async (postId: string, commentId: string): Promise<void> => {
        await apiClient.delete(`/post_comments/${commentId}`);
    },

    // 대댓글 작성
    createReply: async (
        postId: string,
        parentCommentId: string,
        data: CreateBoardCommentRequest
    ): Promise<BoardComment> => {
        const response = await apiClient.post(`/post_comments/${postId}`, {
            ...data,
            parentId: parentCommentId,
        });
        return response;
    },

    // 댓글 좋아요 토글
    toggleCommentLike: async (commentId: string): Promise<void> => {
        await apiClient.post(`/post_comments/${commentId}/like`);
    },
};
