import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Activity,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  Trophy,
  Users,
  Target
} from "lucide-react";
import { PlatformAdvertisementStats } from '@/api/stats/advertisementStatsService';

interface PlatformStatsCardProps {
  stats: PlatformAdvertisementStats;
}

const PlatformStatsCard: React.FC<PlatformStatsCardProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getThemeTypeBadge = (type: string) => {
    return type === 'CRIME_SCENE' ? 
      <Badge variant="outline" className="text-red-600">범죄현장</Badge> :
      <Badge variant="outline" className="text-blue-600">방탈출</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 플랫폼 전체 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 광고</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdvertisements}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="text-xs">
                활성 {stats.activeAdvertisements}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                대기 {stats.queuedAdvertisements}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수익</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}P
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              플랫폼 총 광고비
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">플랫폼 CTR</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatPercentage(stats.platformCTR)}
            </div>
            <div className="flex gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {stats.totalExposures.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <MousePointer className="h-3 w-3" />
                {stats.totalClicks.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">벤치마크</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div>
                <div className="text-lg font-semibold">
                  {formatPercentage(stats.averageCTR)}
                </div>
                <div className="text-xs text-muted-foreground">평균 CTR</div>
              </div>
              <div>
                <div className="text-sm">
                  {formatCurrency(Math.round(stats.averageCostPerClick))}P
                </div>
                <div className="text-xs text-muted-foreground">평균 클릭단가</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 인기 테마 순위 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CTR 기준 인기 테마 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              TOP 성과 테마 (CTR 기준)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">순위</TableHead>
                    <TableHead>테마명</TableHead>
                    <TableHead>타입</TableHead>
                    <TableHead className="text-center">CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topPerformingThemes.slice(0, 5).map((theme) => (
                    <TableRow key={`ctr-${theme.rank}`}>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {theme.rank <= 3 ? (
                            <Badge variant="default" className={`
                              ${theme.rank === 1 ? 'bg-yellow-500' : 
                                theme.rank === 2 ? 'bg-gray-400' : 'bg-orange-500'}
                            `}>
                              {theme.rank}
                            </Badge>
                          ) : (
                            <span className="text-sm font-medium">{theme.rank}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="max-w-[150px] truncate">
                          {theme.themeName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getThemeTypeBadge(theme.themeType)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-green-600">
                          {formatPercentage(theme.ctr)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 노출수 기준 인기 테마 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              TOP 활발한 테마 (노출수 기준)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">순위</TableHead>
                    <TableHead>테마명</TableHead>
                    <TableHead>타입</TableHead>
                    <TableHead className="text-center">노출수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.mostActiveThemes.slice(0, 5).map((theme) => (
                    <TableRow key={`exposure-${theme.rank}`}>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {theme.rank <= 3 ? (
                            <Badge variant="default" className={`
                              ${theme.rank === 1 ? 'bg-yellow-500' : 
                                theme.rank === 2 ? 'bg-gray-400' : 'bg-orange-500'}
                            `}>
                              {theme.rank}
                            </Badge>
                          ) : (
                            <span className="text-sm font-medium">{theme.rank}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="max-w-[150px] truncate">
                          {theme.themeName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getThemeTypeBadge(theme.themeType)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-blue-600">
                          {theme.exposureCount.toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlatformStatsCard;