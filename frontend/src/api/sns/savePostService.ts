import { apiClient } from "@/lib/api";

export interface SavedPostsResponse {
  content: {
    postId: string;
    authorNickname: string;
    thumbnailUrl: string | null;
    content: string;
    likeCount: number;
    liked: boolean;
    savedAt: string;
  }[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

export interface CollectionResponse {
  name: string;
  postCount: number;
  thumbnailUrl: string | null;
}

class SavePostService {
  // 게시물 저장/취소
  async toggleSavePost(postId: string, collectionName: string | null = null): Promise<boolean> {
    try {
      return await apiClient.post<boolean>(`/posts/saved/${postId}`, {
        collectionName
      });
    } catch (error) {
      console.error("게시물 저장/취소 실패:", error);
      throw error;
    }
  }

  // 게시물 저장 상태 확인
  async isPostSaved(postId: string): Promise<boolean> {
    try {
      return await apiClient.get<boolean>(`/posts/saved/status/${postId}`);
    } catch (error) {
      console.error("게시물 저장 상태 확인 실패:", error);
      return false;
    }
  }

  // 저장된 게시물 목록 조회
  async getSavedPosts(page: number = 0, size: number = 20): Promise<SavedPostsResponse> {
    try {
      return await apiClient.get<SavedPostsResponse>(`/posts/saved`, {
        params: {
          page,
          size
        }
      });
    } catch (error) {
      console.error("저장된 게시물 목록 조회 실패:", error);
      return {
        content: [],
        pageable: { pageNumber: 0, pageSize: 20 },
        totalElements: 0,
        totalPages: 0
      };
    }
  }

  // 컬렉션 목록 조회
  async getCollections(): Promise<CollectionResponse[]> {
    try {
      return await apiClient.get<CollectionResponse[]>(`/posts/saved/collections`);
    } catch (error) {
      console.error("컬렉션 목록 조회 실패:", error);
      return [];
    }
  }

  // 컬렉션별 저장된 게시물 조회
  async getSavedPostsByCollection(collectionName: string, page: number = 0, size: number = 20): Promise<SavedPostsResponse> {
    try {
      return await apiClient.get<SavedPostsResponse>(`/posts/saved/collections/${encodeURIComponent(collectionName)}`, {
        params: {
          page,
          size
        }
      });
    } catch (error) {
      console.error(`컬렉션 ${collectionName}의 게시물 조회 실패:`, error);
      return {
        content: [],
        pageable: { pageNumber: 0, pageSize: 20 },
        totalElements: 0,
        totalPages: 0
      };
    }
  }

  // 컬렉션 생성 (저장 시 새 컬렉션 이름을 지정하면 자동 생성됨)
  // 컬렉션 삭제 (모든 게시물이 해당 컬렉션에서 제거되면 자동 삭제됨)
}

export const savePostService = new SavePostService();
