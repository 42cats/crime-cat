import { apiClient } from "@/lib/api";

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

export interface EscapeRoomCommentResponseDto {
    id: string;
    escapeRoomThemeId: string;
    escapeRoomThemeName: string;
    escapeRoomHistoryId?: string;
    userId: string;
    userNickname: string;
    userProfileImageUrl?: string;
    content: string;
    hasSpoiler: boolean;
    likesCount: number;
    isLiked: boolean;
    isGameHistoryComment: boolean;
    isAuthor: boolean;
    canEdit: boolean;
    canView: boolean;
    parentCommentId?: string;
    replies?: EscapeRoomCommentResponseDto[];
    createdAt: string;
    updatedAt: string;
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

const baseURI = "/api/escape-room-comments";

export const escapeRoomCommentService = {
    // 댓글 작성
    createComment: async (data: EscapeRoomCommentCreateDto): Promise<EscapeRoomCommentResponseDto> => {
        try {
            return await apiClient.post<EscapeRoomCommentResponseDto>(baseURI, data);
        } catch (error) {
            console.error("방탈출 댓글 작성 실패:", error);
            throw error;
        }
    },

    // 테마별 댓글 목록 조회
    getCommentsByTheme: async (
        themeId: string, 
        page: number = 0, 
        size: number = 20,
        spoilerOnly?: boolean
    ): Promise<PageResponseDto<EscapeRoomCommentResponseDto>> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort: 'createdAt,desc'
            });
            
            if (spoilerOnly !== undefined) {
                params.append('spoilerOnly', spoilerOnly.toString());
            }
            
            return await apiClient.get<PageResponseDto<EscapeRoomCommentResponseDto>>(
                `${baseURI}/theme/${themeId}?${params}`
            );
        } catch (error) {
            console.error("테마별 댓글 목록 조회 실패:", error);
            throw error;
        }
    },

    // 댓글 수정
    updateComment: async (commentId: string, data: EscapeRoomCommentUpdateDto): Promise<EscapeRoomCommentResponseDto> => {
        try {
            return await apiClient.put<EscapeRoomCommentResponseDto>(`${baseURI}/${commentId}`, data);
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

    // 댓글 상세 조회
    getComment: async (commentId: string): Promise<EscapeRoomCommentResponseDto> => {
        try {
            return await apiClient.get<EscapeRoomCommentResponseDto>(`${baseURI}/${commentId}`);
        } catch (error) {
            console.error("댓글 상세 조회 실패:", error);
            throw error;
        }
    },

    // 사용자별 댓글 목록 조회
    getCommentsByUser: async (userId: string, page: number = 0, size: number = 20): Promise<PageResponseDto<EscapeRoomCommentResponseDto>> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort: 'createdAt,desc'
            });
            
            return await apiClient.get<PageResponseDto<EscapeRoomCommentResponseDto>>(
                `${baseURI}/user/${userId}?${params}`
            );
        } catch (error) {
            console.error("사용자별 댓글 목록 조회 실패:", error);
            throw error;
        }
    },

    // 테마 댓글 통계 조회
    getCommentStats: async (themeId: string): Promise<EscapeRoomCommentStatsDto> => {
        try {
            return await apiClient.get<EscapeRoomCommentStatsDto>(`${baseURI}/theme/${themeId}/stats`);
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
    }
};