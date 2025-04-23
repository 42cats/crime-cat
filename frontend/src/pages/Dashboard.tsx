// src/pages/Dashboard.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (!user) return null;

  return (
    <div className="w-full flex justify-center items-center min-h-screen px-4">
      <div className="flex flex-wrap justify-center gap-6">
        {/* 1. 내 프로필 카드 */}
        <Card className="w-[17rem]">
          <CardHeader>
            <CardTitle>내 프로필</CardTitle>
            <CardDescription>회원님의 프로필 정보를 확인하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">닉네임</p>
              <p className="mt-1 text-base">{user.nickname}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">타이틀</p>
              <p className="mt-1 text-base">{user.title || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">뱃지</p>
              <Badge className="mt-1">{user.badge || '없음'}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">자기소개</p>
              <p className="mt-1 text-base whitespace-pre-line">{user.bio || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* 2. 플레이 정보 카드 */}
        <Card className="w-[17rem]">
          <CardHeader>
            <CardTitle>플레이 정보</CardTitle>
            <CardDescription>게임 관련 정보를 확인하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">플레이 횟수</p>
              <p className="mt-1 text-base">{user.playCount ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">평균 플레이 시간</p>
              <p className="mt-1 text-base">{user.averagePlayTime ?? '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* 3. 출석 체크 카드 */}
        <Card className="w-[17rem]">
          <CardHeader>
            <CardTitle>출석 체크</CardTitle>
            <CardDescription>오늘 출석을 기록하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="attendance"
                className="h-4 w-4"
                checked={user.attendedToday}
                readOnly
              />
              <label htmlFor="attendance" className="text-sm text-muted-foreground">
                {user.attendedToday ? '출석 완료' : '아직 출석하지 않음'}
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
