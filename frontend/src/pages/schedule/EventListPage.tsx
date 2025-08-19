import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter } from 'lucide-react';
import { EventList } from '@/components/schedule/common';
import { 
  scheduleService, 
  schedulePublicService, 
  EventStatus, 
  EventCategory,
  EventFilters 
} from '@/api/schedule';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

/**
 * 일정 목록 페이지
 * - 전체 일정 조회
 * - 필터링 및 검색
 * - 일정 참여 기능
 */
const EventListPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // 필터 상태
  const [filters, setFilters] = useState<EventFilters>({
    category: searchParams.get('category') || undefined,
    status: (searchParams.get('status') as EventStatus) || undefined,
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    size: parseInt(searchParams.get('size') || '12'),
  });

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);

  // 일정 목록 조회 (공개 API 사용)
  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['schedule', 'events', 'public', filters],
    queryFn: () => schedulePublicService.getPublicEvents(filters),
    staleTime: 2 * 60 * 1000, // 2분
  });

  // 일정 참여 Mutation
  const joinMutation = useMutation({
    mutationFn: (eventId: string) => scheduleService.joinEvent(eventId),
    onMutate: (eventId) => {
      setJoiningEventId(eventId);
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', 'my-events'] });
      toast({
        title: '참여 완료! 🎉',
        description: '일정 참여가 완료되었습니다.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '참여 실패',
        description: error?.response?.data?.message || '일정 참여 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setJoiningEventId(null);
    },
  });

  // 필터 업데이트 함수
  const updateFilters = (newFilters: Partial<EventFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    
    // URL 파라미터 업데이트
    const params = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });
    setSearchParams(params);
  };

  // 검색 실행
  const handleSearch = () => {
    updateFilters({ search: searchInput });
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      size: 12,
    });
    setSearchInput('');
    setSearchParams({});
  };

  // 일정 생성 페이지로 이동
  const handleCreateEvent = () => {
    navigate('/dashboard/schedule/create');
  };

  // 일정 상세 페이지로 이동
  const handleViewDetails = (eventId: string) => {
    navigate(`/dashboard/schedule/events/${eventId}`);
  };

  // 일정 참여
  const handleJoinEvent = (eventId: string) => {
    if (!isAuthenticated) {
      toast({
        title: '로그인 필요',
        description: '일정 참여를 위해 로그인해주세요.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
    joinMutation.mutate(eventId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">전체 일정</h1>
          <p className="text-muted-foreground mt-1">
            Crime-Cat 커뮤니티의 모든 일정을 확인하고 참여하세요
          </p>
        </div>
        
        {isAuthenticated && (
          <Button onClick={handleCreateEvent} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            새 일정 만들기
          </Button>
        )}
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            필터 & 검색
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 검색 */}
            <div className="flex gap-2">
              <Input
                placeholder="일정 제목 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon" variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* 카테고리 필터 */}
            <Select
              value={filters.category || ''}
              onValueChange={(value) => updateFilters({ category: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                <SelectItem value={EventCategory.MEETING}>모임</SelectItem>
                <SelectItem value={EventCategory.WORKSHOP}>워크샵</SelectItem>
                <SelectItem value={EventCategory.GAMING}>게임</SelectItem>
                <SelectItem value={EventCategory.SOCIAL}>소셜</SelectItem>
                <SelectItem value={EventCategory.STUDY}>스터디</SelectItem>
                <SelectItem value={EventCategory.OTHER}>기타</SelectItem>
              </SelectContent>
            </Select>

            {/* 상태 필터 */}
            <Select
              value={filters.status || ''}
              onValueChange={(value) => updateFilters({ status: (value as EventStatus) || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                <SelectItem value={EventStatus.RECRUITING}>모집 중</SelectItem>
                <SelectItem value={EventStatus.RECRUITMENT_COMPLETE}>모집 완료</SelectItem>
                <SelectItem value={EventStatus.COMPLETED}>완료</SelectItem>
                <SelectItem value={EventStatus.CANCELLED}>취소</SelectItem>
              </SelectContent>
            </Select>

            {/* 초기화 버튼 */}
            <Button variant="outline" onClick={handleResetFilters}>
              필터 초기화
            </Button>
          </div>

          {/* 적용된 필터 표시 */}
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.search && (
              <Badge variant="secondary">
                검색: "{filters.search}"
              </Badge>
            )}
            {filters.category && (
              <Badge variant="secondary">
                카테고리: {filters.category}
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary">
                상태: {filters.status}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 일정 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>
            일정 목록 ({events?.length || 0}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EventList
            events={events || []}
            isLoading={isLoading}
            showJoinButton={true}
            onJoin={handleJoinEvent}
            onViewDetails={handleViewDetails}
            joiningEventId={joiningEventId}
            emptyMessage="조건에 맞는 일정이 없습니다."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EventListPage;