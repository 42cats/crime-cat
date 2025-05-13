import React, { useState, useEffect } from "react";

import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { UTCToKST } from "@/lib/dateFormat";
import {
    permissionService,
    PermissionWithStatus,
    PurchaseResponse,
    ExtendResponse,
} from "@/api/permissionService";
import {
    ShoppingCart,
    Clock,
    Check,
    X,
    Calendar,
    Crown,
    Package,
    Sparkles,
    Timer,
    Coins,
} from "lucide-react";

interface UserPermissionCardProps {
    userId: string;
    onPointChange?: (newPoint: number) => void;
}

// 반응형 훅
const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [query]);

    return matches;
};

export const UserPermissionCard: React.FC<UserPermissionCardProps> = ({
    userId,
    onPointChange,
}) => {
    const [permissions, setPermissions] = useState<PermissionWithStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPermission, setSelectedPermission] =
        useState<PermissionWithStatus | null>(null);
    const [dialogType, setDialogType] = useState<"purchase" | "extend" | null>(
        null
    );
    const [actionLoading, setActionLoading] = useState(false);
    const { toast } = useToast();
    const isMobile = useMediaQuery("(max-width: 768px)");

    // 권한 목록 불러오기
    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const response =
                await permissionService.getAllPermissionsWithStatus(userId);
            setPermissions(response.permissions);
        } catch (error) {
            console.error("권한 목록 조회 실패:", error);
            toast({
                title: "오류",
                description: "권한 목록을 불러오는데 실패했습니다.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, [userId]);

    // 권한 구매
    const handlePurchase = async () => {
        if (!selectedPermission) return;

        try {
            setActionLoading(true);
            const response = await permissionService.purchasePermission(
                userId,
                selectedPermission.permissionId
            );

            if (response.success) {
                toast({
                    title: "구매 완료 🎉",
                    description: response.message,
                });
                // 포인트 변경 알림
                if (onPointChange && response.data?.point !== undefined) {
                    onPointChange(response.data.point);
                }
                // 권한 목록 새로고침
                await fetchPermissions();
            } else {
                toast({
                    title: "구매 실패",
                    description: response.message,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("권한 구매 실패:", error);
            toast({
                title: "오류",
                description: "권한 구매 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
            setDialogType(null);
            setSelectedPermission(null);
        }
    };

    // 권한 연장
    const handleExtend = async () => {
        if (!selectedPermission) return;

        try {
            setActionLoading(true);
            const response = await permissionService.extendPermission(
                userId,
                selectedPermission.permissionId
            );

            toast({
                title: "연장 완료 ⏰",
                description: response.message,
            });
            // 권한 목록 새로고침
            await fetchPermissions();

            // 연장 후 포인트를 수동으로 계산하여 업데이트
            if (onPointChange) {
                // 특별한 값으로 새로고침 신호
                onPointChange(-1);
            }
        } catch (error) {
            console.error("권한 연장 실패:", error);
            toast({
                title: "오류",
                description: "권한 연장 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
            setDialogType(null);
            setSelectedPermission(null);
        }
    };

    // 만료일까지 남은 일수 계산
    const getDaysUntilExpiry = (expiredDate: string) => {
        const today = new Date();
        const expiry = new Date(expiredDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // 만료 상태에 따른 색상 결정
    const getExpiryStatus = (permission: PermissionWithStatus) => {
        if (!permission.isOwned || !permission.expiredDate) {
            return {
                color: "text-gray-500",
                bgColor: "bg-gray-50",
                urgency: "normal",
            };
        }

        const daysLeft = getDaysUntilExpiry(permission.expiredDate);
        if (daysLeft <= 3)
            return {
                color: "text-red-600",
                bgColor: "bg-red-50",
                urgency: "critical",
            };
        if (daysLeft <= 7)
            return {
                color: "text-orange-600",
                bgColor: "bg-orange-50",
                urgency: "warning",
            };
        return {
            color: "text-emerald-600",
            bgColor: "bg-emerald-50",
            urgency: "normal",
        };
    };

    // 날짜 포맷터 - UTCToKST 컴포넌트 사용
    const formatDate = (dateString: string) => {
        try {
            return <UTCToKST date={dateString} />;
        } catch (error) {
            return <span>{dateString}</span>;
        }
    };

    if (loading) {
        return (
            <div className="w-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">
                    권한 목록을 불러오는 중...
                </p>
            </div>
        );
    }

    if (permissions.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12">
                <Package className="mx-auto h-16 w-16 mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">
                    등록된 권한이 없습니다
                </h3>
                <p className="text-sm">아직 이용 가능한 권한이 없습니다.</p>
            </div>
        );
    }

    return (
        <section className="w-full">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200">
                        <Crown className="h-6 w-6 text-yellow-600" />
                    </div>
                    권한 관리
                </h2>
                <Badge variant="secondary" className="text-sm">
                    총 {permissions.length}개의 권한
                </Badge>
            </div>

            <motion.div
                className={`
                    grid gap-4
                    ${isMobile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}
                `}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 },
                    },
                }}
            >
                {permissions.map((permission) => {
                    const expiryStatus = getExpiryStatus(permission);
                    const daysLeft = permission.expiredDate
                        ? getDaysUntilExpiry(permission.expiredDate)
                        : 0;

                    return (
                        <motion.div
                            key={permission.permissionId}
                            variants={{
                                hidden: { opacity: 0, y: 30 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: { duration: 0.5 },
                                },
                            }}
                        >
                            {isMobile ? (
                                // 모바일 버전 - 세로형
                                <MobilePermissionCard
                                    permission={permission}
                                    expiryStatus={expiryStatus}
                                    daysLeft={daysLeft}
                                    formatDate={formatDate}
                                    onPurchase={() => {
                                        setSelectedPermission(permission);
                                        setDialogType("purchase");
                                    }}
                                    onExtend={() => {
                                        setSelectedPermission(permission);
                                        setDialogType("extend");
                                    }}
                                />
                            ) : (
                                // 데스크탑 버전 - 가로형
                                <DesktopPermissionCard
                                    permission={permission}
                                    expiryStatus={expiryStatus}
                                    daysLeft={daysLeft}
                                    formatDate={formatDate}
                                    onPurchase={() => {
                                        setSelectedPermission(permission);
                                        setDialogType("purchase");
                                    }}
                                    onExtend={() => {
                                        setSelectedPermission(permission);
                                        setDialogType("extend");
                                    }}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* 구매/연장 확인 다이얼로그 */}
            <Dialog
                open={dialogType !== null}
                onOpenChange={() => {
                    setDialogType(null);
                    setSelectedPermission(null);
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {dialogType === "purchase" ? (
                                <>
                                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                                    권한 구매
                                </>
                            ) : (
                                <>
                                    <Clock className="h-5 w-5 text-orange-600" />
                                    권한 연장
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedPermission && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-700">
                                            권한명
                                        </span>
                                        <span className="font-bold text-gray-900">
                                            {selectedPermission.permissionName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-700">
                                            비용
                                        </span>
                                        <span className="font-bold text-amber-600 text-lg">
                                            {selectedPermission.price}P
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-700">
                                            기간
                                        </span>
                                        <span className="font-semibold text-gray-800">
                                            {selectedPermission.duration}일
                                        </span>
                                    </div>
                                    {dialogType === "extend" &&
                                        selectedPermission.expiredDate && (
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                                                <span className="font-medium text-gray-700">
                                                    현재 만료일
                                                </span>
                                                <div className="font-semibold text-gray-800">
                                                    {formatDate(
                                                        selectedPermission.expiredDate
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDialogType(null);
                                setSelectedPermission(null);
                            }}
                            disabled={actionLoading}
                            className="flex-1"
                        >
                            취소
                        </Button>
                        <Button
                            onClick={
                                dialogType === "purchase"
                                    ? handlePurchase
                                    : handleExtend
                            }
                            disabled={actionLoading}
                            className={`flex-1 ${
                                dialogType === "purchase"
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-orange-600 hover:bg-orange-700"
                            }`}
                        >
                            {actionLoading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            )}
                            {dialogType === "purchase"
                                ? "구매하기"
                                : "연장하기"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
};

// 모바일 권한 카드 컴포넌트
const MobilePermissionCard: React.FC<{
    permission: PermissionWithStatus;
    expiryStatus: any;
    daysLeft: number;
    formatDate: (date: string) => React.ReactNode;
    onPurchase: () => void;
    onExtend: () => void;
}> = ({
    permission,
    expiryStatus,
    daysLeft,
    formatDate,
    onPurchase,
    onExtend,
}) => (
    <Card
        className={`h-full transition-all duration-300 hover:shadow-lg relative ${
            permission.isOwned
                ? "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100"
                : "hover:border-gray-300 hover:shadow-md"
        }`}
    >
        {/* 상태 뱃지 - 수정된 위치 */}
        {permission.isOwned && (
            <div className="absolute top-3 right-3 z-10">
                <Badge
                    className={`px-3 py-1 text-xs ${
                        expiryStatus.urgency === "critical"
                            ? "bg-red-500 hover:bg-red-600"
                            : expiryStatus.urgency === "warning"
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-emerald-500 hover:bg-emerald-600"
                    }`}
                >
                    <Sparkles className="w-3 h-3 mr-1" />
                    보유 중
                </Badge>
            </div>
        )}

        <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-3 pr-16">
                <div
                    className={`p-2 rounded-lg ${
                        permission.isOwned
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                    }`}
                >
                    <Crown className="h-5 w-5" />
                </div>
                {permission.permissionName}
            </CardTitle>
            {permission.info && (
                <CardDescription className="text-sm mt-2 leading-relaxed">
                    {permission.info}
                </CardDescription>
            )}
        </CardHeader>

        <CardContent className="space-y-4">
            {/* 가격 정보 */}
            <div className="p-4 rounded-lg bg-white/70 border border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-gray-700">
                            가격
                        </span>
                    </div>
                    <span className="text-lg font-bold text-amber-600">
                        {permission.price}P
                    </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                            기간
                        </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                        {permission.duration}일
                    </span>
                </div>
            </div>

            {/* 만료일 정보 */}
            {permission.isOwned && permission.expiredDate && (
                <div
                    className={`p-4 rounded-lg border ${expiryStatus.bgColor} border-current`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar
                                className={`h-4 w-4 ${expiryStatus.color}`}
                            />
                            <span
                                className={`text-sm font-medium ${expiryStatus.color}`}
                            >
                                만료일
                            </span>
                        </div>
                        <div className="text-right">
                            <p
                                className={`text-sm font-semibold ${expiryStatus.color}`}
                            >
                                {formatDate(permission.expiredDate)}
                            </p>
                            <p className={`text-xs mt-1 ${expiryStatus.color}`}>
                                {daysLeft > 0 ? `${daysLeft}일 남음` : "만료됨"}
                            </p>
                        </div>
                    </div>

                    {/* 진행률 바 */}
                    <div className="mt-3">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${
                                    expiryStatus.urgency === "critical"
                                        ? "bg-red-500"
                                        : expiryStatus.urgency === "warning"
                                        ? "bg-orange-500"
                                        : "bg-emerald-500"
                                }`}
                                style={{
                                    width: `${Math.max(
                                        0,
                                        Math.min(
                                            100,
                                            (daysLeft / permission.duration) *
                                                100
                                        )
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </CardContent>

        <CardFooter className="pt-4">
            {permission.isOwned ? (
                permission.canExtend && daysLeft > 0 ? (
                    <Button
                        variant="outline"
                        className="w-full h-12 text-lg font-medium border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={onExtend}
                    >
                        <Clock className="h-5 w-5 mr-2" />
                        연장하기
                    </Button>
                ) : (
                    <Button
                        variant="secondary"
                        className="w-full h-12 text-lg font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        disabled
                    >
                        <Check className="h-5 w-5 mr-2" />
                        {daysLeft > 0 ? "보유 중" : "만료됨"}
                    </Button>
                )
            ) : (
                <Button
                    className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    onClick={onPurchase}
                >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    구매하기
                </Button>
            )}
        </CardFooter>
    </Card>
);

// 데스크탑 권한 카드 컴포넌트 - 가로형 레이아웃
const DesktopPermissionCard: React.FC<{
    permission: PermissionWithStatus;
    expiryStatus: any;
    daysLeft: number;
    formatDate: (date: string) => React.ReactNode;
    onPurchase: () => void;
    onExtend: () => void;
}> = ({
    permission,
    expiryStatus,
    daysLeft,
    formatDate,
    onPurchase,
    onExtend,
}) => (
    <Card
        className={`p-6 transition-all duration-300 hover:shadow-lg relative ${
            permission.isOwned
                ? "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100"
                : "hover:border-gray-300 hover:shadow-md"
        }`}
    >
        <div className="flex items-center justify-between">
            {/* 왼쪽: 권한 정보 */}
            <div className="flex items-center gap-4 flex-1">
                <div
                    className={`p-3 rounded-lg ${
                        permission.isOwned
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                    }`}
                >
                    <Crown className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                        {permission.permissionName}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                            <Coins className="h-4 w-4 text-amber-600" />
                            <span className="text-lg font-bold text-amber-600">
                                {permission.price}P
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Timer className="h-4 w-4 text-gray-600" />
                            <span className="text-sm text-gray-600">
                                {permission.duration}일
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            {/* 중간: 만료일 정보 - 더 넓게 */}
            {permission.isOwned && permission.expiredDate && (
                <div
                    className={`mx-4 p-6 rounded-lg border ${expiryStatus.bgColor} min-w-0 flex-1 max-w-xs`}
                >
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Calendar
                                className={`h-5 w-5 ${expiryStatus.color}`}
                            />
                            <span
                                className={`text-sm font-semibold ${expiryStatus.color}`} // 글자 크기 줄임
                            >
                                만료일
                            </span>
                        </div>
                        <div
                            className={`text-sm font-bold ${expiryStatus.color} mb-2`} // 글자 크기 줄임
                        >
                            {formatDate(permission.expiredDate)}
                        </div>
                        <div
                            className={`text-sm font-medium ${expiryStatus.color}`} // 글자 크기 줄임
                        >
                            {daysLeft > 0 ? `${daysLeft}일 남음` : "만료됨"}
                        </div>
                        {/* <div className="mt-4">
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${
                                        expiryStatus.urgency === "critical"
                                            ? "bg-red-500"
                                            : expiryStatus.urgency === "warning"
                                            ? "bg-orange-500"
                                            : "bg-emerald-500"
                                    }`}
                                    style={{
                                        width: `${Math.max(
                                            0,
                                            Math.min(
                                                100,
                                                (daysLeft /
                                                    permission.duration) *
                                                    100
                                            )
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div> */}
                    </div>
                </div>
            )}

            {/* 오른쪽: 액션 버튼만 */}
            <div className="min-w-0">
                {permission.isOwned ? (
                    permission.canExtend && daysLeft > 0 ? (
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            onClick={onExtend}
                        >
                            <Clock className="h-5 w-5 mr-2" />
                            연장하기
                        </Button>
                    ) : (
                        <Button
                            variant="secondary"
                            size="lg"
                            className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            disabled
                        >
                            <Check className="h-5 w-5 mr-2" />
                            {daysLeft > 0 ? "보유 중" : "만료됨"}
                        </Button>
                    )
                ) : (
                    <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        onClick={onPurchase}
                    >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        구매하기
                    </Button>
                )}
            </div>
        </div>

        {/* 아래쪽: 권한 설명 */}
        {permission.info && (
            <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 leading-relaxed">
                    {permission.info}
                </p>
            </div>
        )}
    </Card>
);
