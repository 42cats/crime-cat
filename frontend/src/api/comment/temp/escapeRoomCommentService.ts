import { apiClient } from "@/lib/api";
import { SuccessStatus } from "../game/escapeRoomHistoryService";

export interface EscapeRoomCommentCreateDto {
    escapeRoomThemeId: string;
    escapeRoomHistoryId?: string;
    content: string;
    hasSpoiler: boolean;
    parentCommentId?: string;
}

export interface EscapeRoomCommentUpdateDto {
    content: string;
    hasSpoiler?: boolean;
}

export interface CommentResponse {
    id: string;
    content: string;
    authorName: string;
    authorProfileImage?: string;
    authorId: string;
    createdAt: string;
    updatedAt: string;
    isSpoiler: boolean;
    likes: number;
    isLikedByCurrentUser: boolean;
    isOwnComment: boolean;
    isDeleted: boolean;
    replies?: CommentResponse[];
    
    // 추가 정보 (기존 필드 유지)
    escapeRoomThemeId?: string;
    escapeRoomThemeName?: string;
    escapeRoomHistoryId?: string;
    isGameHistoryComment?: boolean;
    canEdit?: boolean;
    canView?: boolean;
    hiddenMessage?: string;
    // 관련 게임 기록 정보 (게임 기록 기반 댓글일 경우)
    gameHistoryInfo?: {
        teamSize: number;
        successStatus: SuccessStatus;
        clearTime?: number;
        formattedClearTime?: string;
        hintCount?: number;
        difficultyRating?: number;
        funRating?: number;
        storyRating?: number;
        playDate: string;
    };
}

export interface EscapeRoomCommentStatsDto {
    totalComments: number;
    generalComments: number;
    spoilerComments: number;
}

export interface PageResponseDto<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    numberOfElements: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

const baseURI = "/escape-room-comments";
const publicBaseURI = "/public/escape-room-comments";

export const escapeRoomCommentService = {
    // 댓글 작성
    createComment: async (
        data: EscapeRoomCommentCreateDto
    ): Promise<CommentResponse> => {
        try {
            return await apiClient.post<CommentResponse>(
                baseURI,
                data
            );
        } catch (error) {
            console.error("방탈출 댓글 작성 실패:", error);
            throw error;
        }
    },

    // 테마별 댓글 목록 조회 (공개)
    getCommentsByTheme: async (
        themeId: string,
        page: number = 0,
        size: number = 20,
        spoilerOnly?: boolean
    ): Promise<PageResponseDto<CommentResponse>> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort: "createdAt,desc",
            });

            if (spoilerOnly !== undefined) {
                params.append("spoilerOnly", spoilerOnly.toString());
            }

            return await apiClient.get<
                PageResponseDto<CommentResponse>
            >(`${publicBaseURI}/theme/${themeId}?${params}`);
        } catch (error) {
            console.error("테마별 댓글 목록 조회 실패:", error);
            throw error;
        }
    },

    // 댓글 수정
    updateComment: async (
        commentId: string,
        data: EscapeRoomCommentUpdateDto
    ): Promise<CommentResponse> => {
        try {
            return await apiClient.put<CommentResponse>(
                `${baseURI}/${commentId}`,
                data
            );
        } catch (error) {
            console.error("댓글 수정 실패:", error);
            throw error;
        }
    },

    // 댓글 삭제
    deleteComment: async (commentId: string): Promise<void> => {
        try {
            await apiClient.delete(`${baseURI}/${commentId}`);
        } catch (error) {
            console.error("댓글 삭제 실패:", error);
            throw error;
        }
    },

    // 댓글 상세 조회 (공개)
    getComment: async (
        commentId: string
    ): Promise<CommentResponse> => {
        try {
            return await apiClient.get<CommentResponse>(
                `${publicBaseURI}/${commentId}`
            );
        } catch (error) {
            console.error("댓글 상세 조회 실패:", error);
            throw error;
        }
    },

    // 사용자별 댓글 목록 조회
    getCommentsByUser: async (
        userId: string,
        page: number = 0,
        size: number = 20
    ): Promise<PageResponseDto<CommentResponse>> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort: "createdAt,desc",
            });

            return await apiClient.get<
                PageResponseDto<CommentResponse>
            >(`${baseURI}/user/${userId}?${params}`);
        } catch (error) {
            console.error("사용자별 댓글 목록 조회 실패:", error);
            throw error;
        }
    },

    // 테마 댓글 통계 조회 (공개)
    getCommentStats: async (
        themeId: string
    ): Promise<EscapeRoomCommentStatsDto> => {
        try {
            return await apiClient.get<EscapeRoomCommentStatsDto>(
                `${publicBaseURI}/theme/${themeId}/stats`
            );
        } catch (error) {
            console.error("테마 댓글 통계 조회 실패:", error);
            throw error;
        }
    },

    // 댓글 좋아요
    likeComment: async (commentId: string): Promise<void> => {
        try {
            await apiClient.post(`${baseURI}/${commentId}/like`);
        } catch (error) {
            console.error("댓글 좋아요 실패:", error);
            throw error;
        }
    },

    // 댓글 좋아요 취소
    unlikeComment: async (commentId: string): Promise<void> => {
        try {
            await apiClient.delete(`${baseURI}/${commentId}/like`);
        } catch (error) {
            console.error("댓글 좋아요 취소 실패:", error);
            throw error;
        }
    },
};
