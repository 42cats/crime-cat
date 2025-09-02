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


export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  category?: string;
  participantCount?: number;
  source?: 'icalendar' | 'crime-cat'; // 이벤트 소스 구분
  calendarId?: string; // 다중 캘린더 지원
  colorHex?: string; // 캘린더 색상
  colorIndex?: number; // 캘린더 색상 인덱스 (0-7)
  calendarName?: string; // 캘린더 이름
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
      return await scheduleService.getBlockedDates(monthRange.startDate, monthRange.endDate);
    },
    enabled: enableBlocking,
    refetchInterval: autoRefreshInterval || false,
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 다중 캘린더 이벤트 데이터 조회 (색상 정보 포함)
  const {
    data: groupedCalendarData = {},
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useQuery({
    queryKey: ['schedule', 'grouped-calendar-events', monthRange.startDate, monthRange.endDate],
    queryFn: async () => {
      return await scheduleService.getGroupedCalendarEvents(monthRange.startDate, monthRange.endDate);
    },
    enabled: enableEventFetching,
    refetchInterval: autoRefreshInterval || false,
    staleTime: 10 * 60 * 1000, // 10분
  });

  // 그룹화된 데이터에서 플랫 이벤트 목록 생성
  const userEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    Object.values(groupedCalendarData).forEach(group => {
      group.events.forEach(event => {
        events.push({
          ...event,
          source: 'icalendar' as const
        });
      });
    });
    return events;
  }, [groupedCalendarData]);

  // 날짜 비활성화 Mutation
  const blockDateMutation = useMutation({
    mutationFn: async (date: string) => {
      return await scheduleService.blockDate(date);
    },
    onSuccess: (_, date) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'blocked-dates'] });
      toast({
        title: '날짜 비활성화 완료',
        description: `${date} 날짜가 추천에서 제외됩니다.`,
      });
    },
    onError: (error: any, date) => {
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
      return await scheduleService.unblockDate(date);
    },
    onSuccess: (_, date) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'blocked-dates'] });
      toast({
        title: '날짜 활성화 완료',
        description: `${date} 날짜가 추천에 포함됩니다.`,
      });
    },
    onError: (error: any, date) => {
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
      return await scheduleService.blockDateRange(startDate, endDate);
    },
    onSuccess: (_, { startDate, endDate }) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'blocked-dates'] });
      toast({
        title: '날짜 범위 비활성화 완료',
        description: `${startDate} ~ ${endDate} 범위가 추천에서 제외됩니다.`,
      });
    },
    onError: (error: any, { startDate, endDate }) => {
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
      return await scheduleService.unblockDateRange(startDate, endDate);
    },
    onSuccess: (_, { startDate, endDate }) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'blocked-dates'] });
      toast({
        title: '날짜 범위 활성화 완료',
        description: `${startDate} ~ ${endDate} 범위가 추천에 포함됩니다.`,
      });
    },
    onError: (error: any, { startDate, endDate }) => {
      toast({
        title: '범위 활성화 실패',
        description: error?.response?.data?.message || '날짜 범위 활성화 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 캘린더 이벤트 강제 새로고침 Mutation
  const forceRefreshMutation = useMutation({
    mutationFn: async () => {
      return await scheduleService.forceRefreshGroupedCalendarEvents(monthRange.startDate, monthRange.endDate);
    },
    onSuccess: () => {
      // React Query 캐시 무효화 (백엔드 캐시는 API에서 이미 무효화됨)
      queryClient.invalidateQueries({ queryKey: ['schedule', 'grouped-calendar-events'] });
      toast({
        title: '캘린더 새로고침 완료',
        description: '최신 캘린더 데이터를 불러왔습니다.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '새로고침 실패',
        description: error?.response?.data?.message || '캘린더 새로고침 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  /**
   * 날짜 정보 계산
   */
  const getDateInfo = useCallback((date: Date): DateInfo => {
    const dateStr = date.toISOString().split('T')[0];
    
    // 해당 날짜의 모든 이벤트 조회 (백엔드 방식과 동일한 날짜 비교)
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const dayEvents: CalendarEvent[] = userEvents
      .filter(event => {
        const eventDate = new Date(event.startTime);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === targetDate.getTime();
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
    
    
    // 과거 날짜는 비활성화 불가
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      toast({
        title: '과거 날짜는 수정할 수 없습니다',
        description: '오늘 이후의 날짜만 비활성화할 수 있습니다.',
        variant: 'destructive',
      });
      return;
    }
    
    // 기존 일정이 있는 날짜는 비활성화 불가 (선택적)
    if (dateInfo.status === DateStatus.BUSY && !dateInfo.blockedByUser) {
      toast({
        title: '기존 일정이 있는 날짜입니다',
        description: '기존 일정이 있는 날짜도 비활성화할 수 있지만, 추천 계산에서는 제외됩니다.',
        variant: 'default',
      });
      // 여전히 비활성화 허용
    }
    
    // 비활성화/활성화 토글
    if (dateInfo.blockedByUser) {
      unblockDateMutation.mutate(dateStr);
    } else {
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
    
    
    // 단일 날짜 선택인 경우 클릭 핸들러 사용
    if (startDate.getTime() === endDate.getTime()) {
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
      
      
      // 간단한 토글 로직: 범위 내에 비활성화된 날짜가 하나라도 있으면 전체 활성화, 모두 활성화되어 있으면 전체 비활성화
      if (blockedDatesInRange.length > 0) {
        // 비활성화된 날짜가 있음 -> 전체 활성화 (반대로 바꾸기)
        unblockDateRangeMutation.mutate({
          startDate: startDateStr,
          endDate: endDateStr,
        });
      } else {
        // 모든 날짜가 활성화되어 있음 -> 전체 비활성화 (반대로 바꾸기)
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
    
    
    return {
      totalDays: validDays, // 유효한 날짜 수를 totalDays로 반환
      availableDays,
      blockedDays,
      busyDays,
      availabilityRate,
    };
  }, [currentMonth, blockedDates, userEvents]);

  /**
   * iCS 이벤트 전용 필터링 (다중 캘린더 지원)
   */
  const icsEvents = useMemo(() => {
    if (!enableEventFetching || !userEvents.length) return [];
    // userEvents는 이미 캘린더 정보가 포함된 이벤트들
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
   * 수동 새로고침 (백엔드 캐시 무효화)
   */
  const refreshData = useCallback(() => {
    if (enableEventFetching) {
      // 강제 새로고침으로 백엔드 캐시 무효화
      forceRefreshMutation.mutate();
    }
    if (enableBlocking) {
      // 차단 날짜는 기존 방식 유지
      queryClient.invalidateQueries({ queryKey: ['schedule', 'blocked-dates'] });
    }
    
    // copyAvailableDates에서 사용하는 추가 캐시들 무효화
    // 3달치 날짜 범위 캐시 무효화 (개인일정 복사 기능용)
    queryClient.invalidateQueries({ queryKey: ['schedule'] });
    queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
    queryClient.invalidateQueries({ queryKey: ['user-events'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
  }, [forceRefreshMutation, queryClient, enableBlocking, enableEventFetching]);

  return {
    // 상태
    currentMonth,
    setCurrentMonth,
    monthStats,
    
    // 데이터
    blockedDates,
    userEvents,
    isLoading: isLoadingBlocked || isLoadingEvents || forceRefreshMutation.isPending,
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
    isRefreshing: forceRefreshMutation.isPending,
    
    // iCS 이벤트 관련
    icsEvents,
    groupedICSEvents,
    getICSEventsForDate: getICSEventsForDateCallback,
    hasICSEventsOnDate: hasICSEventsOnDateCallback,
  };
};