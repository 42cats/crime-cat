import React from "react";
import { CalendarIcon, Check, Ban, Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { UserCalendar } from "@/types/calendar";

interface CalendarStatsProps {
    monthStats: {
        availableDays: number;
        blockedDays: number;
        busyDays: number;
        availabilityRate: number;
    };
    calendars: UserCalendar[];
    calendarSizes: {
        iconSize: string;
        fontSize: string;
    };
    viewMode: "compact" | "standard" | "expanded";
    isMobile: boolean;
}

const CalendarStats: React.FC<CalendarStatsProps> = ({
    monthStats,
    calendars,
    calendarSizes,
    viewMode,
    isMobile,
}) => {
    /**
     * 동기화 시간의 타임존 문제 해결
     * 백엔드에서 UTC로 전송된 동기화 시간을 한국시간으로 보정하여 정확한 상대시간 표시
     */
    const adjustSyncTimeForKorea = (syncedAt: Date | string): Date => {
        const date = new Date(syncedAt);
        // UTC에서 받은 시간을 한국시간(UTC+9)으로 해석하기 위해 9시간 보정
        const koreaOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로 변환
        return new Date(date.getTime() + koreaOffset);
    };

    return (
        <div className="space-y-4">
            {/* 통계 정보 */}
            <div
                className={cn(
                    "grid gap-2 pt-2",
                    viewMode === "compact"
                        ? "grid-cols-2"
                        : viewMode === "standard"
                        ? isMobile
                            ? "grid-cols-2"
                            : "grid-cols-4"
                        : "grid-cols-2 sm:grid-cols-4"
                )}
            >
                <Badge
                    variant="outline"
                    className={cn(
                        "flex items-center justify-center gap-1 py-2 transition-all",
                        calendarSizes.fontSize,
                        viewMode === "expanded" && "py-3"
                    )}
                >
                    <Check
                        className={cn(
                            calendarSizes.iconSize,
                            "text-green-500 flex-shrink-0"
                        )}
                    />
                    <span className="truncate">
                        가능 {monthStats.availableDays}
                    </span>
                </Badge>

                <Badge
                    variant="outline"
                    className={cn(
                        "flex items-center justify-center gap-1 py-2 transition-all",
                        calendarSizes.fontSize,
                        viewMode === "expanded" && "py-3"
                    )}
                >
                    <Ban
                        className={cn(
                            calendarSizes.iconSize,
                            "text-red-500 flex-shrink-0"
                        )}
                    />
                    <span className="truncate">
                        차단 {monthStats.blockedDays}
                    </span>
                </Badge>

                <Badge
                    variant="outline"
                    className={cn(
                        "flex items-center justify-center gap-1 py-2 transition-all",
                        calendarSizes.fontSize,
                        viewMode === "expanded" && "py-3"
                    )}
                >
                    <Clock
                        className={cn(
                            calendarSizes.iconSize,
                            "text-blue-500 flex-shrink-0"
                        )}
                    />
                    <span className="truncate">
                        일정 {monthStats.busyDays}
                    </span>
                </Badge>

                <Badge
                    variant="outline"
                    className={cn(
                        "flex items-center justify-center gap-1 py-2 transition-all",
                        calendarSizes.fontSize,
                        viewMode === "expanded" && "py-3"
                    )}
                >
                    <CalendarIcon
                        className={cn(
                            calendarSizes.iconSize,
                            "text-primary flex-shrink-0"
                        )}
                    />
                    <span className="truncate">
                        {monthStats.availabilityRate}%
                    </span>
                </Badge>
            </div>

            {/* 동기화 정보 */}
            {calendars.length > 0 && (
                <div
                    className={cn(
                        "pt-3 border-t space-y-2",
                        calendarSizes.fontSize
                    )}
                >
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw
                            className={cn(
                                calendarSizes.iconSize,
                                "flex-shrink-0"
                            )}
                        />
                        <span className="font-medium">동기화 상태</span>
                    </div>
                    <div className="space-y-1.5">
                        {calendars.map((calendar) => (
                            <div
                                key={calendar.id}
                                className="flex items-center justify-between gap-2"
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{
                                            backgroundColor:
                                                calendar.colorHex,
                                        }}
                                    />
                                    <span className="truncate text-sm">
                                        {calendar.displayName ||
                                            calendar.calendarName ||
                                            "Unknown"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {calendar.syncStatus === "SUCCESS" && (
                                        <Check className="w-3 h-3 text-green-500" />
                                    )}
                                    {calendar.syncStatus === "ERROR" && (
                                        <Ban className="w-3 h-3 text-red-500" />
                                    )}
                                    {calendar.syncStatus === "PENDING" && (
                                        <RefreshCw className="w-3 h-3 text-yellow-500 animate-spin" />
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {calendar.lastSyncedAt
                                            ? formatDistanceToNow(
                                                  adjustSyncTimeForKorea(calendar.lastSyncedAt),
                                                  {
                                                      addSuffix: true,
                                                      locale: ko,
                                                  }
                                              )
                                            : "미동기화"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarStats;