import React from "react";
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
    Eye,
    MousePointer,
    TrendingUp,
    DollarSign,
    Calendar,
    PlayCircle,
} from "lucide-react";
import { AdvertisementStats } from "@/api/stats/advertisementStatsService";

interface AdvertisementStatsTableProps {
    stats: AdvertisementStats[];
}

const AdvertisementStatsTable: React.FC<AdvertisementStatsTableProps> = ({
    stats,
}) => {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return (
                    <Badge variant="default" className="bg-green-500">
                        활성
                    </Badge>
                );
            case "PENDING_QUEUE":
                return <Badge variant="secondary">대기</Badge>;
            case "EXPIRED":
                return <Badge variant="outline">만료</Badge>;
            case "CANCELLED":
                return <Badge variant="destructive">취소</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getThemeTypeBadge = (type: string) => {
        return type === "CRIME_SCENE" ? (
            <Badge variant="outline" className="text-red-600">
                크라임씬
            </Badge>
        ) : (
            <Badge variant="outline" className="text-blue-600">
                방탈출
            </Badge>
        );
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("ko-KR").format(amount);
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(2)}%`;
    };

    if (stats.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>광고 성과 분석</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="text-muted-foreground">
                            아직 광고 데이터가 없습니다.
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    광고 성과 분석
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>테마명</TableHead>
                                <TableHead>타입</TableHead>
                                <TableHead>상태</TableHead>
                                <TableHead className="text-center">
                                    노출수
                                </TableHead>
                                <TableHead className="text-center">
                                    클릭수
                                </TableHead>
                                <TableHead className="text-center">
                                    CTR
                                </TableHead>
                                <TableHead className="text-center">
                                    비용
                                </TableHead>
                                <TableHead className="text-center">
                                    기간
                                </TableHead>
                                <TableHead className="text-center">
                                    등록일
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.map((stat) => (
                                <TableRow
                                    key={stat.requestId}
                                    className="hover:bg-muted/50"
                                >
                                    <TableCell className="font-medium">
                                        <div className="max-w-[200px] truncate">
                                            {stat.themeName}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getThemeTypeBadge(stat.themeType)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(stat.status)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Eye className="h-3 w-3 text-muted-foreground" />
                                            {stat.exposureCount.toLocaleString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <MousePointer className="h-3 w-3 text-muted-foreground" />
                                            {stat.clickCount.toLocaleString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span
                                            className={`font-medium ${
                                                stat.clickThroughRate > 5
                                                    ? "text-green-600"
                                                    : stat.clickThroughRate > 2
                                                    ? "text-blue-600"
                                                    : "text-muted-foreground"
                                            }`}
                                        >
                                            {formatPercentage(
                                                stat.clickThroughRate
                                            )}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                                            {formatCurrency(stat.totalCost)}P
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1 text-sm">
                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                            {stat.requestedDays}일
                                            {stat.status === "ACTIVE" &&
                                                stat.remainingDays && (
                                                    <span className="text-xs text-blue-600">
                                                        (남은:{" "}
                                                        {stat.remainingDays}일)
                                                    </span>
                                                )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center text-sm text-muted-foreground">
                                        {formatDate(stat.requestedAt)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* 성과 요약 */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {stats
                                .reduce(
                                    (sum, stat) => sum + stat.exposureCount,
                                    0
                                )
                                .toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            총 노출수
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {stats
                                .reduce((sum, stat) => sum + stat.clickCount, 0)
                                .toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            총 클릭수
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(
                                stats.reduce(
                                    (sum, stat) => sum + stat.totalCost,
                                    0
                                )
                            )}
                            P
                        </div>
                        <div className="text-sm text-muted-foreground">
                            총 광고비
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default AdvertisementStatsTable;
