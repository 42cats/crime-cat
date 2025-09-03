import React from "react";
import { Settings, RefreshCw, CalendarIcon, Check, Ban, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import CalendarManagement from "./CalendarManagement";
import type { CalendarDisplayMode, UserCalendar } from "@/types/calendar";
import { getCalendarColor } from "@/utils/calendarColors";

interface CalendarLegendProps {
    displayMode: CalendarDisplayMode;
    onDisplayModeChange: (mode: CalendarDisplayMode) => void;
    calendars: UserCalendar[];
    showCalendarManagement: boolean;
    showManagement: boolean;
    onShowManagementChange: (show: boolean) => void;
    isMobile: boolean;
    isCalendarLoading: boolean;
    isCopyingSchedule: boolean;
    onCopyAvailableDates: () => void;
    // CalendarManagement props
    onAddCalendar: (calendarData: any) => void;
    onUpdateCalendar: (id: string, data: any) => void;
    onDeleteCalendar: (id: string) => void;
    onSyncCalendar: (id: string) => void;
    onSyncAllCalendars: () => void;
}

const CalendarLegend: React.FC<CalendarLegendProps> = ({
    displayMode,
    onDisplayModeChange,
    calendars,
    showCalendarManagement,
    showManagement,
    onShowManagementChange,
    isMobile,
    isCalendarLoading,
    isCopyingSchedule,
    onCopyAvailableDates,
    onAddCalendar,
    onUpdateCalendar,
    onDeleteCalendar,
    onSyncCalendar,
    onSyncAllCalendars,
}) => {
    // 동적 범례 아이템 생성
    const dynamicLegendItems = React.useMemo(() => {
        const baseItems = [
            {
                type: "available",
                label: "사용 가능",
                color: "#10b981",
                bgColor: "bg-green-100",
                borderColor: "border-green-200",
                icon: Check,
                iconColor: "text-green-500",
            },
            {
                type: "blocked",
                label: "비활성화됨",
                color: "#ef4444",
                bgColor: "bg-red-100",
                borderColor: "border-red-300",
                icon: Ban,
                iconColor: "text-red-500",
            },
        ];

        // 활성화된 캘린더별 항목 생성
        const calendarItems = calendars
            .filter((cal) => cal.isActive)
            .map((cal) => {
                const colorInfo = getCalendarColor(cal.colorIndex);
                return {
                    type: "calendar",
                    label: cal.displayName || cal.calendarName || "외부 캘린더",
                    color: colorInfo.hex,
                    bgColor: colorInfo.lightBg,
                    borderColor: `border-gray-300`,
                    icon: CalendarIcon,
                    iconColor: colorInfo.tailwindText,
                    calendarId: cal.id,
                    colorIndex: cal.colorIndex,
                };
            });

        const systemItems = [
            {
                type: "crime-cat",
                label: "Crime-Cat",
                color: "#3b82f6",
                bgColor: "bg-blue-100",
                borderColor: "border-blue-300",
                icon: Clock,
                iconColor: "text-blue-500",
            },
            {
                type: "overlapping",
                label: "겹친 일정",
                color: "pattern",
                bgColor: "bg-gradient-to-r from-red-100 via-yellow-100 to-blue-100",
                borderColor: "border-purple-300",
                icon: Clock,
                iconColor: "text-purple-500",
            },
        ];

        return [...baseItems, ...calendarItems, ...systemItems];
    }, [calendars]);

    return (
        <div className="space-y-3">
            {/* 컨트롤 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">내 캘린더</span>
                    {calendars.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {calendars.length}개 연결됨
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* 표시 모드 토글 */}
                    {calendars.length > 1 && (
                        <ToggleGroup
                            type="single"
                            value={displayMode}
                            onValueChange={(value) =>
                                value &&
                                onDisplayModeChange(value as CalendarDisplayMode)
                            }
                            size="sm"
                        >
                            <ToggleGroupItem
                                value="unified"
                                className="text-xs px-2 py-1"
                            >
                                통합
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="separated"
                                className="text-xs px-2 py-1"
                            >
                                구분
                            </ToggleGroupItem>
                        </ToggleGroup>
                    )}

                    {/* 캘린더 관리 버튼 */}
                    {showCalendarManagement && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                onShowManagementChange(!showManagement)
                            }
                            className="h-7 px-2"
                        >
                            <Settings className="w-4 h-4" />
                            {!isMobile && (
                                <span className="ml-1">관리</span>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* 캘린더 관리 패널 */}
            {showCalendarManagement && showManagement && (
                <div className="border rounded-lg p-4 bg-background">
                    <CalendarManagement
                        calendars={calendars}
                        onAddCalendar={onAddCalendar}
                        onUpdateCalendar={onUpdateCalendar}
                        onDeleteCalendar={onDeleteCalendar}
                        onSyncCalendar={onSyncCalendar}
                        onSyncAllCalendars={onSyncAllCalendars}
                        isLoading={isCalendarLoading}
                    />
                </div>
            )}

            {/* 동적 상태 범례 */}
            <div
                className={cn(
                    "grid gap-2 p-3 bg-muted/30 rounded-lg",
                    isMobile
                        ? "grid-cols-1"
                        : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                )}
            >
                {dynamicLegendItems.map((item, index) => {
                    const IconComponent = item.icon;

                    return (
                        <div
                            key={`${item.type}-${index}`}
                            className="flex items-center gap-2"
                        >
                            <div
                                className={cn(
                                    "w-3 h-3 border-2 rounded flex-shrink-0",
                                    item.bgColor,
                                    item.borderColor
                                )}
                                style={
                                    item.type === "calendar"
                                        ? {
                                              backgroundColor:
                                                  item.bgColor ===
                                                  "colorInfo.lightBg"
                                                      ? item.color + "20"
                                                      : undefined,
                                          }
                                        : item.type === "overlapping"
                                        ? {
                                              background:
                                                  "repeating-linear-gradient(45deg, #ff6b6b 0px, #ff6b6b 3px, #4ecdc4 3px, #4ecdc4 6px)",
                                          }
                                        : {}
                                }
                            />
                            <IconComponent
                                className={cn(
                                    "w-3 h-3 flex-shrink-0",
                                    item.iconColor
                                )}
                                style={
                                    item.type === "calendar"
                                        ? { color: item.color }
                                        : {}
                                }
                            />
                            <span
                                className="text-xs sm:text-sm truncate"
                                title={item.label}
                            >
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* 사용 안내 메시지 */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-blue-100 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="text-xs text-blue-700 leading-relaxed">
                        <strong>사용 팁:</strong> 현재 월의 날짜만
                        클릭/드래그로 상태 변경이 가능합니다. 이전/다음 월
                        날짜는{" "}
                        <span className="text-blue-600 font-medium">
                            흐리게 표시
                        </span>
                        되며 참고용입니다.
                    </div>
                </div>
            </div>

            {/* 일정공유 섹션 */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    📅 일정공유
                </h3>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        className={cn(
                            "flex items-center gap-2",
                            isMobile && "text-xs px-3 py-2"
                        )}
                        onClick={onCopyAvailableDates}
                        disabled={isCopyingSchedule}
                    >
                        {isCopyingSchedule ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                            "📋"
                        )}
                        {isCopyingSchedule ? "조회 중..." : "텍스트 복사"}
                    </Button>
                    {/* 향후 추가될 다른 버튼들 */}
                </div>
            </div>
        </div>
    );
};

export default CalendarLegend;