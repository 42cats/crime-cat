import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, RefreshCw, User } from "lucide-react";
import { SuspiciousActivity } from "@/api/admin";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SuspiciousActivityCardProps {
    activity: SuspiciousActivity;
    onViewUser?: (userId: string) => void;
}

const suspiciousTypeConfig = {
    RAPID_EARNING: {
        label: "급속 포인트 획득",
        icon: TrendingUp,
        color: "bg-orange-500",
    },
    LARGE_AMOUNT: {
        label: "대량 포인트 거래",
        icon: AlertCircle,
        color: "bg-red-500",
    },
    REPEATED_TRANSFER: {
        label: "반복적인 전송",
        icon: RefreshCw,
        color: "bg-yellow-500",
    },
};

export const SuspiciousActivityCard: React.FC<SuspiciousActivityCardProps> = ({
    activity,
    onViewUser,
}) => {
    const config = suspiciousTypeConfig[activity.suspiciousType];

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.label}
                    </CardTitle>
                    <Badge className={cn("text-white", config.color)}>
                        의심됨
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{activity.userNickname}</span>
                        <span className="text-xs text-muted-foreground">
                            ({activity.userEmail})
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {activity.description}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="text-muted-foreground">총 금액:</span>
                        <p className="font-medium">
                            {activity.totalAmount.toLocaleString()}P
                        </p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">거래 횟수:</span>
                        <p className="font-medium">{activity.transactionCount}회</p>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground">
                    감지 시간: {format(new Date(activity.detectedAt), "yyyy-MM-dd HH:mm", { locale: ko })}
                </div>

                {activity.recentTransactions.length > 0 && (
                    <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-2">최근 거래</p>
                        <div className="space-y-1">
                            {activity.recentTransactions.slice(0, 3).map((tx) => (
                                <div
                                    key={tx.transactionId}
                                    className="text-xs flex justify-between"
                                >
                                    <span>
                                        {tx.type} - {tx.amount.toLocaleString()}P
                                    </span>
                                    <span className="text-muted-foreground">
                                        {format(new Date(tx.usedAt), "HH:mm")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => onViewUser?.(activity.userId)}
                >
                    <User className="h-4 w-4 mr-2" />
                    사용자 상세 보기
                </Button>
            </CardContent>
        </Card>
    );
};
