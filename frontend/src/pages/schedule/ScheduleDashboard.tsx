import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Users, Clock } from 'lucide-react';
import { EventList } from '@/components/schedule/common';
import { scheduleService, schedulePublicService, EventStatus } from '@/api/schedule';
import { useAuth } from '@/hooks/useAuth';

/**
 * 일정 관리 대시보드 페이지
 * - 최근 일정 개요
 * - 빠른 액션 버튼
 * - 참여 예정 일정
 * - 생성한 일정
 */
const ScheduleDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 모집 중인 일정 조회 (공개)
  const { data: recruitingEvents, isLoading: recruitingLoading } = useQuery({
    queryKey: ['schedule', 'recruiting', 'public'],
    queryFn: () => schedulePublicService.getRecruitingEvents(),
    staleTime: 2 * 60 * 1000, // 2분
  });

  // 내가 참여한 일정 (인증된 사용자만)
  const { data: myEvents, isLoading: myEventsLoading } = useQuery({
    queryKey: ['schedule', 'my-events'],
    queryFn: () => scheduleService.getMyEvents(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 내가 생성한 일정 (인증된 사용자만)
  const { data: createdEvents, isLoading: createdLoading } = useQuery({
    queryKey: ['schedule', 'created-events'],
    queryFn: () => scheduleService.getCreatedEvents(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5분
  });

  const handleCreateEvent = () => {
    navigate('/dashboard/schedule/create');
  };

  const handleViewAllEvents = () => {
    navigate('/dashboard/schedule/events');
  };

  const handleViewDetails = (eventId: string) => {
    navigate(`/dashboard/schedule/events/${eventId}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">일정 관리</h1>
          <p className="text-muted-foreground mt-1">
            Crime-Cat 커뮤니티 일정을 관리하고 참여하세요
          </p>
        </div>
        
        {isAuthenticated && (
          <Button onClick={handleCreateEvent} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            새 일정 만들기
          </Button>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">모집 중인 일정</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recruitingEvents?.length || 0}개
            </div>
            <p className="text-xs text-muted-foreground">
              현재 참여 가능한 일정
            </p>
          </CardContent>
        </Card>

        {isAuthenticated && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">내 참여 일정</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myEvents?.length || 0}개
                </div>
                <p className="text-xs text-muted-foreground">
                  참여 중인 일정
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">내가 만든 일정</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {createdEvents?.length || 0}개
                </div>
                <p className="text-xs text-muted-foreground">
                  생성한 일정
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 모집 중인 일정 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>🔥 모집 중인 일정</CardTitle>
          <Button variant="outline" size="sm" onClick={handleViewAllEvents}>
            전체 보기
          </Button>
        </CardHeader>
        <CardContent>
          <EventList
            events={recruitingEvents?.slice(0, 6) || []}
            isLoading={recruitingLoading}
            showJoinButton={isAuthenticated}
            onViewDetails={handleViewDetails}
            emptyMessage="현재 모집 중인 일정이 없습니다."
          />
        </CardContent>
      </Card>

      {/* 내 일정 (인증된 사용자만) */}
      {isAuthenticated && (
        <>
          {/* 내가 참여한 일정 */}
          <Card>
            <CardHeader>
              <CardTitle>📅 내가 참여한 일정</CardTitle>
            </CardHeader>
            <CardContent>
              <EventList
                events={myEvents?.slice(0, 3) || []}
                isLoading={myEventsLoading}
                showJoinButton={false}
                onViewDetails={handleViewDetails}
                emptyMessage="참여한 일정이 없습니다."
              />
            </CardContent>
          </Card>

          {/* 내가 생성한 일정 */}
          <Card>
            <CardHeader>
              <CardTitle>🎯 내가 만든 일정</CardTitle>
            </CardHeader>
            <CardContent>
              <EventList
                events={createdEvents?.slice(0, 3) || []}
                isLoading={createdLoading}
                showJoinButton={false}
                onViewDetails={handleViewDetails}
                emptyMessage="생성한 일정이 없습니다."
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* 비로그인 사용자 안내 */}
      {!isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle>🚀 더 많은 기능을 이용해보세요!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              로그인하시면 일정을 만들고, 참여하고, 관리할 수 있습니다.
            </p>
            <Button onClick={() => navigate('/login')}>
              로그인하기
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduleDashboard;