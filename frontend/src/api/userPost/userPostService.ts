import { apiClient } from '@/lib/api';

export interface UserPostGalleryDto {
  postId: string;
  authorNickname: string;
  thumbnailUrl: string | null; // 0번째 이미지 또는 null
  likeCount: number;
  liked: boolean;
}

export interface UserPostDto {
  postId: string;
  content: string;
  authorNickname: string;
  authorAvatarUrl: string;
  imageUrls: string[];
  likeCount: number;
  liked: boolean;
}

export interface UserPostGalleryPageDto {
  content: UserPostGalleryDto[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

class UserPostService {
  // 특정 사용자의 포스트 갤러리 가져오기
  async getUserPosts(userId: string, page: number = 0, size: number = 12): Promise<UserPostGalleryPageDto> {
    try {
      return await apiClient.get(`/public/user-posts/user/${userId}`, {
        params: {
          page,
          size,
          sort: 'LATEST' // 최신순 정렬
        },
        headers: {
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      console.error('사용자 포스트 갤러리 로드 실패:', error);
      return { content: [], pageable: { pageNumber: 0, pageSize: 12 }, totalElements: 0, totalPages: 0 };
    }
  }

  // 특정 포스트 상세 정보 가져오기
  async getUserPostDetail(postId: string): Promise<UserPostDto> {
    try {
      return await apiClient.get(`/public/user-posts/${postId}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      console.error('포스트 상세 정보 로드 실패:', error);
      throw error;
    }
  }

  // 포스트 좋아요 토글
  async togglePostLike(postId: string): Promise<boolean> {
    try {
      return await apiClient.post(`/user-posts/${postId}/likes/toggle`, {}, {
        headers: {
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      console.error('포스트 좋아요 토글 실패:', error);
      throw error;
    }
  }

  // 현재 사용자가 특정 포스트에 좋아요 눌렀는지 확인
  async checkPostLike(postId: string): Promise<boolean> {
    try {
      return await apiClient.get(`/user-posts/${postId}/likes/me`, {
        headers: {
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      console.error('포스트 좋아요 확인 실패:', error);
      throw error;
    }
  }
}

export const userPostService = new UserPostService();
