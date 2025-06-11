import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertTriangle,
    Coins,
    Clock,
    RefreshCw,
    Sparkles,
    X,
} from "lucide-react";
import { ThemeAdvertisementRequest } from "@/api/themeAdvertisementService";

interface AdvertisementCancelModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>;
    advertisement: ThemeAdvertisementRequest | null;
    loading?: boolean;
}

const AdvertisementCancelModal: React.FC<AdvertisementCancelModalProps> = ({
    open,
    onOpenChange,
    onConfirm,
    advertisement,
    loading = false,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!advertisement) return null;

    const isActive = advertisement.status === "ACTIVE";
    const isQueued = advertisement.status === "PENDING_QUEUE";

    // 환불 가능 금액 계산 (백엔드와 동일한 실시간 계산 로직)
    const calculateRefundAmount = () => {
        if (isQueued) {
            return advertisement.totalCost; // 대기 중인 광고는 전액 환불
        }
        if (isActive && advertisement.expiresAt) {
            // 백엔드와 동일한 실시간 계산
            const now = new Date();
            const expiresAt = new Date(advertisement.expiresAt);
            const timeDiff = expiresAt.getTime() - now.getTime();
            const remainingDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            return Math.max(0, remainingDays) * 100; // 남은 일수 * 100P (음수면 0)
        }
        return 0;
    };

    const refundAmount = calculateRefundAmount();
    
    // 실시간으로 계산된 남은 일수 
    const getRealTimeRemainingDays = () => {
        if (isActive && advertisement.expiresAt) {
            const now = new Date();
            const expiresAt = new Date(advertisement.expiresAt);
            const timeDiff = expiresAt.getTime() - now.getTime();
            return Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
        }
        return advertisement.remainingDays || 0;
    };
    
    const realTimeRemainingDays = getRealTimeRemainingDays();

    const getThemeTypeBadge = (
        type: ThemeAdvertisementRequest["themeType"]
    ) => {
        const typeConfig = {
            CRIMESCENE: { label: "크라임씬", color: "bg-red-100 text-red-800" },
            ESCAPE_ROOM: {
                label: "방탈출",
                color: "bg-blue-100 text-blue-800",
            },
            MURDER_MYSTERY: {
                label: "머더미스터리",
                color: "bg-purple-100 text-purple-800",
            },
            REALWORLD: {
                label: "리얼월드",
                color: "bg-green-100 text-green-800",
            },
        };

        const config = typeConfig[type];
        return (
            <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
            >
                {config.label}
            </span>
        );
    };

    const handleConfirm = async () => {
        try {
            setIsProcessing(true);
            await onConfirm();
            onOpenChange(false);
        } catch (error) {
            console.error("광고 취소 실패:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                        광고 취소 확인
                    </DialogTitle>
                    <DialogDescription>
                        다음 광고를 정말 취소하시겠습니까? 이 작업은 되돌릴 수
                        없습니다.
                    </DialogDescription>
                </DialogHeader>

                {/* 광고 정보 */}
                <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                                {advertisement.themeName}
                            </h3>
                            {getThemeTypeBadge(advertisement.themeType)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">
                                    상태:
                                </span>
                                <div className="mt-1">
                                    <Badge
                                        variant={
                                            isActive ? "default" : "secondary"
                                        }
                                    >
                                        {isActive ? (
                                            <>
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                활성 중
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="w-3 h-3 mr-1" />
                                                대기 중
                                            </>
                                        )}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">
                                    신청 기간:
                                </span>
                                <div className="mt-1 font-medium">
                                    {advertisement.requestedDays}일
                                </div>
                            </div>
                        </div>

                        {isActive && (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">
                                        남은 기간:
                                    </span>
                                    <div className="mt-1 font-medium">
                                        {realTimeRemainingDays}일
                                    </div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">
                                        만료일:
                                    </span>
                                    <div className="mt-1 font-medium">
                                        {new Date(
                                            advertisement.expiresAt!
                                        ).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {isQueued && (
                            <div className="text-sm">
                                <span className="text-muted-foreground">
                                    대기 순번:
                                </span>
                                <div className="mt-1">
                                    <span className="font-bold text-blue-600 text-lg">
                                        #{advertisement.queuePosition}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 환불 정보 */}
                    <Alert
                        className={
                            refundAmount > 0
                                ? "border-green-200 bg-green-50"
                                : "border-orange-200 bg-orange-50"
                        }
                    >
                        <Coins
                            className={`h-4 w-4 ${
                                refundAmount > 0
                                    ? "text-green-600"
                                    : "text-orange-600"
                            }`}
                        />
                        <AlertDescription
                            className={
                                refundAmount > 0
                                    ? "text-green-800"
                                    : "text-orange-800"
                            }
                        >
                            {isQueued ? (
                                <div className="space-y-1">
                                    <div className="font-medium">
                                        전액 환불 예정
                                    </div>
                                    <div className="text-sm">
                                        대기 중인 광고는{" "}
                                        <span className="font-semibold">
                                            {refundAmount.toLocaleString()}P
                                        </span>
                                        가 전액 환불됩니다.
                                    </div>
                                </div>
                            ) : isActive && refundAmount > 0 ? (
                                <div className="space-y-1">
                                    <div className="font-medium">
                                        부분 환불 예정
                                    </div>
                                    <div className="text-sm">
                                        남은 {realTimeRemainingDays}일에
                                        대해{" "}
                                        <span className="font-semibold">
                                            {refundAmount.toLocaleString()}P
                                        </span>
                                        가 환불됩니다.
                                        <br />
                                        (이미 진행된{" "}
                                        {advertisement.requestedDays -
                                            realTimeRemainingDays}
                                        일분은 환불되지 않습니다)
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="font-medium">환불 불가</div>
                                    <div className="text-sm">
                                        광고 기간이 이미 종료되어 환불받을 수
                                        없습니다.
                                    </div>
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>

                    {/* 주의사항 */}
                    <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                            <div className="space-y-1">
                                <div className="font-medium">
                                    취소 시 주의사항
                                </div>
                                <ul className="text-sm space-y-1 ml-2">
                                    <li>
                                        • 광고 취소 후에는 복구할 수 없습니다
                                    </li>
                                    {isActive && (
                                        <li>
                                            • 현재까지의 노출 및 클릭 통계는
                                            유지됩니다
                                        </li>
                                    )}
                                    <li>
                                        • 환불된 포인트는 즉시 계정에 반영됩니다
                                    </li>
                                </ul>
                            </div>
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                        className="sm:order-1"
                    >
                        취소
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isProcessing || loading}
                        className="sm:order-2"
                    >
                        {isProcessing ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                처리 중...
                            </>
                        ) : (
                            <>
                                <X className="w-4 h-4 mr-2" />
                                광고 취소하기
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AdvertisementCancelModal;
