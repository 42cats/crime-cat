import { apiClient as api } from '@/lib/api';

export interface BoardComment {
  id: number;
  content: string;
  isSecret: boolean;
  parentId?: number;
  authorId: number;
  authorNickname: string;
  authorAvatar?: string;
  boardPostId: number;
  createdAt: string;
  updatedAt: string;
  replies?: BoardComment[];
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
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
  comments: BoardComment[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const boardCommentService = {
  // 댓글 목록 조회
  getComments: async (postId: number, page: number = 0, size: number = 20): Promise<BoardCommentListResponse> => {
    const response = await api.get(`/api/v1/post_comments/${postId}?page=${page}&size=${size}`);
    return response.data;
  },

  // 댓글 작성
  createComment: async (postId: number, data: CreateBoardCommentRequest): Promise<BoardComment> => {
    const response = await api.post(`/api/v1/post_comments/${postId}`, data);
    return response.data;
  },

  // 댓글 수정
  updateComment: async (postId: number, commentId: number, data: UpdateBoardCommentRequest): Promise<BoardComment> => {
    const response = await api.put(`/api/v1/post_comments/${commentId}`, data);
    return response.data;
  },

  // 댓글 삭제
  deleteComment: async (postId: number, commentId: number): Promise<void> => {
    await api.delete(`/api/v1/post_comments/${commentId}`);
  },

  // 대댓글 작성
  createReply: async (postId: number, parentCommentId: number, data: CreateBoardCommentRequest): Promise<BoardComment> => {
    const response = await api.post(`/api/v1/post_comments/${postId}`, {
      ...data,
      parentId: parentCommentId
    });
    return response.data;
  }
};