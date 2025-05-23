import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { followApi } from "@/lib/api/followApi";
import { useEffect } from "react";

/**
 * 팔로우 관련 쿼리를 처리하는 커스텀 훅
 * - 팔로워/팔로잉 카운트 조회
 * - 팔로워 목록 조회
 * - 팔로잉 목록 조회
 */
export function useFollowQueries(
  followersPage = 0,
  followingsPage = 0,
  pageSize = 10
) {
  const { user } = useAuth();
  const userId = user?.id || "";

  // 팔로워/팔로잉 카운트 조회
  const { 
    data: followCounts,
    isLoading: isLoadingCounts 
  } = useQuery({
    queryKey: ["followCounts", userId],
    queryFn: () => followApi.getMyFollowCounts(),
    enabled: !!userId,
  });

  // 팔로워 목록 조회
  const {
    data: followers,
    isLoading: isLoadingFollowers,
    isFetching: isFetchingFollowers,
  } = useQuery({
    queryKey: ["followers", userId, followersPage, pageSize],
    queryFn: () => followApi.getFollowers(userId, followersPage, pageSize),
    enabled: !!userId,
  });

  // 팔로잉 목록 조회
  const {
    data: followings,
    isLoading: isLoadingFollowings,
    isFetching: isFetchingFollowings,
  } = useQuery({
    queryKey: ["followings", userId, followingsPage, pageSize],
    queryFn: () => followApi.getFollowings(userId, followingsPage, pageSize),
    enabled: !!userId,
  });

  return {
    user,
    userId,
    followCounts,
    isLoadingCounts,
    followers,
    isLoadingFollowers,
    isFetchingFollowers,
    followings,
    isLoadingFollowings,
    isFetchingFollowings,
  };
}

/**
 * 사용자 검색 쿼리를 처리하는 커스텀 훅
 */
export function useUserSearchQuery(
  searchQuery: string,
  searchPage = 0,
  pageSize = 10,
  showSearch = false
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 사용자 검색
  const {
    data: searchResults,
    isLoading: isLoadingSearch,
    isFetching: isFetchingSearch,
    refetch: refetchSearch,
  } = useQuery({
    queryKey: ["findUsers", searchQuery, "auto", searchPage, pageSize],
    queryFn: () => followApi.findUsers(searchQuery, "auto", searchPage, pageSize),
    enabled: !!searchQuery && showSearch,
    select: (data) => {
      console.log("API response:", data); // 디버그용
      
      // API 응답이 users 배열 대신 content 배열을 반환하는 경우 변환
      if (data.content && !data.users) {
        // content의 각 항목을 UserInfo 형식으로 변환
        const transformedUsers = data.content.map((item: any) => ({
          id: item.id || "",
          nickname: item.nickname || "",
          profileImagePath: item.profileImagePath || "",
          role: item.role || "",
        }));
        
        console.log("Transformed users:", transformedUsers); // 디버그용
        
        return {
          ...data,
          users: transformedUsers,
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 1,
        };
      }
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // 팔로우 여부 확인 및 결과에 추가
  useEffect(() => {
    if (!searchResults?.users || !user?.id) return;

    const checkFollowStatus = async () => {
      const updatedUsers = await Promise.all(
        searchResults.users.map(async (userInfo) => {
          if (userInfo.id === user.id)
            return { ...userInfo, isFollowing: false };

          try {
            const { isFollowing } = await followApi.isFollowing(
              userInfo.id
            );
            return { ...userInfo, isFollowing };
          } catch (error) {
            console.error("Failed to check follow status:", error);
            return { ...userInfo, isFollowing: false };
          }
        })
      );

      queryClient.setQueryData(
        ["findUsers", searchQuery, "auto", searchPage, pageSize],
        { ...searchResults, users: updatedUsers }
      );
    };

    checkFollowStatus();
  }, [
    searchResults,
    user?.id,
    queryClient,
    searchQuery,
    searchPage,
    pageSize,
  ]);

  return {
    user,
    searchResults,
    isLoadingSearch,
    isFetchingSearch,
    refetchSearch,
  };
}
