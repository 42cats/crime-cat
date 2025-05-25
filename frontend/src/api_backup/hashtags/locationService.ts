import { apiClient } from "@/lib/api";

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface LocationPostsResponse {
  content: {
    postId: string;
    authorNickname: string;
    thumbnailUrl: string | null;
    content: string;
    likeCount: number;
    liked: boolean;
  }[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

class LocationService {
  // 위치 검색
  async searchLocations(query: string): Promise<Location[]> {
    if (!query || query.length < 2) return [];
    
    try {
      return await apiClient.get<Location[]>(`/locations/search`, {
        params: {
          query
        }
      });
    } catch (error) {
      console.error("위치 검색 실패:", error);
      return [];
    }
  }

  // 특정 위치의 게시물 조회
  async getPostsByLocation(locationId: string, page: number = 0, size: number = 20): Promise<LocationPostsResponse> {
    try {
      return await apiClient.get<LocationPostsResponse>(`/locations/${locationId}/posts`, {
        params: {
          page,
          size
        }
      });
    } catch (error) {
      console.error(`위치 ${locationId}의 게시물 조회 실패:`, error);
      return {
        content: [],
        pageable: { pageNumber: 0, pageSize: 20 },
        totalElements: 0,
        totalPages: 0
      };
    }
  }

  // 인기 위치 목록 조회
  async getPopularLocations(page: number = 0, size: number = 10): Promise<Location[]> {
    try {
      return await apiClient.get<Location[]>(`/locations/popular`, {
        params: {
          page,
          size
        }
      });
    } catch (error) {
      console.error("인기 위치 목록 조회 실패:", error);
      return [];
    }
  }
}

export const locationService = new LocationService();
