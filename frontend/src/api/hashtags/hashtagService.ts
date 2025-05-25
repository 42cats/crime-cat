import { apiClient } from "@/lib/api";

export interface HashTag {
    id: string;
    name: string;
    useCount: number;
    lastUsedAt?: string;
}

export interface HashTagResponse {
    content: HashTag[];
    pageable: {
        pageNumber: number;
        pageSize: number;
    };
    totalElements: number;
    totalPages: number;
    last?: boolean;
}

export interface HashTagPostsResponse {
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

class HashTagService {
    // 인기 해시태그 목록 조회
    async getPopularHashTags(
        page: number = 0,
        size: number = 20
    ): Promise<HashTagResponse | null> {
        console.trace("getPopularHashTags called from:"); // 호출 스택 추적
        try {
            return await apiClient.get<HashTagResponse>(`/hashtags/popular`, {
                params: {
                    page,
                    size,
                },
            });
        } catch (error) {
            console.error("인기 해시태그 로드 실패:", error);
            return null;
        }
    }

    // 해시태그 검색 (자동완성)
    async searchHashTags(
        query: string,
        page: number = 0,
        size: number = 10
    ): Promise<HashTag[]> {
        if (!query || query.length < 2) {
            return [];
        }

        try {
            const response = await apiClient.get<HashTagResponse>(
                `/public/hashtags/search`,
                {
                    params: {
                        query,
                        page,
                        size,
                    },
                }
            );
            return response.content || [];
        } catch (error) {
            console.error("해시태그 검색 실패:", error);
            return [];
        }
    }

    // 해시태그로 게시물 검색
    async getPostsByHashTag(
        tagName: string,
        page: number = 0,
        size: number = 20
    ): Promise<HashTagPostsResponse> {
        try {
            return await apiClient.get<HashTagPostsResponse>(
                `/hashtags/${tagName}/posts`,
                {
                    params: {
                        page,
                        size,
                    },
                }
            );
        } catch (error) {
            console.error(`해시태그 ${tagName}로 게시물 검색 실패:`, error);
            return {
                content: [],
                pageable: { pageNumber: 0, pageSize: 20 },
                totalElements: 0,
                totalPages: 0,
            };
        }
    }

    // 여러 해시태그로 게시물 검색 (AND 조건)
    async getPostsByMultipleHashTags(
        tags: string[],
        page: number = 0,
        size: number = 20
    ): Promise<HashTagPostsResponse> {
        try {
            return await apiClient.get<HashTagPostsResponse>(
                `/hashtags/posts`,
                {
                    params: {
                        tags,
                        page,
                        size,
                    },
                    paramsSerializer: (params) => {
                        // URL 파라미터 직렬화: tags=tag1&tags=tag2 형태로 변환
                        return Object.entries(params)
                            .map(([key, value]) => {
                                if (Array.isArray(value)) {
                                    return value
                                        .map(
                                            (v) =>
                                                `${key}=${encodeURIComponent(
                                                    v
                                                )}`
                                        )
                                        .join("&");
                                }
                                return `${key}=${encodeURIComponent(value)}`;
                            })
                            .join("&");
                    },
                }
            );
        } catch (error) {
            console.error("복수 해시태그로 게시물 검색 실패:", error);
            return {
                content: [],
                pageable: { pageNumber: 0, pageSize: 20 },
                totalElements: 0,
                totalPages: 0,
            };
        }
    }
}

export const hashtagService = new HashTagService();
