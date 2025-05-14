import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ShoppingCart,
    Clock,
    Check,
    Calendar,
    Crown,
    Timer,
    Coins,
    Sparkles,
} from "lucide-react";
import { PermissionWithStatus } from "@/api/permissionService";

interface DesktopPermissionCardProps {
    permission: PermissionWithStatus;
    expiryStatus: any;
    daysLeft: number;
    formatDate: (date: string) => React.ReactNode;
    onPurchase: () => void;
    onExtend: () => void;
}

export const DesktopPermissionCard: React.FC<DesktopPermissionCardProps> = ({
    permission,
    expiryStatus,
    daysLeft,
    formatDate,
    onPurchase,
    onExtend,
}) => {
    const progress = Math.max(
        0,
        Math.min(100, (daysLeft / permission.duration) * 100)
    );

    return (
        <Card className="w-full p-4 hover:shadow-md transition-all duration-300 relative">
            {/* 상태 뱃지 - 오른쪽 상단 */}
            {permission.isOwned && (
                <div className="absolute top-3 right-7 z-10">
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
            
            {/* 상단 가로 레이아웃 - 권한 정보, 만료일, 버튼 */}
            <div className="flex flex-row items-center gap-4">
                {/* 권한 정보 섹션 - 가로 레이아웃 */}
                <div className="flex items-center gap-4 flex-1">
                    {/* 아이콘과 권한명 */}
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2 rounded-md ${permission.isOwned ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}
                        >
                            <Crown className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-center font-semibold">
                                {permission.permissionName}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-xs">
                                <div className="flex items-center gap-1">
                                    <Coins className="h-3 w-3 text-amber-600" />
                                    <span className="font-semibold text-amber-600">
                                        {permission.price}P
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Timer className="h-3 w-3 text-gray-600" />
                                    <span>{permission.duration}일</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 만료일 정보 - 가로 배치 */}
                    {permission.isOwned && permission.expiredDate && (
                        <div
                            className={`flex flex-col gap-2 p-3 rounded-md border ${expiryStatus.bgColor} mx-auto`}
                        >
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Calendar
                                        className={`h-3 w-3 ${expiryStatus.color}`}
                                    />
                                    <span
                                        className={`text-xs font-medium ${expiryStatus.color}`}
                                    >
                                        만료일
                                    </span>
                                </div>
                                <div
                                    className={`text-xs font-semibold ${expiryStatus.color}`}
                                >
                                    {formatDate(permission.expiredDate)}
                                </div>
                                <div
                                    className={`text-xs mt-1 ${expiryStatus.color}`}
                                >
                                    {daysLeft > 0 ? `${daysLeft}일 남음` : "만료됨"}
                                </div>
                            </div>
                            <div className="w-full">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${expiryStatus.urgency === "critical" ? "bg-red-500" : expiryStatus.urgency === "warning" ? "bg-orange-500" : "bg-emerald-500"}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex-shrink-0">
                    {permission.isOwned ? (
                        permission.canExtend && daysLeft > 0 ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                onClick={onExtend}
                            >
                                <Clock className="h-4 w-4 mr-1" />
                                연장하기
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="secondary"
                                className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                disabled
                            >
                                <Check className="h-4 w-4 mr-1" />
                                {daysLeft > 0 ? "보유 중" : "만료됨"}
                            </Button>
                        )
                    ) : (
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                            onClick={onPurchase}
                        >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            구매하기
                        </Button>
                    )}
                </div>
            </div>
            
            {/* 권한 정보 - 연장하기 버튼 아래에 표시 */}
            {permission.info && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600 leading-relaxed">
                        {permission.info}
                    </p>
                </div>
            )}
        </Card>
    );
};
