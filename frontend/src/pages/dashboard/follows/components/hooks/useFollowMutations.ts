import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followApi } from "@/lib/api/followApi";
import { useToast } from "@/hooks/useToast";

/**
 * 팔로우 관련 mutation을 처리하는 커스텀 훅
 * - 팔로우 mutation
 * - 언팔로우 mutation
 */
export function useFollowMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 팔로우 Mutation
  const followMutation = useMutation({
    mutationFn: (followingId: string) => followApi.follow(followingId),
    onSuccess: (_, followingId) => {
      // 즐시 반영을 위한 쿼리 데이터 업데이트
      // 1. findUsers 쿼리 데이터 업데이트
      queryClient.setQueriesData({ queryKey: ["findUsers"] }, (old: any) => {
        if (!old?.users) return old;
        return {
          ...old,
          users: old.users.map((user: any) => 
            user.id === followingId ? { ...user, isFollowing: true } : user
          )
        };
      });

      // 2. 팔로잉 상태 업데이트
      queryClient.setQueriesData({ queryKey: ["followers"] }, (old: any) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((follow: any) => {
            if (follow.followerId === followingId) {
              return { ...follow, isFollowingUser: true };
            }
            return follow;
          })
        };
      });

      // 3. 그 후 쿼리 무효화하여 실제 데이터 갱신
      queryClient.invalidateQueries({ queryKey: ["followCounts"] });
      queryClient.invalidateQueries({ queryKey: ["followings"] });
      queryClient.invalidateQueries({ queryKey: ["findUsers"] });
      
      toast({
        title: "팔로우 성공",
        description: "사용자를 팔로우했습니다.",
      });
    },
    onError: () => {
      toast({
        title: "팔로우 실패",
        description: "사용자 팔로우에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  // 언팔로우 Mutation
  const unfollowMutation = useMutation({
    mutationFn: (followingId: string) => followApi.unfollow(followingId),
    onSuccess: (_, followingId) => {
      // 즐시 반영을 위한 쿼리 데이터 업데이트
      // 1. findUsers 쿼리 데이터 업데이트
      queryClient.setQueriesData({ queryKey: ["findUsers"] }, (old: any) => {
        if (!old?.users) return old;
        return {
          ...old,
          users: old.users.map((user: any) => 
            user.id === followingId ? { ...user, isFollowing: false } : user
          )
        };
      });

      // 2. 팔로잉 상태 업데이트
      queryClient.setQueriesData({ queryKey: ["followers"] }, (old: any) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((follow: any) => {
            if (follow.followerId === followingId) {
              return { ...follow, isFollowingUser: false };
            }
            return follow;
          })
        };
      });

      // 3. 그 후 쿼리 무효화하여 실제 데이터 갱신
      queryClient.invalidateQueries({ queryKey: ["followCounts"] });
      queryClient.invalidateQueries({ queryKey: ["followings"] });
      queryClient.invalidateQueries({ queryKey: ["findUsers"] });

      toast({
        title: "언팔로우 성공",
        description: "사용자 팔로우를 취소했습니다.",
      });
    },
    onError: () => {
      toast({
        title: "언팔로우 실패",
        description: "사용자 팔로우 취소에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  return {
    followMutation,
    unfollowMutation,
  };
}
