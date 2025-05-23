import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FollowCountResponse } from "@/lib/api/followApi";

interface FollowsHeaderProps {
  followCounts: FollowCountResponse | undefined;
  isLoading: boolean;
}

/**
 * 팔로우 페이지 헤더 컴포넌트
 * 페이지 제목과 팔로워/팔로잉 카운트를 표시
 */
export const FollowsHeader: React.FC<FollowsHeaderProps> = ({
  followCounts,
  isLoading,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">팔로우 관리</h1>
        <p className="text-muted-foreground">팔로워와 팔로잉을 관리하세요</p>
      </div>
      <Card className="md:w-auto">
        <CardContent className="p-4 flex space-x-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">팔로워</p>
            <p className="text-2xl font-bold">
              {isLoading ? "-" : followCounts?.followerCount || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">팔로잉</p>
            <p className="text-2xl font-bold">
              {isLoading ? "-" : followCounts?.followingCount || 0}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FollowsHeader;
