import { apiClient } from "@/lib/api";

export interface FollowDto {
  id: string;
  followerId: string;
  followerNickname: string;
  followerProfileImagePath: string;
  followingId: string;
  followingNickname: string;
  followingProfileImagePath: string;
  createdAt: string;
}

export interface FollowCountResponse {
  followerCount: number;
  followingCount: number;
}

export interface IsFollowingResponse {
  isFollowing: boolean;
}

export interface FindUserInfo {
  users: UserInfo[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

export interface UserInfo {
  id: string;
  nickname: string;
  profileImagePath: string;
  role: string;
  isFollowing?: boolean; // Frontend에서 추가하는 필드
}

export const followApi = {
  // 팔로우하기
  follow: (followingId: string): Promise<FollowDto> => 
    apiClient.post(`/follows/${followingId}`),

  // 언팔로우하기
  unfollow: (followingId: string): Promise<void> => 
    apiClient.delete(`/follows/${followingId}`),

  // 팔로우 여부 확인
  isFollowing: (userId: string): Promise<IsFollowingResponse> => 
    apiClient.get(`/follows/${userId}/following`),

  // 나의 팔로워/팔로잉 카운트
  getMyFollowCounts: (): Promise<FollowCountResponse> => 
    apiClient.get(`/follows/my/counts`),

  // 특정 사용자의 팔로워 목록 조회
  getFollowers: (userId: string, page = 0, size = 20): Promise<{ content: FollowDto[], totalElements: number, totalPages: number }> => 
    apiClient.get(`/public/${userId}/followers?page=${page}&size=${size}`),

  // 특정 사용자의 팔로잉 목록 조회
  getFollowings: (userId: string, page = 0, size = 20): Promise<{ content: FollowDto[], totalElements: number, totalPages: number }> => 
    apiClient.get(`/public/${userId}/followings?page=${page}&size=${size}`),

  // 사용자 검색
  findUsers: (keyword: string, searchType = 'auto', page = 0, size = 10): Promise<FindUserInfo> => 
    apiClient.get(`/web_user/find/users?keyword=${encodeURIComponent(keyword)}&searchType=${searchType}&page=${page}&size=${size}`),
};
