import React from "react";
import { Ban, Check, Clock, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { DateStatus, CalendarEvent } from "@/hooks/useCalendarState";
import { 
    getCalendarColor, 
    createStripeGradient, 
    getDisplayRules, 
    getAccessibleStripeStyle, 
    getAccessibleDotStyle, 
    findClosestColorIndex,
    getDateCellBackgroundStyle
} from "@/utils/calendarColors";
import EventCountIndicator from "./EventCountIndicator";
import { LoadingSpinner } from "./common/LoadingSpinner";

interface DateCellProps {
    date: Date;
    displayMonth: Date;
    currentMonth: Date;
    dateInfo: {
        status: DateStatus;
        events: CalendarEvent[];
    };
    calendarGroupsForDisplay: Map<string, {
        calendar: any;
        events: CalendarEvent[];
        colorIndex: number;
    }>;
    displayMode: "unified" | "separated";
    viewMode: "compact" | "standard" | "expanded";
    calendarSizes: {
        cellSize: string;
        fontSize: string;
        iconSize: string;
    };
    showEvents: boolean;
    isLoading: boolean;
    isDragging: boolean;
    dragStart: Date | null;
    dragEnd: Date | null;
    // Event handlers
    onDateClick: (date: Date) => void;
    onStartDrag: (date: Date) => void;
    onUpdateDrag: (date: Date) => void;
    onEndDrag: () => void;
    onMouseEnter: (date: Date, event: React.MouseEvent) => void;
    onMouseLeave: () => void;
}

const DateCell: React.FC<DateCellProps> = ({
    date,
    displayMonth,
    currentMonth,
    dateInfo,
    calendarGroupsForDisplay,
    displayMode,
    viewMode,
    calendarSizes,
    showEvents,
    isLoading,
    isDragging,
    dragStart,
    dragEnd,
    onDateClick,
    onStartDrag,
    onUpdateDrag,
    onEndDrag,
    onMouseEnter,
    onMouseLeave,
}) => {
    const isMobile = useIsMobile();
    const isToday = date.toDateString() === new Date().toDateString();
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

    // 이전/이후 월 날짜 판단 (수동 계산)
    const isOutsideMonth =
        date.getMonth() !== currentMonth.getMonth() ||
        date.getFullYear() !== currentMonth.getFullYear();

    // 드래그 선택 범위인지 확인
    const isInDragRange =
        isDragging &&
        dragStart &&
        dragEnd &&
        date >= (dragStart < dragEnd ? dragStart : dragEnd) &&
        date <= (dragStart < dragEnd ? dragEnd : dragStart);

    // 날짜별 캘린더 정보 계산
    const getDateCalendarInfo = () => {
        const dateKey = date.toISOString().split("T")[0];
        const calendarIds = new Set<string>();
        const colorIndexes = new Set<number>();

        calendarGroupsForDisplay.forEach((group, groupId) => {
            const hasEvents = group.events.some((event) => {
                const eventDate = new Date(event.startTime)
                    .toISOString()
                    .split("T")[0];
                return eventDate === dateKey;
            });

            if (hasEvents) {
                calendarIds.add(groupId);
                colorIndexes.add(group.colorIndex);
            }
        });

        return {
            calendarIds: Array.from(calendarIds),
            colorIndexes: Array.from(colorIndexes),
            isMultipleCalendars: calendarIds.size > 1,
        };
    };

    const calendarInfo = getDateCalendarInfo();

    // 날짜 클래스명 계산
    const getDateClassName = () => {
        let dateStyle = {};

        const baseClasses = [
            "relative",
            "w-full",
            "h-full",
            "flex",
            "items-center",
            "justify-center",
            "cursor-pointer",
            "transition-all",
            "duration-200",
            "text-xs sm:text-sm",
            "min-h-[2.5rem] sm:min-h-[3rem]",
        ];

        // 상태별 스타일
        switch (dateInfo.status) {
            case DateStatus.BLOCKED:
                baseClasses.push(
                    "bg-red-100",
                    "text-red-700",
                    "border-2",
                    "border-red-300",
                    "hover:bg-red-200"
                );
                break;
            case DateStatus.BUSY: {
                // 다중 캘린더 지원 배경색 구분
                const hasICalEvent = dateInfo.events.some(
                    (event) => event.source === "icalendar"
                );
                const hasCrimeCatEvent = dateInfo.events.some(
                    (event) => event.source === "crime-cat"
                );

                if (hasICalEvent && hasCrimeCatEvent) {
                    // iCalendar + Crime-Cat 복합 - 보라색 배경
                    baseClasses.push(
                        "bg-purple-100",
                        "text-purple-700",
                        "border-2",
                        "border-purple-300",
                        "hover:bg-purple-200"
                    );
                } else if (hasICalEvent) {
                    if (
                        displayMode === "separated" &&
                        calendarInfo.isMultipleCalendars
                    ) {
                        // 다중 캘린더 구분 모드 - 그라디언트 배경
                        dateStyle = {
                            background: createStripeGradient(
                                calendarInfo.colorIndexes
                            ),
                            border: "2px solid rgba(0,0,0,0.1)",
                        };
                        baseClasses.push(
                            "text-gray-800",
                            "hover:opacity-80"
                        );
                    } else if (
                        displayMode === "separated" &&
                        calendarInfo.colorIndexes.length === 1
                    ) {
                        // 단일 캘린더 구분 모드 - 해당 캘린더 색상
                        const colorInfo = getCalendarColor(
                            calendarInfo.colorIndexes[0]
                        );
                        dateStyle = {
                            backgroundColor: colorInfo.lightBg,
                            border: `2px solid ${colorInfo.hex}40`,
                            color: colorInfo.tailwindText.replace(
                                "text-",
                                ""
                            ),
                        };
                        baseClasses.push("hover:opacity-80");
                    } else {
                        // 통합 모드 - 실제 캘린더 색상 사용 (다중 캘린더인 경우 그라디언트)
                        if (calendarInfo.colorIndexes.length > 1) {
                            // 다중 캘린더 - 그라디언트 배경
                            dateStyle = {
                                background: createStripeGradient(calendarInfo.colorIndexes),
                                border: "2px solid rgba(0,0,0,0.1)",
                            };
                            baseClasses.push("text-gray-800", "hover:opacity-80");
                        } else if (calendarInfo.colorIndexes.length === 1) {
                            // 단일 캘린더 - 해당 캘린더 색상
                            const colorInfo = getCalendarColor(calendarInfo.colorIndexes[0]);
                            dateStyle = {
                                backgroundColor: colorInfo.lightBg,
                                border: `2px solid ${colorInfo.hex}40`,
                                color: colorInfo.tailwindText.replace("text-", ""),
                            };
                            baseClasses.push("hover:opacity-80");
                        } else {
                            // 색상 정보가 없는 경우 기본 색상
                            baseClasses.push(
                                "bg-gray-100",
                                "text-gray-700", 
                                "border-2",
                                "border-gray-300",
                                "hover:bg-gray-200"
                            );
                        }
                    }
                } else {
                    // Crime-Cat 이벤트만 - 파란색 배경
                    baseClasses.push(
                        "bg-blue-100",
                        "text-blue-700",
                        "border-2",
                        "border-blue-300",
                        "hover:bg-blue-200"
                    );
                }
                break;
            }
            default:
                baseClasses.push(
                    "bg-green-50",
                    "text-green-700",
                    "border-2",
                    "border-green-200",
                    "hover:bg-green-100"
                );
        }

        // 오늘 날짜 강조
        if (isToday) {
            baseClasses.push("ring-2", "ring-primary", "ring-offset-1");
        }

        // 과거 날짜 비활성화
        if (isPast) {
            baseClasses.push("opacity-50", "cursor-not-allowed");
        }

        // 이전/이후 월 날짜 스타일링 (강화된 시각적 구분)
        if (isOutsideMonth) {
            baseClasses.push(
                "relative",
                "bg-gray-50/80",
                "text-gray-400",
                "border border-gray-200/60",
                "backdrop-blur-[1px]",
                "before:absolute before:inset-0",
                "before:bg-gray-100/40",
                "before:rounded-md",
                "pointer-events-none", // 상호작용 차단
                "select-none",
                "cursor-default"
            );
        }

        // 드래그 선택 영역 (이전/이후 월이 아닌 경우만)
        if (isInDragRange && !isOutsideMonth) {
            baseClasses.push("bg-primary/20", "border-primary");
        }

        return {
            className: cn(baseClasses),
            style: dateStyle
        };
    };

    // 날짜 아이콘 렌더링 (이벤트 소스별 구분)
    const renderDateIcon = () => {
        const iconSize = calendarSizes.iconSize;

        switch (dateInfo.status) {
            case DateStatus.BLOCKED:
                return (
                    <Ban
                        className={`${iconSize} text-red-500`}
                    />
                );
            case DateStatus.BUSY: {
                // iCalendar vs Crime-Cat 이벤트 구분
                const hasICalEvent = dateInfo.events.some(
                    (event) => event.source === "icalendar"
                );
                const hasCrimeCatEvent = dateInfo.events.some(
                    (event) => event.source === "crime-cat"
                );

                if (hasICalEvent && hasCrimeCatEvent) {
                    // 둘 다 있는 경우 - 보라색 시계
                    return (
                        <Clock
                            className={`${iconSize} text-purple-500`}
                        />
                    );
                } else if (hasICalEvent) {
                    // iCalendar 이벤트만 - 노란색 달력
                    return (
                        <CalendarIcon
                            className={`${iconSize} text-yellow-500`}
                        />
                    );
                } else {
                    // Crime-Cat 이벤트만 - 파란색 시계
                    return (
                        <Clock
                            className={`${iconSize} text-blue-500`}
                        />
                    );
                }
            }
            default:
                return (
                    <Check
                        className={`${iconSize} text-green-500`}
                    />
                );
        }
    };

    // 캘린더 스트라이프 바 렌더링
    const renderCalendarStripe = () => {
        const displayRules = getDisplayRules(viewMode, isMobile);

        if (!showEvents || dateInfo.events.length === 0) return null;

        // 캘린더별 정보 수집
        const calendarInfos = dateInfo.events
            .filter((event) => event.source === "icalendar")
            .reduce((acc, event) => {
                const calendarId = event.calendarId || "unknown";
                if (!acc[calendarId]) {
                    acc[calendarId] = {
                        calendarId,
                        colorIndex:
                            event.colorIndex ??
                            findClosestColorIndex(event.colorHex),
                        colorHex: event.colorHex,
                        eventCount: 0,
                        calendarName: event.calendarName,
                    };
                }
                acc[calendarId].eventCount++;
                return acc;
            }, {} as Record<string, any>);

        const uniqueCalendars = Object.values(calendarInfos).slice(
            0,
            displayRules.maxCalendars
        );

        if (uniqueCalendars.length === 0) return null;

        return (
            <div className="flex gap-0.5 h-1 flex-1">
                {uniqueCalendars.map((info: any, index) => (
                    <div
                        key={info.calendarId || index}
                        style={getAccessibleStripeStyle(info.colorIndex)}
                        title={`${info.calendarName || "캘린더"} (${
                            info.eventCount
                        }개 이벤트)`}
                    />
                ))}
            </div>
        );
    };

    // 이벤트 개수 표시
    const renderEventCount = () => {
        const displayRules = getDisplayRules(viewMode, isMobile);

        if (!displayRules.showEventCount || dateInfo.events.length === 0)
            return null;

        return (
            <div className="text-[10px] leading-none font-medium text-muted-foreground rounded px-1 py-0 min-w-[14px] text-center">
                {dateInfo.events.length}
            </div>
        );
    };

    // 날짜 셀 배경 렌더링
    const renderDateBackground = () => {
        return (
            <div
                className="absolute inset-0 rounded"
                style={getDateCellBackgroundStyle(dateInfo.status)}
            />
        );
    };

    const dateClassName = getDateClassName();
    const displayRules = getDisplayRules(viewMode, isMobile);

    return (
        <div
            className={cn(
                dateClassName.className,
                "relative overflow-hidden" // 표식이 날짜 셀을 벗어나지 않도록
            )}
            style={{
                ...dateClassName.style,
                minHeight: displayRules.minCellHeight,
            }}
            title={
                isOutsideMonth
                    ? "이전/다음 월 날짜 (참고용)"
                    : undefined
            }
            onClick={() => !isOutsideMonth && onDateClick(date)}
            onMouseDown={() => !isOutsideMonth && onStartDrag(date)}
            onMouseEnter={(e) => {
                if (!isOutsideMonth) {
                    onUpdateDrag(date);
                    onMouseEnter(date, e);
                }
            }}
            onMouseLeave={!isOutsideMonth ? onMouseLeave : undefined}
            onTouchStart={() => !isOutsideMonth && onStartDrag(date)}
            onTouchMove={
                !isOutsideMonth
                    ? (e) => {
                          e.preventDefault();
                          const touch = e.touches[0];
                          const element = document.elementFromPoint(
                              touch.clientX,
                              touch.clientY
                          );
                          if (element) {
                              const dateStr = element.getAttribute("data-date");
                              if (dateStr) {
                                  onUpdateDrag(new Date(dateStr));
                              }
                          }
                      }
                    : undefined
            }
            onTouchEnd={!isOutsideMonth ? onEndDrag : undefined}
            data-date={date.toISOString()}
        >
            {/* 로딩 오버레이 */}
            {isLoading && !isOutsideMonth && (
                <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                </div>
            )}

            {/* Layer 1: 배경 및 상태 표시 */}
            <div className="absolute inset-0 z-0 rounded">
                {renderDateBackground()}
            </div>

            {/* Layer 2: 메인 콘텐츠 (날짜 숫자) */}
            <div className="relative z-10 flex flex-col h-full">
                {/* 상단: 날짜 숫자 */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span
                        className={cn(
                            "font-medium relative z-20",
                            calendarSizes.fontSize,
                            isToday && "font-bold"
                        )}
                    >
                        {date.getDate()}
                    </span>

                    {/* 이벤트 개수: 날짜 아래 */}
                    <div className="mt-1">
                        {renderEventCount()}
                    </div>
                </div>

                {/* 하단: 정보 영역 */}
                {!isOutsideMonth &&
                    showEvents &&
                    dateInfo.events.length > 0 && (
                        <div className="h-0 flex items-end justify-between px-1 gap-1 relative z-15">
                            {/* 캘린더 색상 스트라이프 */}
                            {renderCalendarStripe()}
                        </div>
                    )}
            </div>

            {/* Layer 4: 상태 아이콘 (우상단) */}
            {displayRules.showStatusIcon && (
                <div className="absolute top-1 right-1 w-4 h-4 z-25 flex items-center justify-center">
                    {renderDateIcon()}
                </div>
            )}
        </div>
    );
};

export default DateCell;