import React from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    PermissionCardProps,
    getDaysUntilExpiry,
    getExpiryStatus,
    getProgress,
} from "./utils/permissionCardUtils";
import { PermissionBadge } from "./PermissionBadge";
import { PermissionHeader } from "./PermissionHeader";
import { ExpiryInfo } from "./ExpiryInfo";
import { PermissionButton } from "./PermissionButton";

export const MobilePermissionCard: React.FC<PermissionCardProps> = ({
    permission,
    formatDate,
    onPurchase,
    onExtend,
}) => {
    const expiryStatus = getExpiryStatus(permission);
    const daysLeft = permission.expiredDate
        ? getDaysUntilExpiry(permission.expiredDate)
        : 0;
    const progress = permission.expiredDate
        ? getProgress(daysLeft, permission.duration)
        : 0;

    return (
        <Card
            className={`h-full transition-all duration-300 hover:shadow-lg relative ${
                permission.isOwned
                    ? "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100"
                    : "hover:border-gray-300 hover:shadow-md"
            }`}
        >
            {/* 상태 뱃지 */}
            {permission.isOwned && (
                <PermissionBadge
                    urgency={expiryStatus.urgency}
                    isMobile={true}
                />
            )}

            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 pr-16 justify-center">
                    <PermissionHeader permission={permission} isMobile={true} />
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* 만료일 정보 */}
                {permission.isOwned && permission.expiredDate && (
                    <ExpiryInfo
                        expiredDate={permission.expiredDate}
                        daysLeft={daysLeft}
                        progress={progress}
                        expiryStatus={expiryStatus}
                        formatDate={formatDate}
                        isMobile={true}
                    />
                )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
                {/* 액션 버튼 */}
                <PermissionButton
                    permission={permission}
                    daysLeft={daysLeft}
                    onPurchase={onPurchase}
                    onExtend={onExtend}
                    isMobile={true}
                />

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
};
