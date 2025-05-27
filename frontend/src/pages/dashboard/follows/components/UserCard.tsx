import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowDto } from "@/lib/api/followApi";
import { useQueryClient } from "@tanstack/react-query";
import { followApi } from "@/lib/api/followApi";
import { UseMutationResult } from "@tanstack/react-query";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";

interface UserCardProps {
  follow: FollowDto;
  isFollowing: boolean;
  currentUserId: string;
  followMutation: UseMutationResult<any, Error, string>;
  unfollowMutation: UseMutationResult<any, Error, string>;
}

/**
 * 팔로워/팔로잉 목록에 표시되는 사용자 카드 컴포넌트
 */
export const UserCard: React.FC<UserCardProps> = ({
  follow,
  isFollowing,
  currentUserId,
  followMutation,
  unfollowMutation,
}) => {
  const queryClient = useQueryClient();
  const userToDisplay = isFollowing
    ? {
        id: follow.followingId,
        nickname: follow.followingNickname,
        profileImage: follow.followingProfileImagePath,
      }
    : {
        id: follow.followerId,
        nickname: follow.followerNickname,
        profileImage: follow.followerProfileImagePath,
      };

  // 내 프로필인지 확인
  const isMyProfile = userToDisplay.id === currentUserId;

  // 팔로잉 여부 확인 (팔로워 탭에서만 필요)
  const [isFollowingUser, setIsFollowingUser] = useState<boolean | null>(
    (follow as any).isFollowingUser !== undefined ? (follow as any).isFollowingUser : null
  );

  // 프로필 모달 상태 관리
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    // 이미 속성이 있는 경우 사용
    if ((follow as any).isFollowingUser !== undefined) {
      setIsFollowingUser((follow as any).isFollowingUser);
      return;
    }

    // 필요한 경우에만 API 호출
    if (!isFollowing && !isMyProfile && isFollowingUser === null) {
      const checkIsFollowing = async () => {
        try {
          const response = await followApi.isFollowing(userToDisplay.id);
          setIsFollowingUser(response.isFollowing);
          
          // 다음번 사용을 위해 쿼리 데이터에 저장
          queryClient.setQueriesData({ queryKey: ["followers"] }, (old: any) => {
            if (!old?.content) return old;
            return {
              ...old,
              content: old.content.map((item: any) => {
                if (item.id === follow.id) {
                  return { ...item, isFollowingUser: response.isFollowing };
                }
                return item;
              })
            };
          });
          
        } catch (error) {
          console.error("Failed to check if following:", error);
          setIsFollowingUser(false);
        }
      };

      checkIsFollowing();
    }
  }, [userToDisplay.id, isFollowing, isMyProfile, follow, queryClient]);

  return (
    <>
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowProfileModal(true)}
          >
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={userToDisplay.profileImage ?? "/content/image/default_profile_image.png"}
                alt={userToDisplay.nickname}
              />
              <AvatarFallback>
                {userToDisplay.nickname.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{userToDisplay.nickname}</div>
              {isMyProfile && <Badge variant="outline">내 프로필</Badge>}
            </div>
          </div>

          {!isMyProfile && (
            <div>
              {isFollowing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unfollowMutation.mutate(userToDisplay.id)}
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                  disabled={unfollowMutation.isPending}
                >
                  <UserMinus className="mr-1 h-4 w-4" />
                  팔로우 취소
                </Button>
              ) : !isFollowing && isFollowingUser === false ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => followMutation.mutate(userToDisplay.id)}
                  className="text-blue-500 border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                  disabled={followMutation.isPending}
                >
                  <UserPlus className="mr-1 h-4 w-4" />
                  팔로우
                </Button>
              ) : !isFollowing && isFollowingUser === true ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unfollowMutation.mutate(userToDisplay.id)}
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                  disabled={unfollowMutation.isPending}
                >
                  <UserMinus className="mr-1 h-4 w-4" />
                  팔로우 취소
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <Skeleton className="h-4 w-16" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* 프로필 상세 모달 */}
    {showProfileModal && (
      <ProfileDetailModal
        userId={userToDisplay.id}
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        onFollowChange={() => {
          // 팔로우 상태가 변경되면 현재 카드의 팔로잉 상태도 업데이트
          if (!isFollowing && !isMyProfile) {
            followApi.isFollowing(userToDisplay.id)
              .then(response => setIsFollowingUser(response.isFollowing))
              .catch(console.error);
          }
        }}
      />
    )}
    </>
  );
};

export default UserCard;
