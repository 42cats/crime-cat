import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  Trophy,
  Target,
  Coins
} from "lucide-react";
import { UserAdvertisementSummary } from '@/api/stats/advertisementStatsService';

interface UserStatsSummaryCardProps {
  summary: UserAdvertisementSummary;
}

const UserStatsSummaryCard: React.FC<UserStatsSummaryCardProps> = ({ summary }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 광고 개수 통계 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">광고 현황</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalAdvertisements}</div>
          <div className="flex gap-2 mt-2">
            <Badge variant="default" className="text-xs">
              활성 {summary.activeAdvertisements}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              대기 {summary.queuedAdvertisements}
            </Badge>
            <Badge variant="outline" className="text-xs">
              완료 {summary.completedAdvertisements}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 비용 통계 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">비용 현황</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(summary.netSpent)}P
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            총 지출: {formatCurrency(summary.totalSpent)}P
          </div>
          {summary.totalRefunded > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <Coins className="h-3 w-3" />
              환불: {formatCurrency(summary.totalRefunded)}P
            </div>
          )}
        </CardContent>
      </Card>

      {/* 성과 통계 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">성과 현황</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatPercentage(summary.averageCTR)}
          </div>
          <div className="text-xs text-muted-foreground">평균 클릭률</div>
          <div className="flex gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {summary.totalExposures.toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <MousePointer className="h-3 w-3" />
              {summary.totalClicks.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 효율성 지표 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">효율성</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {summary.averageCostPerClick && (
              <div>
                <div className="text-lg font-semibold">
                  {formatCurrency(Math.round(summary.averageCostPerClick))}P
                </div>
                <div className="text-xs text-muted-foreground">클릭당 비용</div>
              </div>
            )}
            {summary.averageCostPerExposure && (
              <div>
                <div className="text-sm">
                  {formatCurrency(Math.round(summary.averageCostPerExposure))}P
                </div>
                <div className="text-xs text-muted-foreground">노출당 비용</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 최고 성과 테마 */}
      {summary.bestPerformingTheme && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최고 성과 테마</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{summary.bestPerformingTheme}</div>
                <div className="text-sm text-muted-foreground">
                  최고 CTR: {formatPercentage(summary.bestPerformingCTR || 0)}
                </div>
              </div>
              <Badge variant="default" className="bg-yellow-500">
                🏆 베스트
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserStatsSummaryCard;