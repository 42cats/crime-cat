import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
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
import { useToast } from "@/hooks/useToast";
import { UTCToKST } from "@/lib/dateFormat";
import { 
    permissionService, 
    PermissionWithStatus,
    PurchaseResponse,
    ExtendResponse 
} from "@/api/permissionService";
import { 
    ShoppingCart, 
    Clock, 
    Check, 
    X, 
    Calendar,
    Crown,
    Package
} from "lucide-react";

interface UserPermissionCardProps {
    userId: string;
    onPointChange?: (newPoint: number) => void;
}

export const UserPermissionCard: React.FC<UserPermissionCardProps> = ({
    userId,
    onPointChange,
}) => {
    const [permissions, setPermissions] = useState<PermissionWithStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPermission, setSelectedPermission] = useState<PermissionWithStatus | null>(null);
    const [dialogType, setDialogType] = useState<'purchase' | 'extend' | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { toast } = useToast();

    // 권한 목록 불러오기
    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const response = await permissionService.getAllPermissionsWithStatus(userId);
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
                    title: "구매 완료",
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
                title: "연장 완료",
                description: response.message,
            });
            // 권한 목록 새로고침
            await fetchPermissions();
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
    const getExpiryColor = (permission: PermissionWithStatus) => {
        if (!permission.isOwned) return "text-gray-500";
        
        const daysLeft = getDaysUntilExpiry(permission.expiredDate!);
        if (daysLeft <= 3) return "text-red-500";
        if (daysLeft <= 7) return "text-yellow-500";
        return "text-green-500";
    };

    if (loading) {
        return (
            <div className="w-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">권한 목록을 불러오는 중...</p>
            </div>
        );
    }

    if (permissions.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8">
                <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>등록된 권한이 없습니다.</p>
            </div>
        );
    }

    return (
        <section className="w-full">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Crown className="h-6 w-6 text-yellow-500" />
                권한 관리
            </h2>

            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
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
                            hidden: { opacity: 0, y: 20 },
                            visible: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.4 },
                            },
                        }}
                    >
                        <Card 
                            className={`h-full transition-all duration-200 ${
                                permission.isOwned 
                                    ? 'border-green-200 bg-green-50/50 hover:bg-green-50/80' 
                                    : 'border-gray-200 hover:bg-gray-50/50'
                            }`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {permission.isOwned && (
                                            <Check className="h-5 w-5 text-green-500" />
                                        )}
                                        {permission.permissionName}
                                    </CardTitle>
                                    <span className="text-2xl">
                                        {permission.isOwned ? "✅" : "⭕"}
                                    </span>
                                </div>
                                {permission.info && (
                                    <CardDescription className="text-xs mt-1 line-clamp-2">
                                        {permission.info}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">가격:</span>
                                    <span className="font-semibold">{permission.price}P</span>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">기간:</span>
                                    <span>{permission.duration}일</span>
                                </div>
                                
                                {permission.isOwned && permission.expiredDate && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">만료일:</span>
                                            <span className={getExpiryColor(permission)}>
                                                <UTCToKST date={permission.expiredDate} />
                                            </span>
                                        </div>
                                        <div className="text-xs text-center">
                                            <span className={getExpiryColor(permission)}>
                                                {getDaysUntilExpiry(permission.expiredDate)}일 남음
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            
                            <CardFooter className="pt-0">
                                {permission.isOwned ? (
                                    permission.canExtend ? (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => {
                                                setSelectedPermission(permission);
                                                setDialogType('extend');
                                            }}
                                        >
                                            <Clock className="h-4 w-4 mr-2" />
                                            연장하기
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" className="w-full" disabled>
                                            <Check className="h-4 w-4 mr-2 text-green-500" />
                                            보유 중
                                        </Button>
                                    )
                                ) : (
                                    <Button
                                        className="w-full"
                                        onClick={() => {
                                            setSelectedPermission(permission);
                                            setDialogType('purchase');
                                        }}
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        구매하기
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {dialogType === 'purchase' ? '권한 구매' : '권한 연장'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedPermission && (
                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between">
                                        <span>권한명:</span>
                                        <span className="font-semibold">{selectedPermission.permissionName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>비용:</span>
                                        <span className="font-semibold text-primary">{selectedPermission.price}P</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>기간:</span>
                                        <span>{selectedPermission.duration}일</span>
                                    </div>
                                    {dialogType === 'extend' && selectedPermission.expiredDate && (
                                        <div className="flex justify-between">
                                            <span>현재 만료일:</span>
                                            <span><UTCToKST date={selectedPermission.expiredDate} /></span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDialogType(null);
                                setSelectedPermission(null);
                            }}
                            disabled={actionLoading}
                        >
                            취소
                        </Button>
                        <Button
                            onClick={dialogType === 'purchase' ? handlePurchase : handleExtend}
                            disabled={actionLoading}
                        >
                            {actionLoading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            )}
                            {dialogType === 'purchase' ? '구매하기' : '연장하기'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
};
