import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { PaginationController } from "@/components/ui/pagination-controller";
import UserCard from "./UserCard";
import UserCardSkeleton from "./UserCardSkeleton";
import { useFollowMutations } from "./hooks/useFollowMutations";

interface FollowersListProps {
  followers: any;
  isLoading: boolean;
  isFetching: boolean;
  currentUserId: string;
  followersPage: number;
  setFollowersPage: (page: number) => void;
}

/**
 * 팔로워 목록 컴포넌트
 */
export const FollowersList: React.FC<FollowersListProps> = ({
  followers,
  isLoading,
  isFetching,
  currentUserId,
  followersPage,
  setFollowersPage,
}) => {
  const { followMutation, unfollowMutation } = useFollowMutations();

  return (
    <Card className="border-t-0 rounded-tl-none">
      <CardContent className="p-4">
        {isLoading || isFetching ? (
          <div>
            {[...Array(5)].map((_, index) => (
              <UserCardSkeleton key={index} />
            ))}
          </div>
        ) : followers?.content?.length ? (
          <div>
            {followers.content.map((follow: any) => (
              <UserCard
                key={`follower-${follow.id}`}
                follow={follow}
                isFollowing={false}
                currentUserId={currentUserId}
                followMutation={followMutation}
                unfollowMutation={unfollowMutation}
              />
            ))}

            {/* 팔로워 페이지네이션 */}
            {followers.totalPages > 1 && (
              <PaginationController
                totalPages={followers.totalPages}
                currentPage={followersPage + 1}
                onPageChange={(page) => setFollowersPage(page - 1)}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-lg font-medium mb-1">아직 팔로워가 없습니다</p>
            <p className="text-muted-foreground">
              다른 사용자들이 당신을 팔로우하면 여기에 표시됩니다
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FollowersList;
