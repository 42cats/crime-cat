import { apiClient } from "@/lib/api";

/**
 * 팔로우 정보 인터페이스
 */
export interface FollowDto {
    id: string;
    followerId: string;
    followingId: string;
    followerNickname: string;
    followingNickname: string;
    followerProfileImage: string | null;
    followingProfileImage: string | null;
    createdAt: string;
}

/**
 * 페이지 응답 인터페이스
 */
export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

/**
 * 팔로워 목록을 조회하는 API 함수
 * @param userId 사용자 ID
 * @param page 페이지 번호 (0부터 시작)
 * @param size 페이지 크기
 * @returns 팔로워 목록 페이지
 */
export const getFollowers = async (
    userId: string,
    page: number = 0,
    size: number = 20
): Promise<PageResponse<FollowDto>> => {
    try {
        const response = await apiClient.get<PageResponse<FollowDto>>(
            `/public/${userId}/followers`,
            {
                params: {
                    page,
                    size,
                },
            }
        );
        return response;
    } catch (error) {
        console.error("팔로워 목록 조회 실패:", error);
        throw error;
    }
};

/**
 * 팔로잉 목록을 조회하는 API 함수
 * @param userId 사용자 ID
 * @param page 페이지 번호 (0부터 시작)
 * @param size 페이지 크기
 * @returns 팔로잉 목록 페이지
 */
export const getFollowings = async (
    userId: string,
    page: number = 0,
    size: number = 20
): Promise<PageResponse<FollowDto>> => {
    try {
        const response = await apiClient.get<PageResponse<FollowDto>>(
            `/public/${userId}/followings`,
            {
                params: {
                    page,
                    size,
                },
            }
        );
        return response;
    } catch (error) {
        console.error("팔로잉 목록 조회 실패:", error);
        throw error;
    }
};

/**
 * 팔로워 수를 조회하는 API 함수
 * @param userId 사용자 ID
 * @returns 팔로워 수
 */
export const getFollowerCount = async (userId: string): Promise<number> => {
    try {
        const response = await apiClient.get<{ followerCount: number }>(
            `/public/${userId}/follower-count`
        );
        return response.followerCount;
    } catch (error) {
        console.error("팔로워 수 조회 실패:", error);
        throw error;
    }
};

/**
 * 팔로잉 수를 조회하는 API 함수
 * @param userId 사용자 ID
 * @returns 팔로잉 수
 */
export const getFollowingCount = async (userId: string): Promise<number> => {
    try {
        const response = await apiClient.get<{ followingCount: number }>(
            `/public/${userId}/following-count`
        );
        return response.followingCount;
    } catch (error) {
        console.error("팔로잉 수 조회 실패:", error);
        throw error;
    }
};

/**
 * 사용자를 팔로우하는 API 함수
 * @param followingId 팔로우할 사용자의 ID
 * @returns 팔로우 정보
 */
export const followUser = async (followingId: string): Promise<FollowDto> => {
    try {
        const response = await apiClient.post<FollowDto>(
            `/follows/${followingId}`
        );
        return response;
    } catch (error) {
        console.error("사용자 팔로우 실패:", error);
        throw error;
    }
};

/**
 * 사용자 언팔로우하는 API 함수
 * @param followingId 언팔로우할 사용자의 ID
 */
export const unfollowUser = async (followingId: string): Promise<void> => {
    try {
        await apiClient.delete(`/follows/${followingId}`);
    } catch (error) {
        console.error("사용자 언팔로우 실패:", error);
        throw error;
    }
};

/**
 * 현재 사용자가 특정 사용자를 팔로우하고 있는지 확인하는 API 함수
 * @param userId 확인할 사용자의 ID
 * @returns 팔로우 여부
 */
export const isFollowing = async (userId: string): Promise<boolean> => {
    try {
        const response = await apiClient.get<{ isFollowing: boolean }>(
            `/follows/${userId}/following`
        );
        return response.isFollowing;
    } catch (error) {
        console.error("팔로우 여부 확인 실패:", error);
        return false;
    }
};

/**
 * 현재 사용자의 팔로워/팔로잉 수를 조회하는 API 함수
 * @returns 팔로워 수와 팔로잉 수
 */
export const getMyFollowCounts = async (): Promise<{
    followerCount: number;
    followingCount: number;
}> => {
    try {
        const response = await apiClient.get<{
            followerCount: number;
            followingCount: number;
        }>(`/follows/my/counts`);
        return response;
    } catch (error) {
        console.error("내 팔로우 수 조회 실패:", error);
        throw error;
    }
};
