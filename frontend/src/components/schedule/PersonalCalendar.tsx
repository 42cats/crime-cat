import React, { useCallback, useState, useEffect } from "react";
import {
    Calendar as CalendarIcon,
    Clock,
    Ban,
    Check,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2,
    Grid,
    List,
    Settings,
} from "lucide-react";

// 겹침 표시를 위한 미니멀 CSS 스타일
const overlappingStyles = `
  .time-conflict-cell {
    background: rgba(239, 68, 68, 0.08) !important;
    border: 2px solid rgba(239, 68, 68, 0.4) !important;
    position: relative;
  }
  
  .time-conflict-cell::after {
    content: '⚠️';
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 10px;
    opacity: 0.8;
    z-index: 1;
  }
  
  .all-day-conflict-cell {
    background: rgba(251, 146, 60, 0.08) !important;
    border: 2px solid rgba(251, 146, 60, 0.4) !important;
    position: relative;
  }
  
  /* 전일 이벤트 충돌 표시 - 아이콘 제거하고 배경색만 사용 */
  
  .mixed-conflict-cell {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(251, 146, 60, 0.06) 100%) !important;
    border: 2px solid rgba(245, 101, 101, 0.5) !important;
    position: relative;
  }
  
  .mixed-conflict-cell::after {
    content: '⚡';
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 10px;
    opacity: 0.8;
    z-index: 1;
  }
`;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { CalendarHeader, CalendarLegend, CalendarStats } from './calendar'; // 미사용으로 주석 처리
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    useCalendarState,
    DateStatus,
    CalendarEvent,
} from "@/hooks/useCalendarState";
import { useMemo } from "react";
import EventCountIndicator from "./EventCountIndicator";
import CalendarManagement from "./CalendarManagement";
import { ICSTooltip, ICSMobileList } from "./ics";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { scheduleService } from "@/api/schedule";
import useCalendarManagement from "@/hooks/useCalendarManagement";
import {
    getCalendarColor,
    getCalendarHex,
    createStripeGradient,
    getCalendarDotStyle,
    findClosestColorIndex,
    getCalendarStripeStyle,
    getEnhancedCalendarDotStyle,
    getDateCellBackgroundStyle,
    getDisplayRules,
    getAccessibleStripeStyle,
    getAccessibleDotStyle,
    validateColorContrast,
} from "@/utils/calendarColors";
import type { CalendarDisplayMode } from "@/types/calendar";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface PersonalCalendarProps {
    className?: string;
    onDateSelect?: (date: Date) => void;
    showBlockedDates?: boolean;
    allowBlocking?: boolean;
    showEvents?: boolean;
    autoRefresh?: boolean;
    defaultViewMode?: CalendarViewMode;
    onViewModeChange?: (mode: CalendarViewMode) => void;
    showCalendarManagement?: boolean;
    defaultDisplayMode?: CalendarDisplayMode;
}

type CalendarViewMode = "compact" | "standard" | "expanded";

type CalendarSize = {
    cellSize: string;
    fontSize: string;
    iconSize: string;
    spacing: string;
    headerSize: string;
};

/**
 * 개인 캘린더 컴포넌트
 * - iCalendar 데이터 시각화
 * - 3가지 날짜 상태 표시 (사용가능/비활성화/기존일정)
 * - 클릭/드래그 날짜 비활성화 기능
 * - 월간/주간 뷰 지원
 */
