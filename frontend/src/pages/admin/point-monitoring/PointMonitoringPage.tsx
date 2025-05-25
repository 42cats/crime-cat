import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PointHistoryTable } from "@/components/admin/point-monitoring/PointHistoryTable";
import { SuspiciousActivityCard } from "@/components/admin/point-monitoring/SuspiciousActivityCard";
import { PointStatistics } from "@/components/admin/point-monitoring/PointStatistics";
import { TopPointHolders } from "@/components/admin/point-monitoring/TopPointHolders";
import { adminPointMonitoringService, PointHistoryFilterParams } from "@/api/admin";
import { AlertCircle, TrendingUp, Users, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const PointMonitoringPage: React.FC = () => {
    const { user } = useAuth();
    const [filters, setFilters] = useState<PointHistoryFilterParams>({
        page: 0,
        size: 20,
        sort: ["usedAt,desc"]
    });

    // 권한 체크
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
        return <Navigate to="/dashboard" replace />;
    }

    // 전체 포인트 내역 조회
    const { data: pointHistory, isLoading: historyLoading } = useQuery({
        queryKey: ["adminPointHistory", filters],
        queryFn: () => adminPointMonitoringService.getAllPointHistory(filters),
    });

    // 의심스러운 활동 조회
    const { data: suspiciousActivities, isLoading: suspiciousLoading } = useQuery({
        queryKey: ["suspiciousActivities"],
        queryFn: () => adminPointMonitoringService.getSuspiciousActivities(24),
        refetchInterval: 60000, // 1분마다 갱신
    });

    // 포인트 통계 조회
    const { data: statistics, isLoading: statsLoading } = useQuery({
        queryKey: ["pointStatistics"],
        queryFn: () => adminPointMonitoringService.getPointStatistics(),
    });

    // 포인트 상위 보유자 조회
    const { data: topHolders, isLoading: topHoldersLoading } = useQuery({
        queryKey: ["topPointHolders"],
        queryFn: () => adminPointMonitoringService.getTopPointHolders(10),
    });

    const handleFilterChange = (newFilters: Partial<PointHistoryFilterParams>) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: 0 }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">포인트 모니터링</h1>
                <p className="text-muted-foreground mt-2">
                    사용자들의 포인트 거래 내역을 모니터링하고 의심스러운 활동을 감지합니다.
                </p>
            </div>

            {/* 의심스러운 활동 알림 */}
            {suspiciousActivities && suspiciousActivities.length > 0 && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            의심스러운 활동 감지
                        </CardTitle>
                        <CardDescription>
                            최근 24시간 내 비정상적인 포인트 거래 패턴이 감지되었습니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {suspiciousActivities.slice(0, 3).map((activity) => (
                                <SuspiciousActivityCard
                                    key={activity.userId}
                                    activity={activity}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 통계 요약 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            총 거래 수
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {statistics?.totalTransactions.toLocaleString() || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            최근 30일 기준
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            유통 포인트
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {statistics?.totalPointsCirculated.toLocaleString() || 0}P
                        </div>
                        <p className="text-xs text-muted-foreground">
                            최근 30일 기준
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            활성 사용자
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {statistics?.uniqueUsers.toLocaleString() || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            포인트 거래 참여
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            평균 거래액
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.round(statistics?.averageTransactionAmount || 0).toLocaleString()}P
                        </div>
                        <p className="text-xs text-muted-foreground">
                            거래당 평균
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 메인 탭 */}
            <Tabs defaultValue="history" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="history">거래 내역</TabsTrigger>
                    <TabsTrigger value="statistics">통계</TabsTrigger>
                    <TabsTrigger value="topholders">상위 보유자</TabsTrigger>
                    <TabsTrigger value="suspicious">의심스러운 활동</TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="space-y-4">
                    <PointHistoryTable
                        data={pointHistory}
                        isLoading={historyLoading}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onPageChange={handlePageChange}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="space-y-4">
                    <PointStatistics
                        statistics={statistics}
                        isLoading={statsLoading}
                    />
                </TabsContent>

                <TabsContent value="topholders" className="space-y-4">
                    <TopPointHolders
                        holders={topHolders}
                        isLoading={topHoldersLoading}
                    />
                </TabsContent>

                <TabsContent value="suspicious" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {suspiciousActivities?.map((activity) => (
                            <SuspiciousActivityCard
                                key={activity.userId}
                                activity={activity}
                            />
                        ))}
                    </div>
                    {suspiciousActivities?.length === 0 && (
                        <Card>
                            <CardContent className="text-center py-8">
                                <p className="text-muted-foreground">
                                    현재 의심스러운 활동이 감지되지 않았습니다.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PointMonitoringPage;
