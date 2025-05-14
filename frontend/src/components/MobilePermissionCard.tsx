import React from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ShoppingCart,
    Clock,
    Check,
    Calendar,
    Crown,
    Sparkles,
    Timer,
    Coins,
} from "lucide-react";
import { PermissionWithStatus } from "@/api/permissionService";

interface MobilePermissionCardProps {
    permission: PermissionWithStatus;
    expiryStatus: any;
    daysLeft: number;
    formatDate: (date: string) => React.ReactNode;
    onPurchase: () => void;
    onExtend: () => void;
}

export const MobilePermissionCard: React.FC<MobilePermissionCardProps> = ({
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
            <CardTitle className="text-xl flex items-center gap-3 pr-16 justify-center">
                <div
                    className={`p-2 rounded-lg ${
                        permission.isOwned
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                    }`}
                >
                    <Crown className="h-5 w-5" />
                </div>
                <div className="text-center">
                    {permission.permissionName}
                </div>
            </CardTitle>
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

        <CardFooter className="flex flex-col gap-4">
            {/* 액션 버튼 */}
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
            
            {/* 권한 정보 - 버튼 아래에 표시 */}
            {permission.info && (
                <div className="w-full pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600 leading-relaxed text-center">
                        {permission.info}
                    </p>
                </div>
            )}
        </CardFooter>
    </Card>
);
