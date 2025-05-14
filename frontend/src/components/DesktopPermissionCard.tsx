import React from "react";
import { Card } from "@/components/ui/card";
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

export const DesktopPermissionCard: React.FC<PermissionCardProps> = ({
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
        <Card className="w-full p-4 hover:shadow-md transition-all duration-300 relative">
            {/* 상태 뱃지 */}
            {permission.isOwned && (
                <PermissionBadge
                    urgency={expiryStatus.urgency}
                    isMobile={false}
                />
            )}

            {/* 상단 가로 레이아웃 - 권한 정보, 만료일, 버튼 */}
            <div className="flex flex-row items-center gap-4">
                {/* 권한 정보 섹션 - 가로 레이아웃 */}
                <div className="flex items-center gap-4 flex-1">
                    {/* 아이콘과 권한명 */}
                    <PermissionHeader permission={permission} />

                    {/* 만료일 정보 - 가로 배치 */}
                    {permission.isOwned && permission.expiredDate && (
                        <ExpiryInfo
                            expiredDate={permission.expiredDate}
                            daysLeft={daysLeft}
                            progress={progress}
                            expiryStatus={expiryStatus}
                            formatDate={formatDate}
                        />
                    )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex-shrink-0">
                    <PermissionButton
                        permission={permission}
                        daysLeft={daysLeft}
                        onPurchase={onPurchase}
                        onExtend={onExtend}
                    />
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
