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
    onSuccess: () => {
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
    onSuccess: () => {
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
