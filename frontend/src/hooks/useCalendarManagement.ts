import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '@/api/calendar';
import type { CalendarResponse, CalendarCreateRequest, CalendarUpdateRequest, CalendarGroup } from '@/types/calendar';

/**
 * 캘린더 관리를 위한 커스텀 훅
 */
export const useCalendarManagement = () => {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 캘린더 목록 조회
  const {
    data: calendars = [],
    isLoading: isLoadingCalendars,
    error: calendarsError,
    refetch: refetchCalendars
  } = useQuery({
    queryKey: ['calendars'],
    queryFn: () => calendarApi.getUserCalendars(true),
    enabled: !isSyncing, // 동기화 중일 때 쿼리 비활성화
    staleTime: 1000 * 60 * 30, // 30분 (Race Condition 방지)
    gcTime: 1000 * 60 * 60, // 1시간
    refetchOnWindowFocus: false, // 포커스 시 자동 refetch 비활성화
    refetchOnReconnect: false,   // 재연결 시 자동 refetch 비활성화
  });

  // 색상 팔레트 조회
  const { data: colorPalette = [] } = useQuery({
    queryKey: ['color-palette'],
    queryFn: calendarApi.getColorPalette,
    staleTime: Infinity, // 색상 정보는 거의 변하지 않음
  });

  // 캘린더 추가
  const addCalendarMutation = useMutation({
    mutationFn: calendarApi.addCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    }
  });

  // 캘린더 수정
  const updateCalendarMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: CalendarUpdateRequest }) =>
      calendarApi.updateCalendar(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    }
  });

  // 캘린더 삭제
  const deleteCalendarMutation = useMutation({
    mutationFn: calendarApi.deleteCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    }
  });

  // 개별 동기화
  const syncCalendarMutation = useMutation({
    mutationFn: async (id: string) => {
      // Race Condition 방지: 진행 중인 모든 관련 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['calendars'] });
      await queryClient.cancelQueries({ queryKey: ['calendar-events'] });
      await queryClient.cancelQueries({ queryKey: ['user-events'] });
      
      setIsSyncing(true); // 쿼리 비활성화
      
      return await calendarApi.syncCalendar(id);
    },
    onSuccess: (data, variables) => {
      // 캐시 무효화 (자동으로 refetch 실행됨)
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      
      setIsSyncing(false); // 쿼리 재활성화
    },
    onError: (error, variables) => {
      setIsSyncing(false); // 에러 시에도 쿼리 재활성화
    }
  });

  // 전체 동기화 (동기화만 수행, 목록은 자동 새로고침)
  const syncAllCalendarsMutation = useMutation({
    mutationFn: async () => {
      // Race Condition 방지: 진행 중인 모든 관련 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['calendars'] });
      await queryClient.cancelQueries({ queryKey: ['calendar-events'] });
      await queryClient.cancelQueries({ queryKey: ['user-events'] });
      await queryClient.cancelQueries({ queryKey: ['schedule'] });
      
      setIsSyncing(true); // 쿼리 비활성화
      
      return await calendarApi.syncAllCalendars();
    },
    onSuccess: (data) => {
      // 모든 캘린더 관련 캐시 무효화 및 재조회
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      
      setIsSyncing(false); // 쿼리 재활성화
    },
    onError: (error) => {
      setIsSyncing(false); // 에러 시에도 쿼리 재활성화
    }
  });

  /**
   * 타임존 문제 없이 Date 객체를 YYYY-MM-DD 문자열로 변환
   * toISOString()은 UTC 변환으로 인해 타임존 오프셋 문제가 발생하므로 로컬 날짜 기반으로 변환
   */
  const formatDateToString = (date: Date): string => {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' +
           String(date.getDate()).padStart(2, '0');
  };

  // 그룹화된 이벤트 조회 (PersonalCalendar에서 사용)
  const getGroupedEvents = useCallback(
    async (startDate: Date, endDate: Date) => {
      const start = formatDateToString(startDate);
      const end = formatDateToString(endDate);
      return calendarApi.getGroupedEvents(start, end);
    },
    []
  );

  return {
    // 데이터
    calendars,
    colorPalette,
    
    // 상태
    isLoading: isLoadingCalendars || 
               addCalendarMutation.isPending || 
               updateCalendarMutation.isPending || 
               deleteCalendarMutation.isPending ||
               syncCalendarMutation.isPending ||
               syncAllCalendarsMutation.isPending,
    
    error: calendarsError || 
           addCalendarMutation.error || 
           updateCalendarMutation.error || 
           deleteCalendarMutation.error ||
           syncCalendarMutation.error ||
           syncAllCalendarsMutation.error,

    // 액션
    addCalendar: addCalendarMutation.mutateAsync,
    updateCalendar: (id: string, request: CalendarUpdateRequest) =>
      updateCalendarMutation.mutateAsync({ id, request }),
    deleteCalendar: deleteCalendarMutation.mutateAsync,
    syncCalendar: syncCalendarMutation.mutateAsync,
    syncAllCalendars: syncAllCalendarsMutation.mutateAsync,
    
    // 유틸리티
    refetchCalendars,
    getGroupedEvents,
    
    // 개별 뮤테이션 상태 (세밀한 제어가 필요한 경우)
    mutations: {
      add: addCalendarMutation,
      update: updateCalendarMutation,
      delete: deleteCalendarMutation,
      sync: syncCalendarMutation,
      syncAll: syncAllCalendarsMutation
    }
  };
};

export default useCalendarManagement;