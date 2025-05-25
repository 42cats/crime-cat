import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Users, MapPin, Clock, DollarSign, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { gameComparisonService } from '@/api/game';
import { 
  GameComparisonRequest,
  GameComparisonResponse,
  ComparisonSortOption,
  UnplayedTheme
} from '@/types/gameComparison';
import { GameType } from '@/types/integratedGameHistory';
import { cn } from '@/lib/utils';

export const UnplayedThemesTab: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeGameType, setActiveGameType] = useState<'crimescene' | 'escaperoom'>('crimescene');
  const [filter, setFilter] = useState<Partial<GameComparisonRequest>>({
    gameType: GameType.CRIMESCENE,
    page: 0,
    size: 20,
    sortBy: ComparisonSortOption.RECOMMENDATION,
    operatingOnly: true,
  });
  const [searchKeyword, setSearchKeyword] = useState('');

  const { data, isLoading, error, refetch } = useQuery<GameComparisonResponse>({
    queryKey: ['unplayed-themes', user?.id, activeGameType, filter],
    queryFn: () => gameComparisonService.compareGameHistories({
      userIds: [user!.id],
      gameType: activeGameType === 'crimescene' ? GameType.CRIMESCENE : GameType.ESCAPE_ROOM,
      ...filter,
    } as GameComparisonRequest),
    enabled: !!user?.id,
  });

  const handleGameTypeChange = (value: string) => {
    setActiveGameType(value as 'crimescene' | 'escaperoom');
    setFilter(prev => ({
      ...prev,
      gameType: value === 'crimescene' ? GameType.CRIMESCENE : GameType.ESCAPE_ROOM,
      page: 0,
    }));
  };

  const handleSortChange = (value: ComparisonSortOption) => {
    setFilter(prev => ({ ...prev, sortBy: value, page: 0 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilter(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  const handleThemeClick = (theme: UnplayedTheme) => {
    if (theme.gameType === GameType.CRIMESCENE) {
      navigate(`/themes/crimescene/${theme.id}`);
    } else {
      navigate(`/themes/escape-room/${theme.id}`);
    }
  };

  const handleRegionChange = (region: string) => {
    setFilter(prev => ({ ...prev, region: region === 'all' ? undefined : region, page: 0 }));
  };

  const filteredThemes = data?.unplayedThemes.filter(theme => 
    !searchKeyword || 
    theme.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    theme.guildName?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    theme.locations?.some(loc => 
      loc.storeName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      loc.region.toLowerCase().includes(searchKeyword.toLowerCase())
    )
  ) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-20">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">미플레이 테마를 분석하는 중...</p>
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
      <Tabs value={activeGameType} onValueChange={handleGameTypeChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="crimescene">크라임씬</TabsTrigger>
          <TabsTrigger value="escaperoom">방탈출</TabsTrigger>
        </TabsList>

        <TabsContent value="crimescene" className="space-y-6 mt-6">
          {/* 필터 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                필터 및 정렬
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>검색</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="테마명, 길드명 검색"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>정렬</Label>
                  <Select value={filter.sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ComparisonSortOption.RECOMMENDATION}>추천순</SelectItem>
                      <SelectItem value={ComparisonSortOption.LATEST}>최신순</SelectItem>
                      <SelectItem value={ComparisonSortOption.VIEW_COUNT}>조회순</SelectItem>
                      <SelectItem value={ComparisonSortOption.PLAY_COUNT}>플레이순</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 통계 */}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">전체 테마</p>
                  <p className="text-2xl font-bold">{data.totalThemeCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">미플레이</p>
                  <p className="text-2xl font-bold text-orange-600">{data.commonUnplayedCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">플레이 완료</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data.totalThemeCount - data.commonUnplayedCount}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">완료율</p>
                  <p className="text-2xl font-bold">
                    {((data.totalThemeCount - data.commonUnplayedCount) / data.totalThemeCount * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 테마 목록 */}
          <div className="space-y-4">
            {filteredThemes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">검색 결과가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              filteredThemes.map((theme) => (
                <Card 
                  key={theme.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleThemeClick(theme)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={theme.thumbnail || '/images/theme-default.jpg'}
                        alt={theme.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{theme.title}</h3>
                            {theme.guildName && (
                              <p className="text-sm text-muted-foreground">{theme.guildName}</p>
                            )}
                          </div>
                          <Badge variant="secondary">난이도 {theme.difficulty}</Badge>
                        </div>
                        {theme.summary && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{theme.summary}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {theme.playersMin}-{theme.playersMax}명
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {theme.playTimeMin}-{theme.playTimeMax}분
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {theme.price.toLocaleString()}원
                          </span>
                        </div>
                        {theme.tags && theme.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {theme.tags.slice(0, 5).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* 페이지네이션 */}
          {data && data.pageInfo.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange((filter.page || 0) - 1)}
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
                onClick={() => handlePageChange((filter.page || 0) + 1)}
                disabled={!data.pageInfo.hasNext}
              >
                다음
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="escaperoom" className="space-y-6 mt-6">
          {/* 방탈출 필터 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                필터 및 정렬
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>검색</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="테마명, 매장명 검색"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>지역</Label>
                  <Select value={filter.region || 'all'} onValueChange={handleRegionChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="홍대">홍대</SelectItem>
                      <SelectItem value="강남">강남</SelectItem>
                      <SelectItem value="건대">건대</SelectItem>
                      <SelectItem value="신촌">신촌</SelectItem>
                      <SelectItem value="명동">명동</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>정렬</Label>
                  <Select value={filter.sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ComparisonSortOption.RECOMMENDATION}>추천순</SelectItem>
                      <SelectItem value={ComparisonSortOption.LATEST}>최신순</SelectItem>
                      <SelectItem value={ComparisonSortOption.VIEW_COUNT}>조회순</SelectItem>
                      <SelectItem value={ComparisonSortOption.PLAY_COUNT}>플레이순</SelectItem>
                      <SelectItem value={ComparisonSortOption.DIFFICULTY_ASC}>난이도 낮은순</SelectItem>
                      <SelectItem value={ComparisonSortOption.DIFFICULTY_DESC}>난이도 높은순</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 방탈출 테마 목록은 크라임씬과 유사하게 구현 */}
          <div className="space-y-4">
            {filteredThemes.filter(t => t.gameType === GameType.ESCAPE_ROOM).map((theme) => (
              <Card 
                key={theme.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleThemeClick(theme)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={theme.thumbnail || '/images/escape-room-default.jpg'}
                      alt={theme.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{theme.title}</h3>
                          {theme.locations && theme.locations[0] && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {theme.locations[0].storeName} ({theme.locations[0].region})
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">난이도 {theme.difficulty}</Badge>
                          {theme.isOperating && (
                            <Badge variant="default">운영중</Badge>
                          )}
                        </div>
                      </div>
                      {theme.summary && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{theme.summary}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {theme.playersMin}-{theme.playersMax}명
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {theme.playTimeMin}-{theme.playTimeMax}분
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {theme.price.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
