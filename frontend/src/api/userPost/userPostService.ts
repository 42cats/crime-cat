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

  // 내 포스트 리스트 가져오기
  async getMyPosts(page: number = 0, size: number = 12): Promise<UserPostGalleryPageDto> {
    try {
      return await apiClient.get('/user-posts/my', {
        params: {
          page,
          size,
          sort: 'LATEST'
        },
        headers: {
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      console.error('내 포스트 목록 로드 실패:', error);
      return { content: [], pageable: { pageNumber: 0, pageSize: 12 }, totalElements: 0, totalPages: 0 };
    }
  }

  // 포스트 생성
  async createPost(content: string, images?: File[]): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      if (images && images.length > 0) {
        images.forEach(image => {
          formData.append('images', image);
        });
      }
      
      await apiClient.post('/user-posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error('포스트 생성 실패:', error);
      throw error;
    }
  }

  // 포스트 업데이트
  async updatePost(postId: string, content: string, newImages?: File[], keepImageUrls?: string[]): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      if (newImages && newImages.length > 0) {
        newImages.forEach(image => {
          formData.append('newImages', image);
        });
        
        // UUID 생성
        newImages.forEach(() => {
          formData.append('newImageIds', crypto.randomUUID());
        });
      }
      
      if (keepImageUrls && keepImageUrls.length > 0) {
        keepImageUrls.forEach(url => {
          formData.append('keepImageUrls', url);
        });
      }
      
      await apiClient.patch(`/user-posts/${postId}/partial`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error('포스트 업데이트 실패:', error);
      throw error;
    }
  }

  // 포스트 삭제
  async deletePost(postId: string): Promise<void> {
    try {
      await apiClient.delete(`/user-posts/${postId}`);
    } catch (error) {
      console.error('포스트 삭제 실패:', error);
      throw error;
    }
  }
}

export const userPostService = new UserPostService();