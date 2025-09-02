import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  Calendar,
  Users,
  Clock,
  Trophy,
  X
} from 'lucide-react';
import { EventList } from '@/components/schedule/common';
import { EventCategory, EventStatus } from '@/api/schedule/types';
import { useAuth } from '@/hooks/useAuth';
import { 
  mockRecruitingEvents,
  mockMyEvents, 
  mockCreatedEvents,
  mockCompletedEvents,
  getEventsByCategory,
  getEventsByStatus,
  searchEvents,
  sortEvents,
  SortOption,
  mockParticipantCounts
} from '@/data/mockScheduleData';

/**
 * 일정 메인 페이지 (메인 레이아웃)
 * - 탭별 일정 분류 (모집중, 참여중, 만든일정, 완료일정)
 * - 검색 및 필터링
 * - 정렬 기능
 * - 더미 데이터로 완전 구현
 */
const SchedulePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // 상태 관리
  const [activeTab, setActiveTab] = useState('recruiting');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | ''>('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [showFilters, setShowFilters] = useState(false);

  // 탭별 데이터 가져오기
  const getEventsForTab = (tab: string) => {
    switch (tab) {
      case 'recruiting':
        return mockRecruitingEvents;
      case 'joined':
        return isAuthenticated ? mockMyEvents : [];
      case 'created':
        return isAuthenticated ? mockCreatedEvents : [];
      case 'completed':
        return mockCompletedEvents;
      default:
        return mockRecruitingEvents;
    }
  };

  // 필터링 및 정렬된 이벤트 데이터
  const filteredAndSortedEvents = useMemo(() => {
    let events = getEventsForTab(activeTab);
    
    // 검색 필터링
    if (searchQuery) {
      events = events.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 카테고리 필터링
    if (selectedCategory && selectedCategory !== 'ALL') {
      events = events.filter(event => event.category === selectedCategory);
    }
    
    // 상태 필터링
    if (selectedStatus) {
      events = events.filter(event => event.status === selectedStatus);
    }
    
    // 정렬
    return sortEvents(events, sortBy);
  }, [activeTab, searchQuery, selectedCategory, selectedStatus, sortBy, isAuthenticated]);

  // 카테고리 한글 변환
  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      ALL: '전체',
      MEETING: '모임',
      WORKSHOP: '워크샵',
      GAMING: '게임',
      SOCIAL: '소셜',
      STUDY: '스터디',
      OTHER: '기타',
    };
    return categoryMap[category] || category;
  };

  // 상태 한글 변환
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      RECRUITING: '모집중',
      RECRUITMENT_COMPLETE: '모집완료',
      COMPLETED: '완료',
      CANCELLED: '취소',
    };
    return statusMap[status] || status;
  };

  // 정렬 옵션 한글 변환
  const getSortLabel = (sort: string) => {
    const sortMap: Record<string, string> = {
      latest: '최신순',
      oldest: '오래된순',
      title: '제목순',
      category: '카테고리순',
      participants: '참여자순',
    };
    return sortMap[sort] || sort;
  };

  // 핸들러 함수들
  const handleCreateEvent = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/dashboard/schedule/create');
  };

  const handleViewDetails = (eventId: string) => {
    navigate(`/dashboard/schedule/events/${eventId}`);
  };

  const handleJoinEvent = (eventId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // TODO: 실제 참여 로직 구현
    console.log('Joining event:', eventId);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSortBy('latest');
  };

  const activeFiltersCount = [searchQuery, selectedCategory, selectedStatus].filter(Boolean).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Crime-Cat 일정</h1>
          <p className="text-muted-foreground mt-1">
            커뮤니티 일정을 확인하고 참여하세요
          </p>
        </div>
        
        <div className="flex gap-2">
          {isAuthenticated && (
            <Button onClick={() => navigate('/dashboard/schedule')} variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              내 캘린더
            </Button>
          )}
          <Button onClick={handleCreateEvent} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            새 일정 만들기
          </Button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              검색 & 필터
            </CardTitle>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount}개 필터 적용
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? '필터 숨기기' : '고급 필터'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 검색바 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="일정 제목이나 내용으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 고급 필터 */}
          {showFilters && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 카테고리 필터 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">카테고리</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="전체 카테고리" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">전체</SelectItem>
                      {Object.values(EventCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {getCategoryLabel(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 상태 필터 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">상태</label>
                  <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as EventStatus | '')}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="전체 상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">전체</SelectItem>
                      {Object.values(EventStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {getStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 정렬 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">정렬</label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">최신순</SelectItem>
                      <SelectItem value="oldest">오래된순</SelectItem>
                      <SelectItem value="title">제목순</SelectItem>
                      <SelectItem value="category">카테고리순</SelectItem>
                      <SelectItem value="participants">참여자순</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 필터 초기화 */}
              <div className="flex justify-center sm:justify-end">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  필터 초기화
                </Button>
              </div>
            </div>
          )}

          {/* 적용된 필터 표시 */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  검색: "{searchQuery}"
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  카테고리: {getCategoryLabel(selectedCategory)}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setSelectedCategory('')}
                  />
                </Badge>
              )}
              {selectedStatus && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  상태: {getStatusLabel(selectedStatus)}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setSelectedStatus('')}
                  />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 탭 기반 일정 목록 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recruiting" className="flex items-center gap-1 text-xs sm:text-sm">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">모집중</span>
            <span className="sm:hidden">모집</span>
            <span className="hidden md:inline">({mockRecruitingEvents.length})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="joined" 
            disabled={!isAuthenticated}
            className="flex items-center gap-1 text-xs sm:text-sm"
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">참여중</span>
            <span className="sm:hidden">참여</span>
            <span className="hidden md:inline">({isAuthenticated ? mockMyEvents.length : 0})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="created" 
            disabled={!isAuthenticated}
            className="flex items-center gap-1 text-xs sm:text-sm"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">만든일정</span>
            <span className="sm:hidden">생성</span>
            <span className="hidden md:inline">({isAuthenticated ? mockCreatedEvents.length : 0})</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-1 text-xs sm:text-sm">
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">완료</span>
            <span className="sm:hidden">완료</span>
            <span className="hidden md:inline">({mockCompletedEvents.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* 모집 중인 일정 */}
        <TabsContent value="recruiting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🔥 모집 중인 일정 ({filteredAndSortedEvents.length}개)</span>
                <Badge variant="default">참여 가능</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventList
                events={filteredAndSortedEvents}
                isLoading={false}
                showJoinButton={true}
                onJoin={handleJoinEvent}
                onViewDetails={handleViewDetails}
                emptyMessage="조건에 맞는 모집 중인 일정이 없습니다."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 참여 중인 일정 */}
        <TabsContent value="joined" className="space-y-4">
          {!isAuthenticated ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">로그인이 필요합니다</h3>
                <p className="text-muted-foreground mb-4">
                  참여 중인 일정을 확인하려면 로그인해주세요.
                </p>
                <Button onClick={() => navigate('/login')}>
                  로그인하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>📅 참여 중인 일정 ({filteredAndSortedEvents.length}개)</span>
                  <Badge variant="secondary">참여 완료</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EventList
                  events={filteredAndSortedEvents}
                  isLoading={false}
                  showJoinButton={false}
                  onViewDetails={handleViewDetails}
                  emptyMessage="참여 중인 일정이 없습니다."
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 내가 만든 일정 */}
        <TabsContent value="created" className="space-y-4">
          {!isAuthenticated ? (
            <Card>
              <CardContent className="text-center py-12">
                <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">로그인이 필요합니다</h3>
                <p className="text-muted-foreground mb-4">
                  내가 만든 일정을 확인하려면 로그인해주세요.
                </p>
                <Button onClick={() => navigate('/login')}>
                  로그인하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>🎯 내가 만든 일정 ({filteredAndSortedEvents.length}개)</span>
                  <Badge variant="outline">관리 가능</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EventList
                  events={filteredAndSortedEvents}
                  isLoading={false}
                  showJoinButton={false}
                  onViewDetails={handleViewDetails}
                  emptyMessage="만든 일정이 없습니다."
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 완료된 일정 */}
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🏆 완료된 일정 ({filteredAndSortedEvents.length}개)</span>
                <Badge variant="outline">완료</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventList
                events={filteredAndSortedEvents}
                isLoading={false}
                showJoinButton={false}
                onViewDetails={handleViewDetails}
                emptyMessage="완료된 일정이 없습니다."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchedulePage;