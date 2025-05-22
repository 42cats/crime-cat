import { apiClient } from "@/lib/api";

export interface UserPostCommentDto {
    id: string;
    content: string;
    isPrivate: boolean; // 서버 DTO의 isPrivate
    authorNickname: string; // 서버 DTO의 authorNickname
    authorAvatarUrl: string | null; // 서버 DTO의 authorAvatarUrl
    authorId: string;
    createdAt: string;
    updatedAt: string;
    isOwnComment: boolean; // 백엔드에서 계산하여 제공하는 값
    isDeleted: boolean;
    parentId: string | null;
    replies: UserPostCommentDto[];
    isVisible: boolean; // 서버 DTO의 isVisible
}

export interface UserPostCommentRequest {
    content: string;
    isPrivate: boolean; // 서버 DTO의 isPrivate로 변경
    parentId?: string;
}

export interface UserPostCommentPage {
    content: UserPostCommentDto[];
    totalElements: number;
    totalPages: number;
    last: boolean;
    number: number;
    size: number;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

class PostCommentService {
    // 포스트 댓글 목록 조회 (정렬 옵션 적용)
    async getComments(
        postId: string,
        page = 0,
        size = 10,
        sortType = "LATEST" // LATEST, OLDEST 등 백엔드에서 지원하는 정렬 옵션
    ): Promise<UserPostCommentPage> {
        try {
            return await apiClient.get<UserPostCommentPage>(
                `/public/user-posts/${postId}/comments`,
                {
                    params: { page, size, sort: sortType }
                }
            );
        } catch (error) {
            console.error("포스트 댓글 조회 실패:", error);
            // 오류 발생 시 빈 결과 반환
            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                last: true,
                number: 0,
                size: 0,
                first: true,
                numberOfElements: 0,
                empty: true
            };
        }
    }

    // 댓글 작성
    async createComment(
        postId: string,
        commentData: UserPostCommentRequest
    ): Promise<UserPostCommentDto> {
        try {
            return await apiClient.post<UserPostCommentDto>(
                `/user-posts/${postId}/comments`,
                commentData
            );
        } catch (error) {
            console.error("포스트 댓글 작성 실패:", error);
            throw error;
        }
    }

    // 댓글 수정
    async updateComment(
        commentId: string,
        commentData: UserPostCommentRequest
    ): Promise<UserPostCommentDto> {
        try {
            return await apiClient.put<UserPostCommentDto>(
                `/user-posts/comments/${commentId}`,
                commentData
            );
        } catch (error) {
            console.error("포스트 댓글 수정 실패:", error);
            throw error;
        }
    }

    // 댓글 삭제
    async deleteComment(commentId: string): Promise<void> {
        try {
            await apiClient.delete(`/user-posts/comments/${commentId}`);
        } catch (error) {
            console.error("포스트 댓글 삭제 실패:", error);
            throw error;
        }
    }

    // 특정 댓글의 답글 목록 조회
    async getReplies(commentId: string): Promise<UserPostCommentDto[]> {
        try {
            return await apiClient.get<UserPostCommentDto[]>(
                `/user-posts/comments/${commentId}/replies`
            );
        } catch (error) {
            console.error("포스트 댓글 답글 조회 실패:", error);
            return [];
        }
    }
}

export const postCommentService = new PostCommentService();

// 기존 export와의 호환성을 위해 유지
export const userPostCommentService = postCommentService;