const PersonalCalendar: React.FC<PersonalCalendarProps> = ({
    className,
    onDateSelect,
    showBlockedDates = true,
    allowBlocking = true,
    showEvents = true,
    autoRefresh = false,
    defaultViewMode = "standard",
    onViewModeChange,
    showCalendarManagement = false,
    defaultDisplayMode = "unified",
}) => {
    const isMobile = useIsMobile();
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState<CalendarViewMode>(
        isMobile ? "compact" : defaultViewMode
    );
    const [isCopyingSchedule, setIsCopyingSchedule] = useState(false);
    const [displayMode, setDisplayMode] =
        useState<CalendarDisplayMode>(defaultDisplayMode);
    const [showManagement, setShowManagement] = useState(false);

    // 다중 캘린더 관리 훅
    const {
        calendars,
        isLoading: isCalendarLoading,
        addCalendar,
        updateCalendar,
        deleteCalendar,
        syncCalendar,
        syncAllCalendars,
        getGroupedEvents,
    } = useCalendarManagement();

    // 모바일/데스크톱 전환 시 뷰 모드 자동 조정
    useEffect(() => {
        if (isMobile && viewMode === "expanded") {
            setViewMode("standard");
        }
    }, [isMobile, viewMode]);

    // 뷰 모드 변경 핸들러
    const handleViewModeChange = useCallback(
        (mode: CalendarViewMode) => {
            setViewMode(mode);
            onViewModeChange?.(mode);
        },
        [onViewModeChange]
    );

    // 뷰 모드별 사이즈 설정
    const getCalendarSizes = useCallback(
        (mode: CalendarViewMode): CalendarSize => {
            const sizes: Record<CalendarViewMode, CalendarSize> = {
                compact: {
                    cellSize: isMobile ? "h-8 w-8" : "h-12 w-12",
                    fontSize: "text-xs",
                    iconSize: "w-2.5 h-2.5",
                    spacing: "space-y-2",
                    headerSize: "text-sm",
                },
                standard: {
                    cellSize: isMobile ? "h-10 w-10" : "h-16 w-16",
                    fontSize: "text-sm",
                    iconSize: "w-3 h-3",
                    spacing: "space-y-3",
                    headerSize: "text-base",
                },
                expanded: {
                    cellSize: isMobile ? "h-12 w-12" : "h-20 w-20",
                    fontSize: "text-base",
                    iconSize: "w-4 h-4",
                    spacing: "space-y-4",
                    headerSize: "text-lg",
                },
            };
            return sizes[mode];
        },
        [isMobile]
    );

    const calendarSizes = getCalendarSizes(viewMode);
    // 캘린더 상태 관리 훅 사용
    const {
        currentMonth,
        setCurrentMonth,
        monthStats,
        isLoading,
        error,
        isDragging,
        dragStart,
        dragEnd,
        getDateInfo,
        handleDateClick: hookHandleDateClick,
        startDrag,
        updateDrag,
        endDrag,
        cancelDrag,
        refreshData,
        userEvents,
        icsEvents,
        groupedICSEvents,
        getICSEventsForDate,
        hasICSEventsOnDate,
    } = useCalendarState({
        enableBlocking: allowBlocking && showBlockedDates,
        enableEventFetching: showEvents,
        autoRefreshInterval: autoRefresh ? 30000 : 0, // 30초
    });

    // PC 호버 툴팁 상태
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const [mousePosition, setMousePosition] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [hoveredEvents, setHoveredEvents] = useState<CalendarEvent[]>([]);

    // Crime-Cat 이벤트만 필터링 (메모이제이션)
    const crimeCatEvents = useMemo(() => {
        return userEvents.filter((event) => event.source === "crime-cat");
    }, [userEvents]);

    // PersonalCalendar 전용 iCS 이벤트 목록 생성 (툴팁용)
    const personalCalendarICSEvents = useMemo(() => {
        // 기존 icsEvents를 그대로 사용 (이미 올바른 데이터)
        return icsEvents.map((event) => ({
            ...event,
            source: "icalendar" as const,
        }));
    }, [icsEvents]);

    // 다중 캘린더 정보와 개인 일정을 통합 (메모이제이션)
    const calendarGroupsForDisplay = useMemo(() => {
        const groups = new Map<
            string,
            {
                calendar: any;
                events: CalendarEvent[];
                colorIndex: number;
            }
        >();

        // personalCalendarICSEvents 사용
        personalCalendarICSEvents.forEach((event) => {
            if (event.calendarId && displayMode === "separated") {
                // 캘린더별로 구분
                const calendar = calendars.find(
                    (cal) => cal.id === event.calendarId
                );
                if (calendar) {
                    if (!groups.has(calendar.id)) {
                        groups.set(calendar.id, {
                            calendar,
                            events: [],
                            colorIndex: calendar.colorIndex,
                        });
                    }
                    groups.get(calendar.id)!.events.push(event); // 이벤트 그대로 사용 (이미 색상 정보 포함)
                }
            } else {
                // 통합 모드 또는 캘린더 정보가 없는 경우
                const unifiedKey = "unified-personal";
                if (!groups.has(unifiedKey)) {
                    groups.set(unifiedKey, {
                        calendar: {
                            id: unifiedKey,
                            displayName: "개인일정",
                            colorIndex: 0,
                        },
                        events: [],
                        colorIndex: 0,
                    });
                }
                groups.get(unifiedKey)!.events.push({
                    ...event,
                    colorHex: event.colorHex || getCalendarHex(0), // 기존 색상 우선, 없으면 기본값
                    calendarName: event.calendarName || "개인일정",
                });
            }
        });

        return groups;
    }, [personalCalendarICSEvents, calendars, displayMode]);

    // 동적 범례 아이템 생성
    const dynamicLegendItems = useMemo(() => {
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
                bgColor:
                    "bg-gradient-to-r from-red-100 via-yellow-100 to-blue-100",
                borderColor: "border-purple-300",
                icon: Clock,
                iconColor: "text-purple-500",
            },
        ];

        return [...baseItems, ...calendarItems, ...systemItems];
    }, [calendars]);

    // 시간 겹침 유틸리티 함수
    const isTimeOverlapping = useCallback(
        (event1: CalendarEvent, event2: CalendarEvent): boolean => {
            if (event1.allDay || event2.allDay) return false; // 전일 이벤트는 별도 처리

            const start1 = new Date(event1.startTime);
            const end1 = new Date(event1.endTime);
            const start2 = new Date(event2.startTime);
            const end2 = new Date(event2.endTime);

            return start1 < end2 && start2 < end1;
        },
        []
    );

    // 날짜별 시간 겹침 분석
    const analyzeTimeOverlaps = useCallback(
        (date: Date) => {
            const dateStr = date.toISOString().split("T")[0];
            const dayEvents = personalCalendarICSEvents.filter((event) => {
                const eventDate = new Date(event.startTime)
                    .toISOString()
                    .split("T")[0];
                return eventDate === dateStr;
            });

            if (dayEvents.length <= 1) {
                return {
                    hasOverlap: false,
                    overlapType: "none",
                    calendarsInvolved: [],
                    conflictingEvents: [],
                };
            }

            const allDayEvents = dayEvents.filter((e) => e.allDay);
            const timedEvents = dayEvents.filter((e) => !e.allDay);
            const timeOverlaps: any[] = [];
            const calendarsInvolved = new Set<string>();

            // 전일 + 시간 이벤트 겹침
            if (allDayEvents.length > 0 && timedEvents.length > 0) {
                timeOverlaps.push({
                    type: "allday-timed",
                    events: [...allDayEvents, ...timedEvents],
                });

                [...allDayEvents, ...timedEvents].forEach((event) => {
                    if (event.calendarId)
                        calendarsInvolved.add(event.calendarId);
                });
            }

            // 시간 이벤트 간 겹침
            for (let i = 0; i < timedEvents.length; i++) {
                for (let j = i + 1; j < timedEvents.length; j++) {
                    if (isTimeOverlapping(timedEvents[i], timedEvents[j])) {
                        timeOverlaps.push({
                            type: "time-conflict",
                            events: [timedEvents[i], timedEvents[j]],
                        });

                        if (timedEvents[i].calendarId)
                            calendarsInvolved.add(timedEvents[i].calendarId);
                        if (timedEvents[j].calendarId)
                            calendarsInvolved.add(timedEvents[j].calendarId);
                    }
                }
            }

            // 전일 이벤트 간 겹침 (다중 전일 이벤트)
            if (allDayEvents.length > 1) {
                timeOverlaps.push({
                    type: "allday-conflict",
                    events: allDayEvents,
                });

                allDayEvents.forEach((event) => {
                    if (event.calendarId)
                        calendarsInvolved.add(event.calendarId);
                });
            }

            const hasTimeConflict = timeOverlaps.some(
                (overlap) =>
                    overlap.type === "time-conflict" ||
                    overlap.type === "allday-timed"
            );

            return {
                hasOverlap: timeOverlaps.length > 0,
                overlapType: hasTimeConflict
                    ? "time-conflict"
                    : allDayEvents.length > 1
                    ? "all-day-conflict"
                    : "mixed-conflict",
                calendarsInvolved: Array.from(calendarsInvolved),
                conflictingEvents: timeOverlaps.flatMap(
                    (overlap) => overlap.events
                ),
            };
        },
        [personalCalendarICSEvents, isTimeOverlapping]
    );

    // 날짜별 캘린더 및 겹침 정보 계산 (통합)
    const getDateCalendarInfo = useCallback(
        (date: Date) => {
            const dateKey = date.toISOString().split("T")[0];
            const calendarIds = new Set<string>();
            const colorIndexes = new Set<number>();

            // 기존 캘린더 그룹 정보
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

            // 시간 겹침 분석
            const overlapInfo = analyzeTimeOverlaps(date);

            const result = {
                calendarIds: Array.from(calendarIds),
                colorIndexes: Array.from(colorIndexes),
                isMultipleCalendars: calendarIds.size > 1,
                ...overlapInfo, // 겹침 정보 추가
            };

            // 디버깅 로그 제거 - 무한 생성 방지

            return result;
        },
        [calendarGroupsForDisplay, analyzeTimeOverlaps]
    );

    // 날짜 스타일 계산 로직
    const getDateDisplayStyle = useCallback(
        (date: Date) => {
            const info = getDateCalendarInfo(date);

            // 시간 충돌이 있는 경우 (최우선)
            if (info.hasOverlap && info.overlapType === "time-conflict") {
                return {
                    className: "time-conflict-cell",
                    style: {},
                };
            }

            // 전일 이벤트 충돌
            if (info.hasOverlap && info.overlapType === "all-day-conflict") {
                return {
                    className: "all-day-conflict-cell",
                    style: {},
                };
            }

            // 복합 충돌 (전일 + 시간 이벤트)
            if (info.hasOverlap && info.overlapType === "mixed-conflict") {
                return {
                    className: "mixed-conflict-cell",
                    style: {},
                };
            }

            // 다중 캘린더 (겹침 없음)
            if (info.isMultipleCalendars && !info.hasOverlap) {
                return {
                    className: "multiple-calendars-cell",
                    style: {
                        background: createStripeGradient(info.colorIndexes),
                        border: "2px solid rgba(0,0,0,0.1)",
                    },
                };
            }

            // 단일 캘린더
            if (info.colorIndexes.length === 1) {
                const colorInfo = getCalendarColor(info.colorIndexes[0]);
                return {
                    className: "single-calendar-cell",
                    style: {
                        backgroundColor: colorInfo.lightBg,
                        border: `2px solid ${colorInfo.hex}40`,
                        color: colorInfo.tailwindText.replace("text-", ""),
                    },
                };
            }

            // 기본 상태 (이벤트 없음)
            return {
                className: "default-cell",
                style: {},
            };
        },
        [getDateCalendarInfo, createStripeGradient, getCalendarColor]
    );

    /**
     * 날짜 클릭 핸들러 (커스텀 로직 추가)
     */
    const handleDateClick = useCallback(
        (date: Date) => {
            hookHandleDateClick(date);
            onDateSelect?.(date);
        },
        [hookHandleDateClick, onDateSelect]
    );

    /**
     * 특정 날짜의 iCS 이벤트 조회 (PersonalCalendar 전용)
     */
    const getPersonalICSEventsForDate = useCallback(
        (date: Date): CalendarEvent[] => {
            const targetDateString = date.toDateString();
            return personalCalendarICSEvents.filter((event) => {
                const eventDate = new Date(event.startTime);
                return eventDate.toDateString() === targetDateString;
            });
        },
        [personalCalendarICSEvents]
    );

    /**
     * 특정 날짜에 iCS 이벤트 존재 여부 확인 (PersonalCalendar 전용)
     */
    const hasPersonalICSEventsOnDate = useCallback(
        (date: Date): boolean => {
            return getPersonalICSEventsForDate(date).length > 0;
        },
        [getPersonalICSEventsForDate]
    );

    /**
     * PC 호버 이벤트 핸들러 (디바운스됨)
     */
    const handleCellMouseEnter = useDebouncedCallback(
        (date: Date, event: React.MouseEvent) => {
            // 모바일에서는 호버 비활성화
            if (isMobile) return;

            // iCS 이벤트가 있는 날짜만 호버 반응
            if (hasPersonalICSEventsOnDate(date)) {
                const events = getPersonalICSEventsForDate(date);
                setHoveredDate(date);
                setMousePosition({ x: event.clientX, y: event.clientY });
                setHoveredEvents(events);
            }
        },
        20
    ); // 20ms 디바운스로 반응속도 향상

    /**
     * 호버 종료 핸들러 (디바운스됨)
     */
    const handleCellMouseLeave = useDebouncedCallback(() => {
        if (isMobile) return;

        // 툴팁 숨기기
        setHoveredDate(null);
        setMousePosition(null);
        setHoveredEvents([]);
    }, 100); // 100ms 디바운스로 깜빡임 방지

    /**
     * 현재 날짜 기준 3달치 날짜 범위 계산 (캘린더 뷰와 무관)
     */
    const getThreeMonthRangeFromToday = useCallback(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonthIndex = today.getMonth();

        // 현재 월부터 3개월
        const months = [];
        for (let i = 0; i < 3; i++) {
            months.push(new Date(currentYear, currentMonthIndex + i, 1));
        }

        return months; // [현재월, 다음월, 다다음월]
    }, []); // currentMonth 의존성 제거

    /**
     * API에서 현재 날짜 기준 3달치 최신 데이터 조회
     */
    const fetchThreeMonthScheduleData = useCallback(async () => {
        const months = getThreeMonthRangeFromToday();

        // 첫 번째 월의 1일부터
        const startDate = new Date(
            months[0].getFullYear(),
            months[0].getMonth(),
            1
        );

        // 마지막 월의 마지막 날까지
        const lastMonth = months[months.length - 1];
        const endDate = new Date(
            lastMonth.getFullYear(),
            lastMonth.getMonth() + 1,
            0
        );

        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];

        // 병렬로 3달치 데이터 조회
        const [blockedDates, userEvents] = await Promise.all([
            scheduleService.getBlockedDates(startDateStr, endDateStr),
            scheduleService.getUserEventsInRange(startDateStr, endDateStr),
        ]);

        return { blockedDates, userEvents };
    }, [getThreeMonthRangeFromToday]);

    /**
     * 독립적 날짜 상태 계산
     */
    const calculateDateStatus = useCallback(
        (date: Date, blockedDates: string[], userEvents: CalendarEvent[]) => {
            const dateStr = date.toISOString().split("T")[0];
            const blockedByUser = blockedDates.includes(dateStr);

            const dayEvents = userEvents.filter((event) => {
                const eventDate = new Date(event.startTime).toDateString();
                return eventDate === date.toDateString();
            });

            if (blockedByUser) return "blocked";
            if (dayEvents.length > 0) return "busy";
            return "available";
        },
        []
    );

    /**
     * API 데이터 기반 현재 날짜 기준 3달치 가능한 날짜 수집
     */
    const collectAvailableDatesFromAPI = useCallback(
        (blockedDates: string[], userEvents: CalendarEvent[]) => {
            const months = getThreeMonthRangeFromToday();

            const result: { [key: string]: number[] } = {};
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            months.forEach((month) => {
                const monthKey = `${month.getFullYear()}-${
                    month.getMonth() + 1
                }`;
                const daysInMonth = new Date(
                    month.getFullYear(),
                    month.getMonth() + 1,
                    0
                ).getDate();

                const availableDays: number[] = [];

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(
                        month.getFullYear(),
                        month.getMonth(),
                        day
                    );

                    // 과거 날짜 제외
                    if (date < today) continue;

                    const status = calculateDateStatus(
                        date,
                        blockedDates,
                        userEvents
                    );
                    if (status === "available") {
                        availableDays.push(day);
                    }
                }

                if (availableDays.length > 0) {
                    result[monthKey] = availableDays;
                }
            });

            return result;
        },
        [getThreeMonthRangeFromToday, calculateDateStatus]
    );

    /**
     * 가능한 날짜를 텍스트로 포맷팅
     */
    const formatAvailableDatesText = useCallback(
        (monthData: { [key: string]: number[] }) => {
            const parts: string[] = [];

            Object.entries(monthData).forEach(([monthKey, days]) => {
                const [year, month] = monthKey.split("-");
                const monthName = `${parseInt(month)}월`;
                const daysText = days.join(" ");
                parts.push(`${monthName} ${daysText}`);
            });

            return parts.join(", ");
        },
        []
    );

    /**
     * 가능한 날짜 텍스트 복사 (API 기반)
     */
    const copyAvailableDates = useCallback(async () => {
        setIsCopyingSchedule(true);

        try {
            // API에서 3달치 최신 데이터 조회
            const { blockedDates, userEvents } =
                await fetchThreeMonthScheduleData();

            // 3달치 가능한 날짜 계산
            const availableDates = collectAvailableDatesFromAPI(
                blockedDates,
                userEvents
            );

            // 텍스트 포맷팅
            const text = formatAvailableDatesText(availableDates);

            if (!text) {
                toast({
                    title: "복사할 일정이 없습니다",
                    description: "가능한 일정이 없어 복사할 내용이 없습니다.",
                    variant: "destructive",
                });
                return;
            }

            // 클립보드에 복사
            await navigator.clipboard.writeText(text);

            toast({
                title: "일정이 복사되었습니다",
                description: text,
                duration: 3000,
            });
        } catch (error) {
            // API 에러 처리
            if (error instanceof Error && error.message.includes("fetch")) {
                toast({
                    title: "일정 조회 실패",
                    description: "최신 일정 정보를 가져올 수 없습니다.",
                    variant: "destructive",
                });
                return;
            }

            // 클립보드 API 실패 시 폴백
            try {
                const { blockedDates, userEvents } =
                    await fetchThreeMonthScheduleData();
                const availableDates = collectAvailableDatesFromAPI(
                    blockedDates,
                    userEvents
                );
                const text = formatAvailableDatesText(availableDates);

                const textarea = document.createElement("textarea");
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);

                toast({
                    title: "일정이 복사되었습니다",
                    description: text,
                    duration: 3000,
                });
            } catch (fallbackError) {
                toast({
                    title: "복사 실패",
                    description: "일정 복사 중 오류가 발생했습니다.",
                    variant: "destructive",
                });
            }
        } finally {
            setIsCopyingSchedule(false);
        }
    }, [
        fetchThreeMonthScheduleData,
        collectAvailableDatesFromAPI,
        formatAvailableDatesText,
        toast,
    ]);

    /**
     * 날짜 스타일 계산
     */
    const getDateClassName = useCallback(
        (date: Date, isOutside?: boolean) => {
            const dateInfo = getDateInfo(date);
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
                    const calendarInfo = getDateCalendarInfo(date);

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
                            // 통합 모드 - 기본 노란색 배경
                            baseClasses.push(
                                "bg-yellow-100",
                                "text-yellow-700",
                                "border-2",
                                "border-yellow-300",
                                "hover:bg-yellow-200"
                            );
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

            return cn(baseClasses);
        },
        [getDateInfo, isDragging, dragStart, dragEnd, currentMonth]
    );

    /**
     * 날짜 아이콘 렌더링 (이벤트 소스별 구분)
     */
    const renderDateIcon = useCallback(
        (date: Date) => {
            const dateInfo = getDateInfo(date);

            const iconSize = calendarSizes.iconSize;
            // 개수 표시와 겹치지 않도록 왼쪽 상단으로 이동
            const iconPosition =
                viewMode === "compact" ? "top-0 left-0" : "top-0.5 left-0.5";

            switch (dateInfo.status) {
                case DateStatus.BLOCKED:
                    return (
                        <Ban
                            className={`${iconSize} absolute ${iconPosition} text-red-500 z-10`}
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
                                className={`${iconSize} absolute ${iconPosition} text-purple-500`}
                            />
                        );
                    } else if (hasICalEvent) {
                        // iCalendar 이벤트만 - 노란색 달력
                        return (
                            <CalendarIcon
                                className={`${iconSize} absolute ${iconPosition} text-yellow-500`}
                            />
                        );
                    } else {
                        // Crime-Cat 이벤트만 - 파란색 시계
                        return (
                            <Clock
                                className={`${iconSize} absolute ${iconPosition} text-blue-500`}
                            />
                        );
                    }
                }
                default:
                    return (
                        <Check
                            className={`${iconSize} absolute ${iconPosition} text-green-500`}
                        />
                    );
            }
        },
        [getDateInfo, calendarSizes.iconSize, viewMode]
    );

    /**
     * 캘린더 스트라이프 바 렌더링 (새로운 메인 방식)
     */
    const renderCalendarStripe = useCallback(
        (date: Date) => {
            const dateInfo = getDateInfo(date);
            const isMobile = useIsMobile();
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
        },
        [getDateInfo, showEvents, viewMode]
    );

    /**
     * 개선된 색상 점 렌더링 (보조 방식)
     */
    const renderEnhancedCalendarDots = useCallback(
        (date: Date) => {
            const dateInfo = getDateInfo(date);
            const isMobile = useIsMobile();
            const displayRules = getDisplayRules(viewMode, isMobile);

            if (!showEvents || dateInfo.events.length === 0) return null;
            if (
                displayRules.showCalendarColors !== "both" &&
                displayRules.showCalendarColors !== "dots"
            ) {
                return null;
            }

            // 각 이벤트의 캘린더 정보 수집
            const calendarInfos = dateInfo.events
                .filter((event) => event.source === "icalendar")
                .map((event) => ({
                    calendarId: event.calendarId,
                    colorIndex:
                        event.colorIndex ??
                        findClosestColorIndex(event.colorHex),
                    colorHex: event.colorHex,
                }))
                .filter(
                    (info, index, arr) =>
                        arr.findIndex(
                            (item) => item.calendarId === info.calendarId
                        ) === index
                )
                .slice(0, 3); // 최대 3개만 표시

            if (calendarInfos.length === 0) return null;

            return (
                <div className="flex gap-0.5">
                    {calendarInfos.map((info, index) => (
                        <div
                            key={info.calendarId || index}
                            style={getAccessibleDotStyle(info.colorIndex)}
                            title={`캘린더 ${info.calendarId}`}
                        />
                    ))}
                    {dateInfo.events.filter((e) => e.source === "icalendar")
                        .length > 3 && (
                        <div className="text-xs text-muted-foreground leading-none self-center">
                            +
                            {dateInfo.events.filter(
                                (e) => e.source === "icalendar"
                            ).length - 3}
                        </div>
                    )}
                </div>
            );
        },
        [getDateInfo, showEvents, viewMode]
    );

    /**
     * 이벤트 개수 표시
     */
    const renderEventCount = useCallback(
        (date: Date) => {
            const dateInfo = getDateInfo(date);
            const isMobile = useIsMobile();
            const displayRules = getDisplayRules(viewMode, isMobile);

            if (!displayRules.showEventCount || dateInfo.events.length === 0)
                return null;

            return (
                <div className="text-[10px] leading-none font-medium text-muted-foreground rounded px-1 py-0 min-w-[14px] text-center">
                    {dateInfo.events.length}
                </div>
            );
        },
        [getDateInfo, viewMode]
    );

    /**
     * 날짜 셀 배경 렌더링
     */
    const renderDateBackground = useCallback(
        (date: Date) => {
            const dateInfo = getDateInfo(date);
            return (
                <div
                    className="absolute inset-0 rounded"
                    style={getDateCellBackgroundStyle(dateInfo.status)}
                />
            );
        },
        [getDateInfo]
    );

    /**
     * 범례 컴포넌트 (반응형 디자인)
     */
    const Legend = () => {
        const isMobile = useIsMobile();

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
                                    setDisplayMode(value as CalendarDisplayMode)
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
                                    setShowManagement(!showManagement)
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
                            onAddCalendar={addCalendar}
                            onUpdateCalendar={updateCalendar}
                            onDeleteCalendar={deleteCalendar}
                            onSyncCalendar={syncCalendar}
                            onSyncAllCalendars={syncAllCalendars}
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
                            onClick={copyAvailableDates}
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

    // CSS 스타일 주입
    useEffect(() => {
        const styleId = "calendar-overlap-styles";
        if (!document.getElementById(styleId)) {
            const styleElement = document.createElement("style");
            styleElement.id = styleId;
            styleElement.textContent = overlappingStyles;
            document.head.appendChild(styleElement);
        }

        return () => {
            const styleElement = document.getElementById(styleId);
            if (styleElement) {
                document.head.removeChild(styleElement);
            }
        };
    }, []);

    return (
        <Card className={cn("w-full max-w-full", className)}>
            <CardHeader className={cn("pb-4", isMobile && "px-4 py-3")}>
                <div className="flex flex-col gap-4">
                    {/* 제목 및 컨트롤 */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle
                            className={cn(
                                "flex items-center gap-2",
                                calendarSizes.headerSize
                            )}
                        >
                            <CalendarIcon
                                className={cn(
                                    calendarSizes.iconSize === "w-2.5 h-2.5"
                                        ? "w-4 h-4"
                                        : calendarSizes.iconSize === "w-3 h-3"
                                        ? "w-5 h-5"
                                        : "w-6 h-6"
                                )}
                            />
                            개인 캘린더
                        </CardTitle>

                        <div className="flex items-center gap-3">
                            {/* 뷰 모드 선택 */}
                            {!isMobile && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        크기:
                                    </span>
                                    <ToggleGroup
                                        type="single"
                                        value={viewMode}
                                        onValueChange={(value) =>
                                            value &&
                                            handleViewModeChange(
                                                value as CalendarViewMode
                                            )
                                        }
                                        size="sm"
                                    >
                                        <ToggleGroupItem
                                            value="compact"
                                            aria-label="컴팩트 뷰"
                                        >
                                            <Minimize2 className="w-3 h-3" />
                                        </ToggleGroupItem>
                                        <ToggleGroupItem
                                            value="standard"
                                            aria-label="표준 뷰"
                                        >
                                            <Grid className="w-3 h-3" />
                                        </ToggleGroupItem>
                                        <ToggleGroupItem
                                            value="expanded"
                                            aria-label="확대 뷰"
                                        >
                                            <Maximize2 className="w-3 h-3" />
                                        </ToggleGroupItem>
                                    </ToggleGroup>
                                </div>
                            )}

                            {/* 모바일 뷰 모드 선택 */}
                            {isMobile && (
                                <Select
                                    value={viewMode}
                                    onValueChange={(value) =>
                                        handleViewModeChange(
                                            value as CalendarViewMode
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="compact">
                                            컴팩트
                                        </SelectItem>
                                        <SelectItem value="standard">
                                            표준
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}

                            {/* 새로고침 버튼 */}
                            {isLoading ? (
                                <div
                                    className={cn(
                                        "flex items-center gap-2 text-muted-foreground",
                                        calendarSizes.fontSize
                                    )}
                                >
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    {!isMobile && "로딩 중..."}
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size={isMobile ? "sm" : "default"}
                                    onClick={refreshData}
                                    className="flex items-center gap-1"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    {!isMobile && "새로고침"}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* 뷰 모드 설명 */}
                    <div
                        className={cn(
                            "text-muted-foreground",
                            calendarSizes.fontSize
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                {viewMode === "compact" && "컴팩트"}
                                {viewMode === "standard" && "표준"}
                                {viewMode === "expanded" && "확대"}
                            </Badge>
                            <span>
                                {viewMode === "compact" &&
                                    "작은 크기로 한눈에 보기"}
                                {viewMode === "standard" &&
                                    "기본 크기로 편리하게 보기"}
                                {viewMode === "expanded" &&
                                    "큰 크기로 자세히 보기"}
                            </span>
                        </div>
                    </div>
                </div>

                {allowBlocking && (
                    <p
                        className={cn(
                            "text-muted-foreground",
                            isMobile ? "text-xs" : "text-sm"
                        )}
                    >
                        {isMobile
                            ? "탭하거나 드래그하여 날짜를 비활성화하세요."
                            : "날짜를 클릭하거나 드래그하여 추천에서 제외할 날짜를 선택하세요."}
                    </p>
                )}
            </CardHeader>

            <CardContent className={cn("space-y-4", isMobile && "px-4 pb-4")}>
                {/* 에러 표시 */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <p
                            className={cn(
                                "text-destructive",
                                isMobile ? "text-xs" : "text-sm"
                            )}
                        >
                            데이터를 불러오는 중 오류가 발생했습니다.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshData}
                            className="mt-2"
                        >
                            다시 시도
                        </Button>
                    </div>
                )}

                {/* 범례 */}
                <Legend />

                {/* 캘린더 */}
                <div
                    onMouseUp={endDrag}
                    onMouseLeave={cancelDrag}
                    className="overflow-hidden"
                >
                    <Calendar
                        mode="single"
                        selected={undefined}
                        onSelect={() => {}} // 기본 선택 동작 비활성화
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        className={cn(
                            "rounded-md border w-full",
                            isMobile && "text-sm"
                        )}
                        classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: cn("w-full", calendarSizes.spacing),
                            caption:
                                "flex justify-center pt-1 relative items-center",
                            caption_label: cn(
                                "font-medium",
                                calendarSizes.fontSize
                            ),
                            nav: "space-x-1 flex items-center",
                            nav_button: cn(
                                "bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
                                calendarSizes.cellSize
                                    .split(" ")
                                    .slice(0, 2)
                                    .join(" ") // h-x w-x 만 추출
                            ),
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: cn(
                                "w-full border-collapse",
                                viewMode === "compact"
                                    ? "space-y-1"
                                    : "space-y-2"
                            ),
                            head_row: "flex w-full",
                            head_cell: cn(
                                "text-muted-foreground rounded-md font-normal text-center flex items-center justify-center",
                                calendarSizes.cellSize,
                                calendarSizes.fontSize
                            ),
                            row: cn(
                                "flex w-full",
                                viewMode === "compact" ? "mt-1" : "mt-2"
                            ),
                            cell: cn(
                                "relative p-0 text-center focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                                calendarSizes.cellSize
                            ),
                            day: cn(
                                "relative p-0",
                                calendarSizes.cellSize,
                                calendarSizes.fontSize
                            ),
                            day_outside: "text-muted-foreground opacity-50",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_hidden: "invisible",
                        }}
                        components={{
                            IconLeft: ({ ...props }) => (
                                <ChevronLeft
                                    className={calendarSizes.iconSize}
                                />
                            ),
                            IconRight: ({ ...props }) => (
                                <ChevronRight
                                    className={calendarSizes.iconSize}
                                />
                            ),
                            Day: ({ date, displayMonth, ...props }) => {
                                // displayMonth 등 DOM에 불필요한 props 필터링
                                const {
                                    selected,
                                    today,
                                    disabled,
                                    range_start,
                                    range_end,
                                    range_middle,
                                    outside,
                                    ...domProps
                                } = props;

                                // 현재 날짜의 정보 가져오기
                                const dateInfo = getDateInfo(date);
                                const dateStyle = getDateDisplayStyle(date);
                                const isToday =
                                    date.toDateString() ===
                                    new Date().toDateString();

                                // 이전/이후 월 날짜 판단 (수동 계산)
                                const isOutsideMonth =
                                    date.getMonth() !==
                                        currentMonth.getMonth() ||
                                    date.getFullYear() !==
                                        currentMonth.getFullYear();

                                return (
                                    <div
                                        className={cn(
                                            getDateClassName(date),
                                            !isOutsideMonth
                                                ? dateStyle.className
                                                : "",
                                            "overflow-hidden" // 표식이 날짜 셀을 벗어나지 않도록
                                        )}
                                        style={{
                                            ...(!isOutsideMonth
                                                ? dateStyle.style
                                                : undefined),
                                            minHeight: (() => {
                                                const isMobile = useIsMobile();
                                                const displayRules =
                                                    getDisplayRules(
                                                        viewMode,
                                                        isMobile
                                                    );
                                                return displayRules.minCellHeight;
                                            })(),
                                        }}
                                        title={
                                            isOutsideMonth
                                                ? "이전/다음 월 날짜 (참고용)"
                                                : undefined
                                        }
                                        onClick={() =>
                                            !isOutsideMonth &&
                                            handleDateClick(date)
                                        }
                                        onMouseDown={() =>
                                            !isOutsideMonth && startDrag(date)
                                        }
                                        onMouseEnter={(e) => {
                                            if (!isOutsideMonth) {
                                                updateDrag(date);
                                                handleCellMouseEnter(date, e);
                                            }
                                        }}
                                        onMouseLeave={
                                            !isOutsideMonth
                                                ? handleCellMouseLeave
                                                : undefined
                                        }
                                        onTouchStart={() =>
                                            !isOutsideMonth && startDrag(date)
                                        }
                                        onTouchMove={
                                            !isOutsideMonth
                                                ? (e) => {
                                                      e.preventDefault();
                                                      const touch =
                                                          e.touches[0];
                                                      const element =
                                                          document.elementFromPoint(
                                                              touch.clientX,
                                                              touch.clientY
                                                          );
                                                      if (element) {
                                                          const dateStr =
                                                              element.getAttribute(
                                                                  "data-date"
                                                              );
                                                          if (dateStr) {
                                                              updateDrag(
                                                                  new Date(
                                                                      dateStr
                                                                  )
                                                              );
                                                          }
                                                      }
                                                  }
                                                : undefined
                                        }
                                        onTouchEnd={
                                            !isOutsideMonth
                                                ? endDrag
                                                : undefined
                                        }
                                        data-date={date.toISOString()}
                                        {...domProps}
                                    >
                                        {/* Layer 1: 배경 및 상태 표시 */}
                                        <div className="absolute inset-0 z-0 rounded">
                                            {renderDateBackground(date)}
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
                                                    {renderEventCount(date)}
                                                </div>
                                            </div>

                                            {/* 하단: 정보 영역 */}
                                            {!isOutsideMonth &&
                                                showEvents &&
                                                dateInfo.events.length > 0 && (
                                                    <div className="h-0 flex items-end justify-between px-1 gap-1 relative z-15">
                                                        {/* 캘린더 색상 스트라이프 */}
                                                        {renderCalendarStripe(
                                                            date
                                                        )}
                                                    </div>
                                                )}

                                            {/* 색상 점 (both 모드일 때만) */}
                                            {/* {(() => {
                        const isMobile = useIsMobile();
                        const displayRules = getDisplayRules(viewMode, isMobile);
                        return !isOutsideMonth && displayRules.showCalendarColors === 'both' && (
                          <div className="absolute bottom-0.5 left-0.5 z-20">
                            {renderEnhancedCalendarDots(date)}
                          </div>
                        );
                      })()} */}
                                        </div>

                                        {/* Layer 4: 상태 아이콘 (우상단) */}
                                        {(() => {
                                            const isMobile = useIsMobile();
                                            const displayRules =
                                                getDisplayRules(
                                                    viewMode,
                                                    isMobile
                                                );
                                            return (
                                                displayRules.showStatusIcon && (
                                                    <div className="absolute top-0.5 right-0.5 z-25">
                                                        {renderDateIcon(date)}
                                                    </div>
                                                )
                                            );
                                        })()}
                                    </div>
                                );
                            },
                        }}
                    />
                </div>

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
                                                      new Date(
                                                          calendar.lastSyncedAt
                                                      ),
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

                {/* 도움말 */}
                {allowBlocking && !isMobile && viewMode !== "compact" && (
                    <div
                        className={cn(
                            "text-muted-foreground space-y-1 pt-2 border-t",
                            calendarSizes.fontSize
                        )}
                    >
                        <p>
                            💡 <strong>사용법:</strong>
                        </p>
                        <p>• 단일 날짜: 클릭하여 비활성화/활성화 토글</p>
                        <p>
                            • 날짜 범위: 드래그하여 범위 선택 후 일괄 비활성화
                        </p>
                        <p>
                            • 과거 날짜와 기존 일정이 있는 날짜는 수정할 수
                            없습니다
                        </p>
                    </div>
                )}

                {/* 모바일 전용 간단 도움말 */}
                {allowBlocking && isMobile && (
                    <div
                        className={cn(
                            "text-muted-foreground pt-2 border-t text-center",
                            calendarSizes.fontSize
                        )}
                    >
                        <p>💡 탭하여 날짜 상태 변경, 드래그하여 범위 선택</p>
                    </div>
                )}

                {/* 컴팩트 모드 전용 간단 도움말 */}
                {allowBlocking && viewMode === "compact" && !isMobile && (
                    <div
                        className={cn(
                            "text-muted-foreground pt-2 border-t text-center",
                            calendarSizes.fontSize
                        )}
                    >
                        <p>💡 클릭/드래그로 날짜 관리</p>
                    </div>
                )}
            </CardContent>

            {/* PC용 iCS 호버 툴팁 */}
            {!isMobile && (
                <ICSTooltip
                    events={hoveredEvents}
                    date={hoveredDate}
                    mousePosition={mousePosition}
                    show={!!hoveredDate && hoveredEvents.length > 0}
                />
            )}

            {/* iCS 이벤트 하단 목록 (PC/모바일 공통) */}
            {showEvents && (
                <ICSMobileList
                    groupedEvents={groupedICSEvents}
                    currentMonth={currentMonth}
                    isLoading={isLoading}
                    error={error}
                    className="mt-0"
                />
            )}
        </Card>
    );
};

export default PersonalCalendar;
