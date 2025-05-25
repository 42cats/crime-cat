import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPointSummary } from "@/api/admin";
import { Trophy, TrendingUp, TrendingDown, User } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface TopPointHoldersProps {
    holders?: UserPointSummary[];
    isLoading: boolean;
    onViewUser?: (userId: string) => void;
}

export const TopPointHolders: React.FC<TopPointHoldersProps> = ({
    holders,
    isLoading,
    onViewUser,
}) => {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        포인트 상위 보유자
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-8 w-20" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!holders || holders.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        포인트 상위 보유자
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        데이터가 없습니다.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const getRankBadge = (index: number) => {
        const badges = [
            { color: "bg-yellow-500", label: "1위" },
            { color: "bg-gray-400", label: "2위" },
            { color: "bg-orange-600", label: "3위" },
        ];
        return badges[index] || { color: "bg-muted", label: `${index + 1}위` };
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    포인트 상위 보유자
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {holders.map((holder, index) => {
                        const rank = getRankBadge(index);
                        const earnSpentRatio = holder.totalSpent > 0
                            ? ((holder.totalEarned - holder.totalSpent) / holder.totalEarned * 100).toFixed(1)
                            : "100.0";

                        return (
                            <div
                                key={holder.userId}
                                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                                <Badge
                                    className={`${rank.color} text-white min-w-[3rem] justify-center`}
                                >
                                    {rank.label}
                                </Badge>

                                <img
                                    src={holder.profileImagePath}
                                    alt={holder.nickname}
                                    className="h-12 w-12 rounded-full object-cover"
                                />

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{holder.nickname}</p>
                                        <span className="text-xs text-muted-foreground">
                                            {holder.email}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3 text-green-500" />
                                            획득: {holder.totalEarned.toLocaleString()}P
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <TrendingDown className="h-3 w-3 text-red-500" />
                                            사용: {holder.totalSpent.toLocaleString()}P
                                        </span>
                                        <span>보유율: {earnSpentRatio}%</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-xl font-bold">
                                        {holder.currentBalance.toLocaleString()}P
                                    </p>
                                    {holder.lastTransactionAt && (
                                        <p className="text-xs text-muted-foreground">
                                            마지막 거래:{" "}
                                            {format(
                                                new Date(holder.lastTransactionAt),
                                                "MM/dd",
                                                { locale: ko }
                                            )}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onViewUser?.(holder.userId)}
                                >
                                    <User className="h-4 w-4" />
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {/* 통계 요약 */}
                <div className="mt-6 pt-6 border-t">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                상위 10명 평균 보유
                            </p>
                            <p className="text-lg font-medium">
                                {Math.round(
                                    holders.reduce((acc, h) => acc + h.currentBalance, 0) /
                                    holders.length
                                ).toLocaleString()}P
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                총 보유 포인트
                            </p>
                            <p className="text-lg font-medium">
                                {holders
                                    .reduce((acc, h) => acc + h.currentBalance, 0)
                                    .toLocaleString()}P
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                평균 보유율
                            </p>
                            <p className="text-lg font-medium">
                                {(
                                    holders.reduce((acc, h) => {
                                        const ratio = h.totalSpent > 0
                                            ? ((h.totalEarned - h.totalSpent) / h.totalEarned * 100)
                                            : 100;
                                        return acc + ratio;
                                    }, 0) / holders.length
                                ).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
