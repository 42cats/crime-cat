import { apiClient } from "@/lib/api";

export interface ExplorePostsResponse {
  content: {
    postId: string;
    authorNickname: string;
    thumbnailUrl: string | null;
    content: string;
    likeCount: number;
    liked: boolean;
    authorId?: string;
    isPrivate?: boolean;
    isFollowersOnly?: boolean;
    createdAt?: string;
  }[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last?: boolean;
}

class ExploreService {
  // 인기 게시물 조회
  async getPopularPosts(page: number = 0, size: number = 12): Promise<ExplorePostsResponse> {
    try {
      return await apiClient.get<ExplorePostsResponse>(`/public/posts/explore/popular`, {
        params: {
          page,
          size
        }
      });
    } catch (error) {
      console.error("인기 게시물 조회 실패:", error);
      return {
        content: [],
        pageable: { pageNumber: 0, pageSize: 12 },
        totalElements: 0,
        totalPages: 0
      };
    }
  }

  // 무작위 게시물 조회
  async getRandomPosts(page: number = 0, size: number = 12): Promise<ExplorePostsResponse> {
    try {
      return await apiClient.get<ExplorePostsResponse>(`/public/posts/explore/random`, {
        params: {
          page,
          size
        }
      });
    } catch (error) {
      console.error("무작위 게시물 조회 실패:", error);
      return {
        content: [],
        pageable: { pageNumber: 0, pageSize: 12 },
        totalElements: 0,
        totalPages: 0
      };
    }
  }

  // 최신 게시물 조회 (팔로우 중인 사용자 + 인기 게시물)
  async getFeedPosts(page: number = 0, size: number = 10): Promise<ExplorePostsResponse> {
    try {
      return await apiClient.get<ExplorePostsResponse>(`/posts/feed`, {
        params: {
          page,
          size
        }
      });
    } catch (error) {
      console.error("피드 게시물 조회 실패:", error);
      return {
        content: [],
        pageable: { pageNumber: 0, pageSize: 10 },
        totalElements: 0,
        totalPages: 0
      };
    }
  }


}

export const exploreService = new ExploreService();
