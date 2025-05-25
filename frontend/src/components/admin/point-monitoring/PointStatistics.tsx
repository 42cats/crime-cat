import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PointStatistics as PointStatisticsType } from "@/api/admin";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

interface PointStatisticsProps {
    statistics?: PointStatisticsType;
    isLoading: boolean;
}

const COLORS = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#8b5cf6", // purple
    "#10b981", // green
    "#f59e0b", // yellow
    "#6b7280", // gray
    "#6366f1", // indigo
    "#14b8a6", // teal
    "#ec4899", // pink
];

const transactionTypeLabels: Record<string, string> = {
    CHARGE: "충전",
    USE: "사용",
    GIFT: "선물",
    RECEIVE: "받기",
    REFUND: "환불",
    EXPIRE: "만료",
    COUPON: "쿠폰",
    DAILY: "출석",
    THEME_REWARD: "테마보상",
};

export const PointStatistics: React.FC<PointStatisticsProps> = ({
    statistics,
    isLoading,
}) => {
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!statistics) {
        return null;
    }

    // 거래 타입별 데이터 준비
    const transactionTypeData = Object.entries(statistics.transactionsByType).map(
        ([type, count]) => ({
            name: transactionTypeLabels[type] || type,
            value: count,
            amount: statistics.amountByType[type] || 0,
        })
    );

    // 시간대별 데이터 준비
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour}시`,
        count: statistics.hourlyDistribution[hour] || 0,
    }));

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* 거래 타입별 통계 (파이 차트) */}
            <Card>
                <CardHeader>
                    <CardTitle>거래 타입별 분포</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={transactionTypeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                }
                            >
                                {transactionTypeData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 시간대별 거래량 (바 차트) */}
            <Card>
                <CardHeader>
                    <CardTitle>시간대별 거래량</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="hour"
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 거래 타입별 금액 통계 */}
            <Card>
                <CardHeader>
                    <CardTitle>거래 타입별 금액</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={transactionTypeData}
                            layout="vertical"
                            margin={{ left: 60 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" />
                            <Tooltip
                                formatter={(value: number) =>
                                    `${value.toLocaleString()}P`
                                }
                            />
                            <Bar dataKey="amount" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 통계 요약 */}
            <Card>
                <CardHeader>
                    <CardTitle>통계 요약</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    분석 기간
                                </p>
                                <p className="font-medium">
                                    {statistics.startDate
                                        ? new Date(statistics.startDate).toLocaleDateString()
                                        : "-"}{" "}
                                    ~{" "}
                                    {statistics.endDate
                                        ? new Date(statistics.endDate).toLocaleDateString()
                                        : "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    총 거래 수
                                </p>
                                <p className="font-medium">
                                    {statistics.totalTransactions.toLocaleString()}건
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    총 유통 포인트
                                </p>
                                <p className="font-medium">
                                    {statistics.totalPointsCirculated.toLocaleString()}P
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    활성 사용자 수
                                </p>
                                <p className="font-medium">
                                    {statistics.uniqueUsers.toLocaleString()}명
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    평균 거래액
                                </p>
                                <p className="font-medium">
                                    {Math.round(
                                        statistics.averageTransactionAmount
                                    ).toLocaleString()}
                                    P
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    최대 거래액
                                </p>
                                <p className="font-medium">
                                    {statistics.maxTransactionAmount.toLocaleString()}P
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
