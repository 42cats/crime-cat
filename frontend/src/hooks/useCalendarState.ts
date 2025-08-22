import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleService } from '@/api/schedule';
import { useToast } from '@/hooks/useToast';
import { 
  filterICSEvents, 
  getICSEventsForDate, 
  groupICSEventsByDate, 
  hasICSEventsOnDate,
  type GroupedICSEvents
} from '@/utils/icsEventUtils';

// Debug logging utility
const debugLog = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `🔧 [${category}] ${timestamp}`;
  if (data !== undefined) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
};

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  category?: string;
  participantCount?: number;
  source?: 'icalendar' | 'crime-cat'; // 이벤트 소스 구분
}

export enum DateStatus {
  AVAILABLE = 'available',
  BLOCKED = 'blocked',
  BUSY = 'busy',
}

export interface DateInfo {
  date: Date;
  status: DateStatus;
  events: CalendarEvent[];
  blockedByUser: boolean;
}

interface UseCalendarStateOptions {
  enableBlocking?: boolean;
  enableEventFetching?: boolean;
  autoRefreshInterval?: number;
}

/**
 * 캘린더 상태 관리 훅
 * - 비활성화된 날짜 관리
 * - 사용자 이벤트 조회
 * - 날짜 상태 계산
 * - 캐시 관리 및 자동 새로고침
 */
