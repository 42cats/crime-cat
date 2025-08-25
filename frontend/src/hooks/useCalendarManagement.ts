import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CalendarResponse, CalendarCreateRequest, CalendarUpdateRequest, CalendarGroup } from '@/types/calendar';

const API_BASE = '/api/v1/my-calendar';

interface CalendarAPI {
  getUserCalendars: (activeOnly?: boolean) => Promise<CalendarResponse[]>;
  addCalendar: (request: CalendarCreateRequest) => Promise<CalendarResponse>;
  updateCalendar: (id: string, request: CalendarUpdateRequest) => Promise<CalendarResponse>;
  deleteCalendar: (id: string) => Promise<void>;
  syncCalendar: (id: string) => Promise<CalendarResponse>;
  syncAllCalendars: () => Promise<CalendarResponse[]>;
  getColorPalette: () => Promise<{ index: number; hex: string; name: string }[]>;
  getGroupedEvents: (startDate: string, endDate: string) => Promise<Record<string, CalendarGroup>>;
}

const calendarAPI: CalendarAPI = {
  getUserCalendars: async (activeOnly = true) => {
    const response = await fetch(`${API_BASE}/calendars?activeOnly=${activeOnly}`);
    if (!response.ok) throw new Error('Failed to fetch calendars');
    return response.json();
  },

  addCalendar: async (request) => {
    const response = await fetch(`${API_BASE}/calendars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error('Failed to add calendar');
    return response.json();
  },

  updateCalendar: async (id, request) => {
    const response = await fetch(`${API_BASE}/calendars/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error('Failed to update calendar');
    return response.json();
  },

  deleteCalendar: async (id) => {
    const response = await fetch(`${API_BASE}/calendars/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete calendar');
  },

  syncCalendar: async (id) => {
    const response = await fetch(`${API_BASE}/calendars/${id}/sync`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to sync calendar');
    return response.json();
  },

  syncAllCalendars: async () => {
    const response = await fetch(`${API_BASE}/calendars/sync-all`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to sync all calendars');
    return response.json();
  },

  getColorPalette: async () => {
    const response = await fetch(`${API_BASE}/color-palette`);
    if (!response.ok) throw new Error('Failed to fetch color palette');
    return response.json();
  },

  getGroupedEvents: async (startDate, endDate) => {
    const response = await fetch(`${API_BASE}/events-in-range?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) throw new Error('Failed to fetch grouped events');
    return response.json();
  }
};

/**
 * 캘린더 관리를 위한 커스텀 훅
 */
export const useCalendarManagement = () => {
  const queryClient = useQueryClient();
  
  // 캘린더 목록 조회
  const {
    data: calendars = [],
    isLoading: isLoadingCalendars,
    error: calendarsError,
    refetch: refetchCalendars
  } = useQuery({
    queryKey: ['calendars'],
    queryFn: () => calendarAPI.getUserCalendars(true),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
  });

  // 색상 팔레트 조회
  const { data: colorPalette = [] } = useQuery({
    queryKey: ['color-palette'],
    queryFn: calendarAPI.getColorPalette,
    staleTime: Infinity, // 색상 정보는 거의 변하지 않음
  });

  // 캘린더 추가
  const addCalendarMutation = useMutation({
    mutationFn: calendarAPI.addCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    }
  });

  // 캘린더 수정
  const updateCalendarMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: CalendarUpdateRequest }) =>
      calendarAPI.updateCalendar(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    }
  });

  // 캘린더 삭제
  const deleteCalendarMutation = useMutation({
    mutationFn: calendarAPI.deleteCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    }
  });

  // 개별 동기화
  const syncCalendarMutation = useMutation({
    mutationFn: calendarAPI.syncCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    }
  });

  // 전체 동기화
  const syncAllCalendarsMutation = useMutation({
    mutationFn: calendarAPI.syncAllCalendars,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    }
  });

  // 그룹화된 이벤트 조회 (PersonalCalendar에서 사용)
  const getGroupedEvents = useCallback(
    async (startDate: Date, endDate: Date) => {
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      return calendarAPI.getGroupedEvents(start, end);
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