import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { adminPointMonitoringService } from "@/api/admin";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
    TrendingUp,
    TrendingDown,
    Gift,
    DollarSign,
    Calendar,
    User,
} from "lucide-react";

interface UserPointModalProps {
    userId: string;
    onClose: () => void;
}

export const UserPointModal: React.FC<UserPointModalProps> = ({
    userId,
    onClose,
}) => {
    // 사용자 포인트 요약 정보 조회
    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ["userPointSummary", userId],
        queryFn: () => adminPointMonitoringService.getUserPointSummary(userId),
    });

    // 사용자 포인트 내역 조회
    const { data: history, isLoading: historyLoading } = useQuery({
        queryKey: ["userPointHistory", userId],
        queryFn: () =>
            adminPointMonitoringService.getUserPointHistory(userId, {
                page: 0,
                size: 20,
            }),
    });

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        사용자 포인트 상세 정보
                    </DialogTitle>
                </DialogHeader>

                {summaryLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                ) : (
                    summary && (
                        <div className="space-y-6">
                            {/* 사용자 정보 헤더 */}
                            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                                <img
                                    src={summary.profileImagePath}
                                    alt={summary.nickname}
                                    className="h-16 w-16 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">
                                        {summary.nickname}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {summary.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        가입일:{" "}
                                        {format(
                                            new Date(summary.accountCreatedAt),
                                            "yyyy년 MM월 dd일",
                                            { locale: ko }
                                        )}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">
                                        {summary.currentBalance.toLocaleString()}P
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        현재 보유 포인트
                                    </p>
                                </div>
                            </div>

                            {/* 포인트 통계 카드 */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                            총 획득
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xl font-bold">
                                            {summary.totalEarned.toLocaleString()}P
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <TrendingDown className="h-4 w-4 text-red-500" />
                                            총 사용
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xl font-bold">
                                            {summary.totalSpent.toLocaleString()}P
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Gift className="h-4 w-4 text-purple-500" />
                                            선물 받음
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xl font-bold">
                                            {summary.totalReceived.toLocaleString()}P
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-blue-500" />
                                            선물함
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xl font-bold">
                                            {summary.totalGifted.toLocaleString()}P
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* 최근 거래 내역 */}
                            <Tabs defaultValue="recent" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="recent">최근 거래</TabsTrigger>
                                    <TabsTrigger value="analysis">분석</TabsTrigger>
                                </TabsList>

                                <TabsContent value="recent" className="mt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">
                                                최근 거래 내역
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {historyLoading ? (
                                                <div className="space-y-2">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Skeleton
                                                            key={i}
                                                            className="h-12 w-full"
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {history?.content.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Badge
                                                                    variant={
                                                                        item.type === "CHARGE" ||
                                                                        item.type === "RECEIVE"
                                                                            ? "default"
                                                                            : "secondary"
                                                                    }
                                                                >
                                                                    {item.type}
                                                                </Badge>
                                                                <div>
                                                                    <p className="text-sm font-medium">
                                                                        {item.amount > 0
                                                                            ? "+"
                                                                            : ""}{" "}
                                                                        {item.amount.toLocaleString()}
                                                                        P
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {item.memo ||
                                                                            "메모 없음"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm">
                                                                    잔액:{" "}
                                                                    {item.balanceAfter.toLocaleString()}
                                                                    P
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {format(
                                                                        new Date(item.usedAt),
                                                                        "MM/dd HH:mm",
                                                                        { locale: ko }
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="analysis" className="mt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">
                                                사용 패턴 분석
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        포인트 보유율
                                                    </p>
                                                    <div className="w-full bg-muted rounded-full h-4">
                                                        <div
                                                            className="bg-primary h-4 rounded-full"
                                                            style={{
                                                                width: `${
                                                                    summary.totalEarned > 0
                                                                        ? (summary.currentBalance /
                                                                              summary.totalEarned) *
                                                                          100
                                                                        : 0
                                                                }%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        총 획득 대비{" "}
                                                        {summary.totalEarned > 0
                                                            ? (
                                                                  (summary.currentBalance /
                                                                      summary.totalEarned) *
                                                                  100
                                                              ).toFixed(1)
                                                            : 0}
                                                        % 보유
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        마지막 거래
                                                    </p>
                                                    <p className="text-sm">
                                                        {summary.lastTransactionAt
                                                            ? format(
                                                                  new Date(
                                                                      summary.lastTransactionAt
                                                                  ),
                                                                  "yyyy년 MM월 dd일 HH:mm",
                                                                  { locale: ko }
                                                              )
                                                            : "거래 내역 없음"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        일평균 사용량
                                                    </p>
                                                    <p className="text-sm">
                                                        {Math.round(
                                                            summary.totalSpent /
                                                                Math.max(
                                                                    1,
                                                                    Math.ceil(
                                                                        (Date.now() -
                                                                            new Date(
                                                                                summary.accountCreatedAt
                                                                            ).getTime()) /
                                                                            (1000 * 60 * 60 * 24)
                                                                    )
                                                                )
                                                        ).toLocaleString()}
                                                        P
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )
                )}
            </DialogContent>
        </Dialog>
    );
};
