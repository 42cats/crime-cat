import { apiClient } from "@/lib/api";

export interface SearchResult {
  content: SearchResultItem[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last?: boolean;
}

export interface SearchResultItem {
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
}

export interface HashtagSearchResult {
  content: {
    id: string;
    name: string;
    useCount: number;
    lastUsedAt?: string;
  }[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last?: boolean;
}

class SnsSearchService {
  /**
   * 통합 검색 - 키워드와 해시태그를 모두 지원
   * @param query 검색어 (키워드 또는 #해시태그)
   * @param page 페이지 번호
   * @param size 페이지 크기
   * @returns 검색 결과
   */
  async searchPosts(query: string, page: number = 0, size: number = 20): Promise<SearchResult> {
    try {
      if (!query || query.trim().length === 0) {
        return {
          content: [],
          pageable: { pageNumber: 0, pageSize: size },
          totalElements: 0,
          totalPages: 0
        };
      }

      // 맨앞 #이 있으면 제거
      let cleanQuery = query.trim();
      if (cleanQuery.startsWith('#')) {
        cleanQuery = cleanQuery.substring(1);
      }

      return await apiClient.get<SearchResult>(`/public/posts/explore/search`, {
        params: {
          query: cleanQuery,
          page,
          size
        }
      });
    } catch (error) {
      console.error("통합 검색 실패:", error);
      return {
        content: [],
        pageable: { pageNumber: 0, pageSize: size },
        totalElements: 0,
        totalPages: 0
      };
    }
  }

  /**
   * 키워드만으로 게시물 검색
   * @param keyword 검색 키워드
   * @param page 페이지 번호
   * @param size 페이지 크기
   * @returns 검색 결과
   */
  async searchByKeyword(keyword: string, page: number = 0, size: number = 20): Promise<SearchResult> {
    return this.searchPosts(keyword, page, size);
  }

  /**
   * 해시태그로 게시물 검색
   * @param hashtag 해시태그 (# 포함/미포함 모두 가능)
   * @param page 페이지 번호
   * @param size 페이지 크기
   * @returns 검색 결과
   */
  async searchByHashtag(hashtag: string, page: number = 0, size: number = 20): Promise<SearchResult> {
    if (!hashtag || hashtag.trim().length === 0) {
      return {
        content: [],
        pageable: { pageNumber: 0, pageSize: size },
        totalElements: 0,
        totalPages: 0
      };
    }

    // #이 없으면 추가
    const searchQuery = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    return this.searchPosts(searchQuery, page, size);
  }

  /**
   * 해시태그 자동완성 검색
   * @param query 검색어
   * @param page 페이지 번호
   * @param size 페이지 크기
   * @returns 해시태그 목록
   */
  async searchHashtags(query: string, page: number = 0, size: number = 10): Promise<HashtagSearchResult> {
    try {
      if (!query || query.trim().length < 2) {
        return {
          content: [],
          pageable: { pageNumber: 0, pageSize: size },
          totalElements: 0,
          totalPages: 0
        };
      }

      return await apiClient.get<HashtagSearchResult>(`/public/hashtags/search`, {
        params: {
          query: query.trim(),
          page,
          size
        }
      });
    } catch (error) {
      console.error("해시태그 자동완성 검색 실패:", error);
      return {
        content: [],
        pageable: { pageNumber: 0, pageSize: size },
        totalElements: 0,
        totalPages: 0
      };
    }
  }

  /**
   * 인기 해시태그 조회
   * @param page 페이지 번호
   * @param size 페이지 크기
   * @returns 인기 해시태그 목록
   */
  async getPopularHashtags(page: number = 0, size: number = 20): Promise<HashtagSearchResult> {
    try {
      return await apiClient.get<HashtagSearchResult>(`/public/hashtags/popular`, {
        params: {
          page,
          size
        }
      });
    } catch (error) {
      console.error("인기 해시태그 조회 실패:", error);
      return {
        content: [],
        pageable: { pageNumber: 0, pageSize: size },
        totalElements: 0,
        totalPages: 0
      };
    }
  }

  /**
   * 검색어 유효성 검사
   * @param query 검색어
   * @returns 유효성 여부와 타입
   */
  validateSearchQuery(query: string): { 
    isValid: boolean; 
    type: 'keyword' | 'hashtag' | 'empty'; 
    cleanQuery: string 
  } {
    if (!query || query.trim().length === 0) {
      return { isValid: false, type: 'empty', cleanQuery: '' };
    }

    const trimmedQuery = query.trim();
    
    if (trimmedQuery.startsWith('#')) {
      const hashtag = trimmedQuery.substring(1);
      return {
        isValid: hashtag.length > 0,
        type: 'hashtag',
        cleanQuery: hashtag
      };
    }

    return {
      isValid: trimmedQuery.length > 0,
      type: 'keyword',
      cleanQuery: trimmedQuery
    };
  }
}

export const snsSearchService = new SnsSearchService();

// 기존 export와의 호환성을 위해 유지
export const searchService = snsSearchService;
