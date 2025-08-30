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
      console.log('🔄 [SYNC_START] Starting individual calendar sync for:', id);
      
      // Race Condition 방지: 진행 중인 모든 관련 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['calendars'] });
      await queryClient.cancelQueries({ queryKey: ['calendar-events'] });
      await queryClient.cancelQueries({ queryKey: ['user-events'] });
      console.log('🚫 [CANCEL_QUERIES] All related queries cancelled');
      
      setIsSyncing(true); // 쿼리 비활성화
      
      const result = await calendarApi.syncCalendar(id);
      console.log('✅ [SYNC_SUCCESS] Calendar sync completed:', result);
      return result;
    },
    onSuccess: (data, variables) => {
      console.log('🔄 [CACHE_INVALIDATE] Invalidating queries after sync success');
      // 캐시 무효화 (자동으로 refetch 실행됨)
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      
      setIsSyncing(false); // 쿼리 재활성화
      console.log('✅ [QUERY_REACTIVATED] Queries reactivated after sync complete');
    },
    onError: (error, variables) => {
      console.error('❌ [SYNC_ERROR] Calendar sync failed for:', variables, error);
      setIsSyncing(false); // 에러 시에도 쿼리 재활성화
    }
  });

  // 전체 동기화 (동기화만 수행, 목록은 자동 새로고침)
  const syncAllCalendarsMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 [SYNC_ALL_START] Starting all calendars sync (sync only)');
      
      // Race Condition 방지: 진행 중인 모든 관련 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['calendars'] });
      await queryClient.cancelQueries({ queryKey: ['calendar-events'] });
      await queryClient.cancelQueries({ queryKey: ['user-events'] });
      await queryClient.cancelQueries({ queryKey: ['schedule'] });
      console.log('🚫 [CANCEL_ALL_QUERIES] All related queries cancelled');
      
      setIsSyncing(true); // 쿼리 비활성화
      
      const result = await calendarApi.syncAllCalendars();
      console.log('✅ [SYNC_ALL_SUCCESS] All calendars sync completed:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('🔄 [CACHE_INVALIDATE_ALL] Invalidating all queries after sync success');
      console.log('💬 [SYNC_MESSAGE]', data.message);
      
      // 모든 캘린더 관련 캐시 무효화 및 재조회
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      
      setIsSyncing(false); // 쿼리 재활성화
      console.log('✅ [ALL_SYNC_COMPLETE] Cache invalidated and queries reactivated');
    },
    onError: (error) => {
      console.error('❌ [SYNC_ALL_ERROR] All calendars sync failed:', error);
      setIsSyncing(false); // 에러 시에도 쿼리 재활성화
    }
  });

  // 그룹화된 이벤트 조회 (PersonalCalendar에서 사용)
  const getGroupedEvents = useCallback(
    async (startDate: Date, endDate: Date) => {
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
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