import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Map } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { integratedHistoryService } from '@/api/game';
import { 
  IntegratedGameHistoryFilterRequest, 
  GameType,
  IntegratedGameHistoryResponse,
  SortOption,
  SortDirection 
} from '@/types/integratedGameHistory';
import { UnifiedGameFilters } from '@/components/game/common/UnifiedGameFilters';
import { EscapeRoomHistoryCard } from '@/components/game/common/EscapeRoomHistoryCard';

interface EscapeRoomTabProps {
  initialFilter?: Partial<IntegratedGameHistoryFilterRequest>;
}

export const EscapeRoomTab: React.FC<EscapeRoomTabProps> = ({ initialFilter }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<IntegratedGameHistoryFilterRequest>({
    gameType: GameType.ESCAPE_ROOM,
    page: 0,
    size: 20,
    sortBy: SortOption.CREATED_AT,  // PLAY_DATE 대신 CREATED_AT 사용 (백엔드 버그 회피)
    sortDirection: SortDirection.DESC,
    ...initialFilter,
  });

  const { data, isLoading, error, refetch } = useQuery<IntegratedGameHistoryResponse>({
    queryKey: ['escaperoom-history', user?.id, filter],
    queryFn: () => integratedHistoryService.getEscapeRoomHistories(user!.id, filter),
    enabled: !!user?.id,
  });

  const handleFilterChange = (newFilter: IntegratedGameHistoryFilterRequest) => {
    setFilter(newFilter);
  };

  const handleSearch = () => {
    setFilter(prev => ({ ...prev, page: 0 }));
  };

  const handleReset = () => {
    setFilter({
      gameType: GameType.ESCAPE_ROOM,
      page: 0,
      size: 20,
      sortBy: SortOption.CREATED_AT,  // PLAY_DATE 대신 CREATED_AT 사용 (백엔드 버그 회피)
      sortDirection: SortDirection.DESC,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilter(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-20">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">방탈출 기록을 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-20">
          <div className="flex flex-col items-center justify-center">
            <p className="text-destructive mb-4">데이터를 불러오는 중 오류가 발생했습니다.</p>
            <Button onClick={() => refetch()}>다시 시도</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <UnifiedGameFilters
        filter={filter}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
        gameType={GameType.ESCAPE_ROOM}
      />

      {/* 통계 요약 */}
      {data && data.statistics.escapeRoom && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">총 플레이</p>
              <p className="text-2xl font-bold">{data.statistics.escapeRoom.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">고유 테마</p>
              <p className="text-2xl font-bold">{data.statistics.escapeRoom.unique}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">성공</p>
              <p className="text-2xl font-bold text-green-600">{data.statistics.escapeRoom.winCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">실패</p>
              <p className="text-2xl font-bold text-red-600">
                {data.statistics.escapeRoom.total - data.statistics.escapeRoom.winCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">성공률</p>
              <p className="text-2xl font-bold">{data.statistics.escapeRoom.winRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 결과 */}
      {data && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              총 {data.pageInfo.totalElements}개의 방탈출 기록
            </p>
          </div>

          {/* 기록 목록 */}
          {data.escapeRoomHistories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center">
                  <Map className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-2">방탈출 기록이 없습니다.</p>
                  <p className="text-sm text-muted-foreground">방탈출을 플레이하면 기록이 표시됩니다.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.escapeRoomHistories.map((history) => (
                <EscapeRoomHistoryCard
                  key={history.id}
                  history={history}
                  onClick={() => navigate(`/escape-room/history/${history.id}`)}
                />
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {data.pageInfo.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
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
    </div>
  );
};
