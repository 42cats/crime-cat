import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { SocialLinksSection } from "@/components/profile/SocialLinks";
import { NotificationSettingsSection } from "@/components/profile/NotificationSettings";
import type { UserProfile } from "@/types/profile";

interface Props {
  user: UserProfile;
}

export const ProfileCard: React.FC<Props> = ({ user }) => {
  const [currentPoint, setCurrentPoint] = useState(user.point);

  // 포인트 업데이트 핸들러
  const handlePointUpdate = (newPoint: number) => {
    setCurrentPoint(newPoint);
  };

  // 현재 포인트를 반영한 사용자 객체
  const userWithCurrentPoint = {
    ...user,
    point: currentPoint,
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>내 프로필</CardTitle>
        <CardDescription>
          회원님의 전체 프로필 정보입니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 기본 프로필 정보 */}
        <ProfileInfo user={userWithCurrentPoint} />
        
        {/* 포인트 및 쿠폰 */}
        <ProfileStats 
          user={userWithCurrentPoint} 
          onPointUpdate={handlePointUpdate} 
        />
        
        {/* 알림 설정 */}
        <NotificationSettingsSection 
          userId={user.id}
          initialSettings={user.notificationSettings}
        />
        
        {/* 소셜 링크 */}
        <SocialLinksSection socialLinks={user.social_links} />
      </CardContent>
    </Card>
  );
};
