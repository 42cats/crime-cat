import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Trophy, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { integratedHistoryService } from '@/api/game';
import { 
  IntegratedGameHistoryFilterRequest, 
  GameType,
  SortOption,
  SortDirection,
  IntegratedGameHistoryResponse
} from '@/types/integratedGameHistory';
import { UnifiedGameFilters } from '@/components/game/common/UnifiedGameFilters';
import { GameStatisticsCard } from '@/components/game/common/GameStatisticsCard';
import { EscapeRoomHistoryCard } from '@/components/game/common/EscapeRoomHistoryCard';
import GameHistoryItem from '@/components/game/GameHistoryItem';
import { CrimeSceneTab, EscapeRoomTab, UnplayedThemesTab } from '@/components/game/tabs';

const PAGE_SIZE = 20;

const UserGameHistoryPageV2: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // URL 쿼리 파라미터 파싱
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab') || 'all';
  const pageParam = queryParams.get('page');

  const [activeTab, setActiveTab] = useState(tabParam);
  const [filter, setFilter] = useState<IntegratedGameHistoryFilterRequest>({
    page: pageParam ? parseInt(pageParam) : 0,
    size: PAGE_SIZE,
    sortBy: SortOption.CREATED_AT,  // PLAY_DATE 대신 CREATED_AT 사용 (백엔드 버그 회피)
    sortDirection: SortDirection.DESC,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // URL 업데이트
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    if (filter.page && filter.page > 0) params.set('page', filter.page.toString());
    
    const newSearch = params.toString();
    const path = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    navigate(path, { replace: true });
  }, [activeTab, filter.page, navigate, location.pathname]);

  // 탭 변경 시 필터 업데이트
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    let gameType: GameType | undefined;
    
    switch (value) {
      case 'crimescene':
        gameType = GameType.CRIMESCENE;
        break;
      case 'escaperoom':
        gameType = GameType.ESCAPE_ROOM;
        break;
      case 'unplayed':
        // 미플레이 테마 탭은 별도 구현
        return;
      default:
        gameType = undefined;
    }
    
    setFilter(prev => ({
      ...prev,
      gameType,
      page: 0,
    }));
  };

  // 통합 게임 기록 조회
  const { data, isLoading, error, refetch } = useQuery<IntegratedGameHistoryResponse>({
    queryKey: ['integrated-game-history', user?.id, filter],
    queryFn: () => integratedHistoryService.getUserGameHistories(user!.id, filter),
    enabled: !!user?.id && activeTab !== 'unplayed',
  });

  const handleFilterChange = (newFilter: IntegratedGameHistoryFilterRequest) => {
    setFilter(newFilter);
  };

  const handleSearch = () => {
    setFilter(prev => ({ ...prev, page: 0 }));
  };

  const handleReset = () => {
    setFilter({
      page: 0,
      size: PAGE_SIZE,
      sortBy: SortOption.CREATED_AT,  // PLAY_DATE 대신 CREATED_AT 사용 (백엔드 버그 회피)
      sortDirection: SortDirection.DESC,
      gameType: activeTab === 'crimescene' ? GameType.CRIMESCENE : 
                activeTab === 'escaperoom' ? GameType.ESCAPE_ROOM : undefined,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilter(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  const handleCompareClick = () => {
    navigate('/game-comparison');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold">내 게임 기록</h1>
            <p className="text-muted-foreground mt-2">
              플레이한 모든 게임의 기록을 한 곳에서 확인하세요
            </p>
          </div>
          <Button onClick={handleCompareClick} variant="outline" className="gap-2">
            <Users className="w-4 h-4" />
            친구와 비교
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="all">전체 기록</TabsTrigger>
          <TabsTrigger value="crimescene">크라임씬</TabsTrigger>
          <TabsTrigger value="escaperoom">방탈출</TabsTrigger>
          <TabsTrigger value="unplayed">미플레이 테마</TabsTrigger>
        </TabsList>

        {/* 전체 기록 탭 */}
        <TabsContent value="all" className="space-y-6">
          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <UnifiedGameFilters
                  filter={filter}
                  onFilterChange={handleFilterChange}
                  onSearch={handleSearch}
                  onReset={handleReset}
                  showGameTypeSelector
                />
              </div>
              <div className="lg:col-span-1">
                <GameStatisticsCard statistics={data.statistics} />
              </div>
            </div>
          )}

          {isLoading ? (
            <Card>
              <CardContent className="py-20">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">게임 기록을 불러오는 중...</p>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-20">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-destructive mb-4">데이터를 불러오는 중 오류가 발생했습니다.</p>
                  <Button onClick={() => refetch()}>다시 시도</Button>
                </div>
              </CardContent>
            </Card>
          ) : data && (
            <>
              {/* 결과 요약 */}
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  총 {data.pageInfo.totalElements}개의 기록
                </p>
              </div>

              {/* 기록 목록 */}
              <div className="space-y-4">
                {/* 크라임씬 기록 */}
                {data.crimeSceneHistories.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      크라임씬
                    </h3>
                    {data.crimeSceneHistories.map((history) => (
                      <GameHistoryItem
                        key={history.id}
                        history={{
                          uuid: history.id,
                          guildSnowflake: history.guildId || '',
                          userSnowflake: history.userId,
                          playerName: history.userNickname,
                          win: history.isWin,
                          createdAt: history.playDate,
                          characterName: '',
                          memo: history.memo || '',
                          themeId: history.crimesceneThemeId || null,
                          themeName: history.crimesceneThemeTitle || null,
                          guildName: history.guildName || '',
                        }}
                        onEdit={() => {}}
                        isMobile={false}
                      />
                    ))}
                  </div>
                )}

                {/* 방탈출 기록 */}
                {data.escapeRoomHistories.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      방탈출
                    </h3>
                    {data.escapeRoomHistories.map((history) => (
                      <EscapeRoomHistoryCard
                        key={history.id}
                        history={history}
                        onClick={() => navigate(`/escape-room/history/${history.id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 페이지네이션 */}
              {data.pageInfo.totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(filter.page! - 1)}
                    disabled={!data.pageInfo.hasPrevious}
                  >
                    이전
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {data.pageInfo.currentPage + 1} / {data.pageInfo.totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(filter.page! + 1)}
                    disabled={!data.pageInfo.hasNext}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* 크라임씬 탭 */}
        <TabsContent value="crimescene">
          <CrimeSceneTab />
        </TabsContent>

        {/* 방탈출 탭 */}
        <TabsContent value="escaperoom">
          <EscapeRoomTab />
        </TabsContent>

        {/* 미플레이 테마 탭 */}
        <TabsContent value="unplayed">
          <UnplayedThemesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};



export default UserGameHistoryPageV2;
