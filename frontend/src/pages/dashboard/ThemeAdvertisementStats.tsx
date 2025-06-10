import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { advertisementStatsService } from '@/api/stats/advertisementStatsService';
import UserStatsSummaryCard from '@/components/advertisement/stats/UserStatsSummaryCard';
import AdvertisementStatsTable from '@/components/advertisement/stats/AdvertisementStatsTable';
import PlatformStatsCard from '@/components/advertisement/stats/PlatformStatsCard';
import { Button } from '@/components/ui/button';

const ThemeAdvertisementStats: React.FC = () => {
  const [activeTab, setActiveTab] = useState("my-stats");

  // 내 광고 요약 통계
  const { 
    data: mySummary, 
    isLoading: isSummaryLoading, 
    error: summaryError,
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['advertisement-stats', 'my-summary'],
    queryFn: advertisementStatsService.getMyAdvertisementSummary,
    staleTime: 30000, // 30초 캐시
  });

  // 내 광고 상세 통계
  const { 
    data: myStats, 
    isLoading: isStatsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['advertisement-stats', 'my-ads'],
    queryFn: advertisementStatsService.getMyAdvertisementStats,
    staleTime: 30000,
  });

  // 플랫폼 통계
  const { 
    data: platformStats, 
    isLoading: isPlatformLoading, 
    error: platformError,
    refetch: refetchPlatform 
  } = useQuery({
    queryKey: ['advertisement-stats', 'platform'],
    queryFn: advertisementStatsService.getPlatformStats,
    staleTime: 60000, // 1분 캐시
  });

  const handleRefresh = () => {
    refetchSummary();
    refetchStats();
    refetchPlatform();
  };

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );

  const ErrorDisplay = ({ error, onRetry }: { error: any, onRetry: () => void }) => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>데이터를 불러오는데 실패했습니다: {error.message}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3 w-3 mr-1" />
          다시 시도
        </Button>
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              광고 통계
            </h1>
            <p className="text-muted-foreground mt-1">
              테마 광고의 성과와 트렌드를 분석해보세요
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-stats" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              내 광고 통계
            </TabsTrigger>
            <TabsTrigger value="platform-stats" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              플랫폼 통계
            </TabsTrigger>
          </TabsList>

          {/* 내 광고 통계 탭 */}
          <TabsContent value="my-stats" className="space-y-6">
            {(isSummaryLoading || isStatsLoading) && <LoadingSkeleton />}
            
            {summaryError && (
              <ErrorDisplay 
                error={summaryError} 
                onRetry={() => {
                  refetchSummary();
                  refetchStats();
                }} 
              />
            )}

            {mySummary && !isSummaryLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <UserStatsSummaryCard summary={mySummary} />
              </motion.div>
            )}

            {myStats && !isStatsLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <AdvertisementStatsTable stats={myStats} />
              </motion.div>
            )}

            {!isSummaryLoading && !isStatsLoading && myStats?.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">광고 통계가 없습니다</h3>
                  <p className="text-muted-foreground mb-4">
                    테마 광고를 신청하시면 여기서 성과를 확인할 수 있습니다.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/dashboard/theme-ads'}
                    className="mt-2"
                  >
                    광고 신청하기
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 플랫폼 통계 탭 */}
          <TabsContent value="platform-stats" className="space-y-6">
            {isPlatformLoading && <LoadingSkeleton />}
            
            {platformError && (
              <ErrorDisplay 
                error={platformError} 
                onRetry={refetchPlatform} 
              />
            )}

            {platformStats && !isPlatformLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <PlatformStatsCard stats={platformStats} />
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default ThemeAdvertisementStats;