export const useCalendarState = (options: UseCalendarStateOptions = {}) => {
  const {
    enableBlocking = true,
    enableEventFetching = true,
    autoRefreshInterval = 0, // 0 = 비활성화
  } = options;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 현재 선택된 월
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // 드래그 선택 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);

  // 캘린더 뷰의 확장된 날짜 범위 계산 (이전/다음 월 포함)
  const monthRange = useMemo(() => {
    // 현재 월의 1일
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    // 현재 월의 마지막 날
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // 캘린더 그리드의 시작일 (이전 월 포함)
    // 일요일(0)부터 시작하는 주 단위로 확장
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
    
    // 캘린더 그리드의 종료일 (다음 월 포함)
    // 토요일(6)까지 포함하는 주 단위로 확장
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    debugLog('MONTH_RANGE', `Extended calendar range from ${startDateStr} to ${endDateStr}`, {
      currentMonth: currentMonth.toISOString().split('T')[0],
      firstDayOfMonth: firstDayOfMonth.toISOString().split('T')[0],
      lastDayOfMonth: lastDayOfMonth.toISOString().split('T')[0],
      startDate: startDateStr,
      endDate: endDateStr
    });
    
    return {
      startDate: startDateStr,
      endDate: endDateStr,
    };
  }, [currentMonth]);

  // 비활성화된 날짜 목록 조회
  const {
    data: blockedDates = [],
    isLoading: isLoadingBlocked,
    error: blockedDatesError,
  } = useQuery({
    queryKey: ['schedule', 'blocked-dates', monthRange.startDate, monthRange.endDate],
    queryFn: async () => {
      debugLog('QUERY_BLOCKED', `Fetching blocked dates for range ${monthRange.startDate} to ${monthRange.endDate}`);
      try {
        const result = await scheduleService.getBlockedDates(monthRange.startDate, monthRange.endDate);
        debugLog('QUERY_BLOCKED', `Successfully fetched ${result.length} blocked dates`, result);
        return result;
      } catch (error) {
        debugLog('QUERY_BLOCKED', 'Failed to fetch blocked dates', error);
        throw error;
      }
    },
    enabled: enableBlocking,
    refetchInterval: autoRefreshInterval || false,
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 사용자 이벤트 데이터 조회
  const {
    data: userEvents = [],
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useQuery({
    queryKey: ['schedule', 'user-events', monthRange.startDate, monthRange.endDate],
    queryFn: async () => {
      debugLog('QUERY_EVENTS', `Fetching user events for range ${monthRange.startDate} to ${monthRange.endDate}`);
      try {
        const result = await scheduleService.getUserEventsInRange(monthRange.startDate, monthRange.endDate);
        debugLog('QUERY_EVENTS', `Successfully fetched ${result.length} user events`, result);
        return result;
      } catch (error) {
        debugLog('QUERY_EVENTS', 'Failed to fetch user events', error);
        throw error;
      }
    },
    enabled: enableEventFetching,
    refetchInterval: autoRefreshInterval || false,
    staleTime: 10 * 60 * 1000, // 10분
  });

  // 날짜 비활성화 Mutation
  const blockDateMutation = useMutation({
    mutationFn: async (date: string) => {
      debugLog('MUTATION_BLOCK', `Starting block date mutation for ${date}`);
      try {
        const result = await scheduleService.blockDate(date);
        debugLog('MUTATION_BLOCK', `Successfully blocked date ${date}`, result);
        return result;
      } catch (error) {
        debugLog('MUTATION_BLOCK', `Failed to block date ${date}`, error);
        throw error;
      }
    },
    onSuccess: (_, date) => {
      debugLog('MUTATION_BLOCK', `Block mutation success for ${date}, invalidating queries`);
      queryClient.invalidateQueries({ queryKey: ['schedule', 'blocked-dates'] });
      toast({
        title: '날짜 비활성화 완료',
        description: `${date} 날짜가 추천에서 제외됩니다.`,
      });
    },
    onError: (error: any, date) => {
      debugLog('MUTATION_BLOCK', `Block mutation error for ${date}`, error);
      toast({
        title: '비활성화 실패',
        description: error?.response?.data?.message || '날짜 비활성화 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 날짜 활성화 Mutation
  const unblockDateMutation = useMutation({
    mutationFn: async (date: string) => {
      debugLog('MUTATION_UNBLOCK', `Starting unblock date mutation for ${date}`);
      try {
        const result = await scheduleService.unblockDate(date);
        debugLog('MUTATION_UNBLOCK', `Successfully unblocked date ${date}`, result);
        return result;
      } catch (error) {
        debugLog('MUTATION_UNBLOCK', `Failed to unblock date ${date}`, error);
        throw error;
      }
    },
    onSuccess: (_, date) => {
      debugLog('MUTATION_UNBLOCK', `Unblock mutation success for ${date}, invalidating queries`);
      queryClient.invalidateQueries({ queryKey: ['schedule', 'blocked-dates'] });
      toast({
        title: '날짜 활성화 완료',
        description: `${date} 날짜가 추천에 포함됩니다.`,
      });
    },
    onError: (error: any, date) => {
      debugLog('MUTATION_UNBLOCK', `Unblock mutation error for ${date}`, error);
      toast({
        title: '활성화 실패',
        description: error?.response?.data?.message || '날짜 활성화 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 날짜 범위 비활성화 Mutation
  const blockDateRangeMutation = useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
      debugLog('MUTATION_BLOCK_RANGE', `Starting block range mutation from ${startDate} to ${endDate}`);
      try {
        const result = await scheduleService.blockDateRange(startDate, endDate);
        debugLog('MUTATION_BLOCK_RANGE', `Successfully blocked range ${startDate} to ${endDate}`, result);
        return result;
      } catch (error) {
        debugLog('MUTATION_BLOCK_RANGE', `Failed to block range ${startDate} to ${endDate}`, error);
        throw error;
      }
    },
    onSuccess: (_, { startDate, endDate }) => {
      debugLog('MUTATION_BLOCK_RANGE', `Block range mutation success from ${startDate} to ${endDate}, invalidating queries`);
      queryClient.invalidateQueries({ queryKey: ['schedule', 'blocked-dates'] });
      toast({
        title: '날짜 범위 비활성화 완료',
        description: `${startDate} ~ ${endDate} 범위가 추천에서 제외됩니다.`,
      });
    },
    onError: (error: any, { startDate, endDate }) => {
      debugLog('MUTATION_BLOCK_RANGE', `Block range mutation error from ${startDate} to ${endDate}`, error);
      toast({
        title: '범위 비활성화 실패',
        description: error?.response?.data?.message || '날짜 범위 비활성화 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 날짜 범위 활성화 Mutation
  const unblockDateRangeMutation = useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
      debugLog('MUTATION_UNBLOCK_RANGE', `Starting unblock range mutation from ${startDate} to ${endDate}`);
      try {
        const result = await scheduleService.unblockDateRange(startDate, endDate);
        debugLog('MUTATION_UNBLOCK_RANGE', `Successfully unblocked range ${startDate} to ${endDate}`, result);
        return result;
      } catch (error) {
        debugLog('MUTATION_UNBLOCK_RANGE', `Failed to unblock range ${startDate} to ${endDate}`, error);
        throw error;
      }
    },
    onSuccess: (_, { startDate, endDate }) => {
      debugLog('MUTATION_UNBLOCK_RANGE', `Unblock range mutation success from ${startDate} to ${endDate}, invalidating queries`);
      queryClient.invalidateQueries({ queryKey: ['schedule', 'blocked-dates'] });
      toast({
        title: '날짜 범위 활성화 완료',
        description: `${startDate} ~ ${endDate} 범위가 추천에 포함됩니다.`,
      });
    },
    onError: (error: any, { startDate, endDate }) => {
      debugLog('MUTATION_UNBLOCK_RANGE', `Unblock range mutation error from ${startDate} to ${endDate}`, error);
      toast({
        title: '범위 활성화 실패',
        description: error?.response?.data?.message || '날짜 범위 활성화 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  /**
   * 날짜 정보 계산
   */
  const getDateInfo = useCallback((date: Date): DateInfo => {
    const dateStr = date.toISOString().split('T')[0];
    
    // 해당 날짜의 모든 이벤트 조회
    const dayEvents: CalendarEvent[] = userEvents
      .filter(event => {
        const eventDate = new Date(event.startTime).toDateString();
        return eventDate === date.toDateString();
      })
      .map(event => ({
        ...event,
        // API에서 받은 이벤트는 iCalendar 개인일정이므로 icalendar로 설정
        source: event.source || 'icalendar' as const
      }));
    
    // 비활성화된 날짜인지 확인
    const blockedByUser = blockedDates.includes(dateStr);
    
    // 상태 결정
    let status: DateStatus;
    if (blockedByUser) {
      status = DateStatus.BLOCKED;
    } else if (dayEvents.length > 0) {
      status = DateStatus.BUSY;
    } else {
      status = DateStatus.AVAILABLE;
    }
    
    return {
      date,
      status,
      events: dayEvents,
      blockedByUser,
    };
  }, [blockedDates, userEvents]);

  /**
   * 날짜 클릭 핸들러
   */
  const handleDateClick = useCallback((date: Date) => {
    if (!enableBlocking) return;

    const dateInfo = getDateInfo(date);
    const dateStr = date.toISOString().split('T')[0];
    
    debugLog('CLICK_HANDLER', `Date click for ${dateStr}`, { 
      dateInfo, 
      currentBlockedByUser: dateInfo.blockedByUser,
      status: dateInfo.status 
    });
    
    // 과거 날짜는 비활성화 불가
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      debugLog('CLICK_HANDLER', `Rejected past date click for ${dateStr}`);
      toast({
        title: '과거 날짜는 수정할 수 없습니다',
        description: '오늘 이후의 날짜만 비활성화할 수 있습니다.',
        variant: 'destructive',
      });
      return;
    }
    
    // 기존 일정이 있는 날짜는 비활성화 불가 (선택적)
    if (dateInfo.status === DateStatus.BUSY && !dateInfo.blockedByUser) {
      debugLog('CLICK_HANDLER', `Warning for busy date ${dateStr}, but allowing block`);
      toast({
        title: '기존 일정이 있는 날짜입니다',
        description: '기존 일정이 있는 날짜도 비활성화할 수 있지만, 추천 계산에서는 제외됩니다.',
        variant: 'default',
      });
      // 여전히 비활성화 허용
    }
    
    // 비활성화/활성화 토글
    if (dateInfo.blockedByUser) {
      debugLog('CLICK_HANDLER', `Triggering unblock for ${dateStr}`);
      unblockDateMutation.mutate(dateStr);
    } else {
      debugLog('CLICK_HANDLER', `Triggering block for ${dateStr}`);
      blockDateMutation.mutate(dateStr);
    }
  }, [enableBlocking, getDateInfo, toast, blockDateMutation, unblockDateMutation]);

  /**
   * 드래그 시작
   */
  const startDrag = useCallback((date: Date) => {
    if (!enableBlocking) return;
    setIsDragging(true);
    setDragStart(date);
    setDragEnd(date);
  }, [enableBlocking]);

  /**
   * 드래그 진행
   */
  const updateDrag = useCallback((date: Date) => {
    if (isDragging && dragStart) {
      setDragEnd(date);
    }
  }, [isDragging, dragStart]);

  /**
   * 드래그 종료
   */
  const endDrag = useCallback(() => {
    if (!isDragging || !dragStart || !dragEnd) return;
    
    const startDate = dragStart < dragEnd ? dragStart : dragEnd;
    const endDate = dragStart < dragEnd ? dragEnd : dragStart;
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    debugLog('DRAG_HANDLER', `Drag ended from ${startDateStr} to ${endDateStr}`, {
      isDragging,
      dragStart: startDate,
      dragEnd: endDate,
      isSingleDate: startDate.getTime() === endDate.getTime()
    });
    
    // 단일 날짜 선택인 경우 클릭 핸들러 사용
    if (startDate.getTime() === endDate.getTime()) {
      debugLog('DRAG_HANDLER', `Single date drag, using click handler for ${startDateStr}`);
      handleDateClick(startDate);
    } else {
      // 범위 선택인 경우 - 범위 내 날짜들의 상태를 확인하고 토글
      const rangeDates: Date[] = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        rangeDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // 범위 내 비활성화된 날짜와 활성화된 날짜 분석
      const blockedDatesInRange = rangeDates.filter(date => {
        const dateInfo = getDateInfo(date);
        return dateInfo.blockedByUser;
      });
      
      const activeDatesInRange = rangeDates.filter(date => {
        const dateInfo = getDateInfo(date);
        return !dateInfo.blockedByUser && date >= new Date(new Date().setHours(0, 0, 0, 0)); // 과거 날짜 제외
      });
      
      debugLog('DRAG_HANDLER', `Range analysis - Blocked: ${blockedDatesInRange.length}, Active: ${activeDatesInRange.length}`);
      
      // 간단한 토글 로직: 범위 내에 비활성화된 날짜가 하나라도 있으면 전체 활성화, 모두 활성화되어 있으면 전체 비활성화
      if (blockedDatesInRange.length > 0) {
        // 비활성화된 날짜가 있음 -> 전체 활성화 (반대로 바꾸기)
        debugLog('DRAG_HANDLER', `Found ${blockedDatesInRange.length} blocked dates, activating entire range from ${startDateStr} to ${endDateStr}`);
        unblockDateRangeMutation.mutate({
          startDate: startDateStr,
          endDate: endDateStr,
        });
      } else {
        // 모든 날짜가 활성화되어 있음 -> 전체 비활성화 (반대로 바꾸기)
        debugLog('DRAG_HANDLER', `All dates active, blocking entire range from ${startDateStr} to ${endDateStr}`);
        blockDateRangeMutation.mutate({
          startDate: startDateStr,
          endDate: endDateStr,
        });
      }
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, handleDateClick, blockDateRangeMutation]);

  /**
   * 드래그 취소
   */
  const cancelDrag = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, []);

  /**
   * 월 통계 계산 (현재 날짜부터 월말까지만 유효한 날짜로 처리)
   */
  const monthStats = useMemo(() => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let availableDays = 0;
    let blockedDays = 0;
    let busyDays = 0;
    let validDays = 0; // 유효한 날짜 수 (과거 날짜 제외)
    
    // 현재 월의 날짜만 통계에 포함, 과거 날짜는 제외
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];
      
      // 과거 날짜는 통계에서 제외
      if (date < today) {
        continue;
      }
      
      validDays++; // 유효한 날짜 카운트
      
      // 직접 상태 계산 (getDateInfo 함수 의존성 제거)
      const isBlocked = blockedDates.includes(dateStr);
      const hasEvents = userEvents.some(event => {
        const eventDate = new Date(event.startTime).toDateString();
        return eventDate === date.toDateString();
      });
      
      if (isBlocked) {
        blockedDays++;
      } else if (hasEvents) {
        busyDays++;
      } else {
        availableDays++;
      }
    }
    
    // 유효한 날짜 수로 가용성 비율 계산
    const availabilityRate = validDays > 0 ? Math.round((availableDays / validDays) * 100) : 0;
    
    debugLog('MONTH_STATS', `Statistics for ${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')} (excluding past dates)`, {
      totalDays: daysInMonth,
      validDays,
      availableDays,
      blockedDays,
      busyDays,
      availabilityRate,
      todayDate: today.toISOString().split('T')[0]
    });
    
    return {
      totalDays: validDays, // 유효한 날짜 수를 totalDays로 반환
      availableDays,
      blockedDays,
      busyDays,
      availabilityRate,
    };
  }, [currentMonth, blockedDates, userEvents]);

  /**
   * iCS 이벤트 전용 필터링
   */
  const icsEvents = useMemo(() => {
    if (!enableEventFetching || !userEvents.length) return [];
    // userEvents가 이미 iCalendar 이벤트들이므로 source만 설정하여 직접 사용
    return userEvents.map(event => ({
      ...event,
      source: event.source || 'icalendar' as const
    }));
  }, [userEvents, enableEventFetching]);

  /**
   * 월별 iCS 이벤트 그룹화
   */
  const groupedICSEvents = useMemo(() => {
    if (!enableEventFetching || !icsEvents.length) return {};
    return groupICSEventsByDate(icsEvents, currentMonth);
  }, [icsEvents, currentMonth, enableEventFetching]);

  /**
   * 특정 날짜의 iCS 이벤트 조회 함수
   */
  const getICSEventsForDateCallback = useCallback((date: Date) => {
    return getICSEventsForDate(userEvents, date);
  }, [userEvents]);

  /**
   * 특정 날짜에 iCS 이벤트 존재 여부 확인 함수
   */
  const hasICSEventsOnDateCallback = useCallback((date: Date) => {
    return hasICSEventsOnDate(userEvents, date);
  }, [userEvents]);

  /**
   * 수동 새로고침
   */
  const refreshData = useCallback(() => {
    debugLog('REFRESH', 'Manual data refresh triggered', { enableBlocking, enableEventFetching });
    if (enableBlocking) {
      debugLog('REFRESH', 'Invalidating blocked-dates queries');
      queryClient.invalidateQueries({ queryKey: ['schedule', 'blocked-dates'] });
    }
    if (enableEventFetching) {
      debugLog('REFRESH', 'Invalidating user-events queries');
      queryClient.invalidateQueries({ queryKey: ['schedule', 'user-events'] });
    }
  }, [queryClient, enableBlocking, enableEventFetching]);

  return {
    // 상태
    currentMonth,
    setCurrentMonth,
    monthStats,
    
    // 데이터
    blockedDates,
    userEvents,
    isLoading: isLoadingBlocked || isLoadingEvents,
    error: blockedDatesError || eventsError,
    
    // 드래그 상태
    isDragging,
    dragStart,
    dragEnd,
    
    // 함수
    getDateInfo,
    handleDateClick,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    refreshData,
    
    // Mutation 상태
    isBlockingDate: blockDateMutation.isPending,
    isUnblockingDate: unblockDateMutation.isPending,
    isBlockingRange: blockDateRangeMutation.isPending,
    isUnblockingRange: unblockDateRangeMutation.isPending,
    
    // iCS 이벤트 관련
    icsEvents,
    groupedICSEvents,
    getICSEventsForDate: getICSEventsForDateCallback,
    hasICSEventsOnDate: hasICSEventsOnDateCallback,
  };
};