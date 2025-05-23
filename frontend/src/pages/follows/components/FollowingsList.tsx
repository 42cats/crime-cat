import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { PaginationController } from "@/components/ui/pagination-controller";
import UserCard from "./UserCard";
import UserCardSkeleton from "./UserCardSkeleton";
import { useFollowMutations } from "./hooks/useFollowMutations";

interface FollowingsListProps {
  followings: any;
  isLoading: boolean;
  isFetching: boolean;
  currentUserId: string;
  followingsPage: number;
  setFollowingsPage: (page: number) => void;
}

/**
 * 팔로잉 목록 컴포넌트
 */
export const FollowingsList: React.FC<FollowingsListProps> = ({
  followings,
  isLoading,
  isFetching,
  currentUserId,
  followingsPage,
  setFollowingsPage,
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
        ) : followings?.content?.length ? (
          <div>
            {followings.content.map((follow: any) => (
              <UserCard
                key={`following-${follow.id}`}
                follow={follow}
                isFollowing={true}
                currentUserId={currentUserId}
                followMutation={followMutation}
                unfollowMutation={unfollowMutation}
              />
            ))}

            {/* 팔로잉 페이지네이션 */}
            {followings.totalPages > 1 && (
              <PaginationController
                totalPages={followings.totalPages}
                currentPage={followingsPage + 1}
                onPageChange={(page) => setFollowingsPage(page - 1)}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-lg font-medium mb-1">
              아직 팔로잉하는 사용자가 없습니다
            </p>
            <p className="text-muted-foreground">
              다른 사용자를 팔로우하면 여기에 표시됩니다
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FollowingsList;
