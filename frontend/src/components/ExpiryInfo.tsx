import React from "react";
import { Calendar } from "lucide-react";
import { getProgressBarClasses } from "./utils/permissionCardUtils";

interface ExpiryInfoProps {
    expiredDate: string;
    daysLeft: number;
    progress: number;
    expiryStatus: {
        color: string;
        bgColor: string;
        urgency: "critical" | "warning" | "normal";
    };
    formatDate: (date: string) => React.ReactNode;
    isMobile?: boolean;
}

export const ExpiryInfo: React.FC<ExpiryInfoProps> = ({
    expiredDate,
    daysLeft,
    progress,
    expiryStatus,
    formatDate,
    isMobile = false,
}) => (
    <div
        className={`${
            isMobile ? "p-4" : "flex flex-col gap-2 p-3"
        } rounded-lg border ${expiryStatus.bgColor} ${
            isMobile ? "border-current" : "mx-auto"
        }`}
    >
        <div
            className={
                isMobile ? "flex items-center justify-between" : "text-center"
            }
        >
            {isMobile ? (
                <>
                    <div className="flex items-center gap-2">
                        <Calendar className={`h-4 w-4 ${expiryStatus.color}`} />
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
                            {formatDate(expiredDate)}
                        </p>
                        <p className={`text-xs mt-1 ${expiryStatus.color}`}>
                            {daysLeft > 0 ? `${daysLeft}일 남음` : "만료됨"}
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Calendar className={`h-3 w-3 ${expiryStatus.color}`} />
                        <span
                            className={`text-xs font-medium ${expiryStatus.color}`}
                        >
                            만료일
                        </span>
                    </div>
                    <div
                        className={`text-xs font-semibold ${expiryStatus.color}`}
                    >
                        {formatDate(expiredDate)}
                    </div>
                    <div className={`text-xs mt-1 ${expiryStatus.color}`}>
                        {daysLeft > 0 ? `${daysLeft}일 남음` : "만료됨"}
                    </div>
                </>
            )}
        </div>

        {/* 진행률 바 */}
        <div className="mt-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={getProgressBarClasses(expiryStatus.urgency)}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    </div>
);
