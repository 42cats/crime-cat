import { apiClient } from '@/lib/api';
import type { CalendarResponse, CalendarCreateRequest, CalendarUpdateRequest, CalendarGroup } from '@/types/calendar';

/**
 * 캘린더 관련 API 함수들
 */
export const calendarApi = {
  // 사용자 캘린더 목록 조회
  getUserCalendars: (activeOnly: boolean = true): Promise<CalendarResponse[]> => {
    return apiClient.get<CalendarResponse[]>(`/my-calendar/calendars?activeOnly=${activeOnly}`);
  },

  // 캘린더 추가
  addCalendar: (request: CalendarCreateRequest): Promise<CalendarResponse> => {
    return apiClient.post<CalendarResponse>('/my-calendar/calendars', request);
  },

  // 캘린더 수정
  updateCalendar: (id: string, request: CalendarUpdateRequest): Promise<CalendarResponse> => {
    return apiClient.put<CalendarResponse>(`/my-calendar/calendars/${id}`, request);
  },

  // 캘린더 삭제
  deleteCalendar: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/my-calendar/calendars/${id}`);
  },

  // 개별 캘린더 동기화
  syncCalendar: (id: string): Promise<CalendarResponse> => {
    return apiClient.post<CalendarResponse>(`/my-calendar/calendars/${id}/sync`);
  },

  // 전체 캘린더 동기화 (동기화만 수행, 목록 조회는 별도)
  syncAllCalendars: (): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>('/my-calendar/calendars/sync-all');
  },

  // 색상 팔레트 조회
  getColorPalette: (): Promise<{ index: number; hex: string; name: string }[]> => {
    return apiClient.get<{ index: number; hex: string; name: string }[]>('/my-calendar/color-palette');
  },

  // 그룹화된 이벤트 조회 (날짜 범위별)
  getGroupedEvents: (startDate: string, endDate: string): Promise<Record<string, CalendarGroup>> => {
    return apiClient.get<Record<string, CalendarGroup>>(`/my-calendar/events-in-range?startDate=${startDate}&endDate=${endDate}`);
  },

  // 개별 캘린더 상태 변경 (활성화/비활성화)
  toggleCalendarStatus: (id: string, isActive: boolean): Promise<CalendarResponse> => {
    return apiClient.patch<CalendarResponse>(`/my-calendar/calendars/${id}/status`, { isActive });
  },

  // 캘린더 순서 변경
  updateCalendarOrder: (calendars: { id: string; sortOrder: number }[]): Promise<CalendarResponse[]> => {
    return apiClient.put<CalendarResponse[]>('/my-calendar/calendars/reorder', { calendars });
  },
};

export default calendarApi;