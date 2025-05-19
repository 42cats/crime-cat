import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import {
    permissionService,
    PermissionWithStatus,
} from "@/api/permissionService";
import { ShoppingCart, Clock, Crown, Package } from "lucide-react";
import { UTCToKSTMultiline } from "@/lib/UTCToKSTMultiline";
import { MobilePermissionCard } from "./MobilePermissionCard";
import { DesktopPermissionCard } from "./DesktopPermissionCard";

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
    const [error, setError] = useState<string | null>(null);
    const [selectedPermission, setSelectedPermission] =
        useState<PermissionWithStatus | null>(null);
    const [dialogType, setDialogType] = useState<"purchase" | "extend" | null>(
        null
    );
    const [actionLoading, setActionLoading] = useState(false);
    const { toast } = useToast();
    const isMobile = useMediaQuery("(max-width: 768px)");

    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const response =
                await permissionService.getAllPermissionsWithStatus(userId);
            setPermissions(response.permissions);
            setError(null);
        } catch (error: any) {
            console.error("권한 목록 조회 실패:", error);
            if (
                error?.response?.status === 404 &&
                error?.response?.data?.message ===
                    "연결된 디스코드 사용자를 찾을 수 없습니다."
            ) {
                setPermissions([]);
                setError("DISCORD_NOT_LINKED");
            } else {
                setError("GENERAL_ERROR");
                toast({
                    title: "오류",
                    description: "권한 목록을 불러오는데 실패했습니다.",
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, [userId]);

    const handlePurchase = async () => {
        if (!selectedPermission) return;

        try {
            setActionLoading(true);
            const response = await permissionService.purchasePermission(
                userId,
                selectedPermission.permissionId
            );

            if (response.success) {
                toast({ title: "구매 완료 🎉", description: response.message });
                if (onPointChange && response.data?.point !== undefined) {
                    onPointChange(response.data.point);
                }
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

    const handleExtend = async () => {
        if (!selectedPermission) return;

        try {
            setActionLoading(true);
            const response = await permissionService.extendPermission(
                userId,
                selectedPermission.permissionId
            );

            toast({ title: "연장 완료 ⏰", description: response.message });
            await fetchPermissions();
            if (onPointChange) {
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

    const formatDate = (dateString: string) => {
        try {
            return <UTCToKSTMultiline date={dateString} />;
        } catch {
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

    if (error === "DISCORD_NOT_LINKED") {
        return (
            <div className="text-center text-muted-foreground py-12">
                <Package className="mx-auto h-16 w-16 mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">
                    디스코드 계정이 연결되어 있지 않습니다
                </h3>
                <p className="text-sm">
                    권한 관리를 사용하려면 먼저 디스코드 계정을 연결해 주세요.
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
                className={`grid gap-4 ${
                    isMobile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                }`}
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
                {permissions.map((permission) => (
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
                            <MobilePermissionCard
                                permission={permission}
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
                            <DesktopPermissionCard
                                permission={permission}
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
                ))}
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
