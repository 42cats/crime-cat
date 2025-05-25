import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/**
 * 사용자 카드 로딩 스켈레톤 컴포넌트
 */
export const UserCardSkeleton: React.FC = () => (
  <Card className="mb-3">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </CardContent>
  </Card>
);

export default UserCardSkeleton;
