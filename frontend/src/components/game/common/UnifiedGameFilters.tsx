import React from 'react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { X, Search, Filter } from 'lucide-react';
import { 
  GameType, 
  SortOption, 
  SortDirection, 
  SuccessStatusFilter,
  IntegratedGameHistoryFilterRequest 
} from '@/types/integratedGameHistory';

interface UnifiedGameFiltersProps {
  filter: IntegratedGameHistoryFilterRequest;
  onFilterChange: (filter: IntegratedGameHistoryFilterRequest) => void;
  onSearch: () => void;
  onReset: () => void;
  gameType?: GameType;
  showGameTypeSelector?: boolean;
}

export const UnifiedGameFilters: React.FC<UnifiedGameFiltersProps> = ({
  filter,
  onFilterChange,
  onSearch,
  onReset,
  gameType,
  showGameTypeSelector = false,
}) => {
  const updateFilter = (updates: Partial<IntegratedGameHistoryFilterRequest>) => {
    onFilterChange({ ...filter, ...updates });
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    updateFilter({
      startDate: range.from?.toISOString().split('T')[0],
      endDate: range.to?.toISOString().split('T')[0],
    });
  };

  const isEscapeRoom = gameType === GameType.ESCAPE_ROOM || filter.gameType === GameType.ESCAPE_ROOM;
  const isCrimeScene = gameType === GameType.CRIMESCENE || filter.gameType === GameType.CRIMESCENE;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="w-5 h-5" />
          필터
        </h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="w-4 h-4 mr-1" />
          초기화
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 게임 타입 선택 (옵션) */}
        {showGameTypeSelector && (
          <div>
            <Label>게임 타입</Label>
            <Select 
              value={filter.gameType} 
              onValueChange={(value) => updateFilter({ gameType: value as GameType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value={GameType.CRIMESCENE}>크라임씬</SelectItem>
                <SelectItem value={GameType.ESCAPE_ROOM}>방탈출</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 검색어 */}
        <div className="md:col-span-2 lg:col-span-1">
          <Label>검색어</Label>
          <Input
            placeholder="테마명, 길드명, 매장명 검색"
            value={filter.keyword || ''}
            onChange={(e) => updateFilter({ keyword: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>

        {/* 날짜 범위 */}
        <div>
          <Label>플레이 날짜</Label>
          <DateRangePicker
            from={filter.startDate ? new Date(filter.startDate) : undefined}
            to={filter.endDate ? new Date(filter.endDate) : undefined}
            onSelect={handleDateRangeChange}
          />
        </div>

        {/* 승패 필터 (크라임씬) / 성공 상태 (방탈출) */}
        {isCrimeScene && (
          <div>
            <Label>승패</Label>
            <Select 
              value={filter.isWin === undefined ? 'ALL' : filter.isWin ? 'WIN' : 'LOSE'} 
              onValueChange={(value) => {
                if (value === 'ALL') updateFilter({ isWin: undefined });
                else updateFilter({ isWin: value === 'WIN' });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="WIN">승리</SelectItem>
                <SelectItem value="LOSE">패배</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {isEscapeRoom && (
          <div>
            <Label>성공 상태</Label>
            <Select 
              value={filter.successStatus || SuccessStatusFilter.ALL} 
              onValueChange={(value) => updateFilter({ successStatus: value as SuccessStatusFilter })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SuccessStatusFilter.ALL}>전체</SelectItem>
                <SelectItem value={SuccessStatusFilter.SUCCESS_ONLY}>성공만</SelectItem>
                <SelectItem value={SuccessStatusFilter.FAIL_ONLY}>실패만</SelectItem>
                <SelectItem value={SuccessStatusFilter.PARTIAL_ONLY}>부분성공만</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 테마 존재 여부 (크라임씬) */}
        {isCrimeScene && (
          <div className="flex items-center space-x-2">
            <Switch
              id="hasTheme"
              checked={filter.hasTheme || false}
              onCheckedChange={(checked) => updateFilter({ hasTheme: checked })}
            />
            <Label htmlFor="hasTheme">테마 있는 기록만</Label>
          </div>
        )}

        {/* 정렬 옵션 */}
        <div>
          <Label>정렬 기준</Label>
          <Select 
            value={filter.sortBy || SortOption.CREATED_AT}  // PLAY_DATE 대신 CREATED_AT 사용 (백엔드 버그 회피) 
            onValueChange={(value) => updateFilter({ sortBy: value as SortOption })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SortOption.CREATED_AT}>플레이 날짜</SelectItem>
              <SelectItem value={SortOption.CREATED_AT}>기록 생성일</SelectItem>
              <SelectItem value={SortOption.THEME_NAME}>테마명</SelectItem>
              {isCrimeScene && <SelectItem value={SortOption.GUILD_NAME}>길드명</SelectItem>}
              {isEscapeRoom && <SelectItem value={SortOption.STORE_NAME}>매장명</SelectItem>}
              {isEscapeRoom && <SelectItem value={SortOption.CLEAR_TIME}>클리어 시간</SelectItem>}
              {isEscapeRoom && <SelectItem value={SortOption.DIFFICULTY}>난이도</SelectItem>}
              {isEscapeRoom && <SelectItem value={SortOption.FUN_RATING}>재미 평가</SelectItem>}
              {isEscapeRoom && <SelectItem value={SortOption.STORY_RATING}>스토리 평가</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        {/* 정렬 방향 */}
        <div>
          <Label>정렬 순서</Label>
          <Select 
            value={filter.sortDirection || SortDirection.DESC} 
            onValueChange={(value) => updateFilter({ sortDirection: value as SortDirection })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SortDirection.DESC}>내림차순</SelectItem>
              <SelectItem value={SortDirection.ASC}>오름차순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 방탈출 전용 상세 필터 */}
      {isEscapeRoom && (
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-semibold mb-3">방탈출 상세 필터</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 클리어 시간 범위 */}
            <div>
              <Label>클리어 시간 (분)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="최소"
                  value={filter.minClearTime || ''}
                  onChange={(e) => updateFilter({ minClearTime: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-24"
                />
                <span>~</span>
                <Input
                  type="number"
                  placeholder="최대"
                  value={filter.maxClearTime || ''}
                  onChange={(e) => updateFilter({ maxClearTime: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-24"
                />
              </div>
            </div>

            {/* 난이도 범위 */}
            <div>
              <Label>난이도 평가</Label>
              <div className="px-2">
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[filter.minDifficulty || 1, filter.maxDifficulty || 5]}
                  onValueChange={([min, max]) => updateFilter({ minDifficulty: min, maxDifficulty: max })}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{filter.minDifficulty || 1}</span>
                  <span>{filter.maxDifficulty || 5}</span>
                </div>
              </div>
            </div>

            {/* 재미 평가 범위 */}
            <div>
              <Label>재미 평가</Label>
              <div className="px-2">
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[filter.minFunRating || 1, filter.maxFunRating || 5]}
                  onValueChange={([min, max]) => updateFilter({ minFunRating: min, maxFunRating: max })}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{filter.minFunRating || 1}</span>
                  <span>{filter.maxFunRating || 5}</span>
                </div>
              </div>
            </div>

            {/* 스토리 평가 범위 */}
            <div>
              <Label>스토리 평가</Label>
              <div className="px-2">
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[filter.minStoryRating || 1, filter.maxStoryRating || 5]}
                  onValueChange={([min, max]) => updateFilter({ minStoryRating: min, maxStoryRating: max })}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{filter.minStoryRating || 1}</span>
                  <span>{filter.maxStoryRating || 5}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 검색 버튼 */}
      <div className="flex justify-end pt-4">
        <Button onClick={onSearch} className="gap-2">
          <Search className="w-4 h-4" />
          검색
        </Button>
      </div>
    </div>
  );
};
