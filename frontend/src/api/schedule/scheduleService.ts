import { apiClient } from '@/lib/api';
import {
  EventResponse,
  EventCreateRequest,
  UserCalendarRequest,
  AvailabilityTimeSlot,
  EventStatus,
  EventFilters,
  EventParticipant
} from './types';


/**
 * 인증된 사용자를 위한 일정 관리 API 서비스
 */
export class ScheduleService {
  private readonly baseURL = '/schedule';

  /**
   * 일정 생성
   */
  async createEvent(request: EventCreateRequest): Promise<EventResponse> {
    return await apiClient.post<EventResponse>(`${this.baseURL}/events`, request);
  }

  /**
   * 일정 참여
   */
  async joinEvent(eventId: string): Promise<void> {
    await apiClient.post<void>(`${this.baseURL}/events/${eventId}/join`);
  }

  /**
   * 일정 목록 조회 (필터링 가능)
   */
  async getEvents(filters?: EventFilters): Promise<EventResponse[]> {
    const params = new URLSearchParams();
    
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.size) params.append('size', filters.size.toString());

    return await apiClient.get<EventResponse[]>(`${this.baseURL}/events?${params.toString()}`);
  }

  /**
   * 특정 일정 상세 조회
   */
  async getEvent(eventId: string): Promise<EventResponse> {
    return await apiClient.get<EventResponse>(`${this.baseURL}/events/${eventId}`);
  }

  /**
   * 일정 가용시간 조회
   */
  async getAvailability(eventId: string): Promise<AvailabilityTimeSlot[]> {
    return await apiClient.get<AvailabilityTimeSlot[]>(`${this.baseURL}/events/${eventId}/availability`);
  }

  /**
   * 일정 참여자 목록 조회
   */
  async getEventParticipants(eventId: string): Promise<EventParticipant[]> {
    return await apiClient.get<EventParticipant[]>(`${this.baseURL}/events/${eventId}/participants`);
  }

  /**
   * 일정 참여자 수 조회
   */
  async getParticipantCount(eventId: string): Promise<number> {
    return await apiClient.get<number>(`${this.baseURL}/events/${eventId}/participant-count`);
  }

  /**
   * 사용자 iCalendar URL 저장/업데이트
   * @deprecated 새로운 PersonalCalendarController의 addCalendar API 사용 권장
   */
  async saveUserCalendar(request: UserCalendarRequest): Promise<void> {
    // 새로운 API 경로로 리디렉션
    await apiClient.post<void>('/my-calendar/calendars', request);
  }

  /**
   * 카테고리별 일정 조회 (편의 메서드)
   */
  async getEventsByCategory(category: string): Promise<EventResponse[]> {
    return this.getEvents({ category });
  }

  /**
   * 상태별 일정 조회 (편의 메서드)
   */
  async getEventsByStatus(status: EventStatus): Promise<EventResponse[]> {
    return this.getEvents({ status });
  }

  /**
   * 모집 중인 일정만 조회 (편의 메서드)
   */
  async getRecruitingEvents(): Promise<EventResponse[]> {
    return this.getEvents({ status: EventStatus.RECRUITING });
  }

  /**
   * 내가 참여한 일정 조회 (향후 구현 예정)
   */
  async getMyEvents(): Promise<EventResponse[]> {
    return await apiClient.get<EventResponse[]>(`${this.baseURL}/my-events`);
  }

  /**
   * 내가 생성한 일정 조회 (향후 구현 예정)
   */
  async getCreatedEvents(): Promise<EventResponse[]> {
    return await apiClient.get<EventResponse[]>(`${this.baseURL}/created-events`);
  }

  // =================================================================================
  // 개인 달력 비활성화 관리 메서드들
  // =================================================================================

  /**
   * 특정 날짜 비활성화 (추천에서 제외)
   */
  async blockDate(date: string): Promise<{ message: string; date: string }> {
    const params = new URLSearchParams({ date });
    const url = `/my-calendar/block-date?${params.toString()}`;
    
    return await apiClient.post<{ message: string; date: string }>(url);
  }

  /**
   * 특정 날짜 활성화 (추천에 포함)
   */
  async unblockDate(date: string): Promise<{ message: string; date: string }> {
    const params = new URLSearchParams({ date });
    const url = `/my-calendar/block-date?${params.toString()}`;
    
    return await apiClient.delete<{ message: string; date: string }>(url);
  }

  /**
   * 날짜 범위 일괄 비활성화 (드래그 선택)
   */
  async blockDateRange(
    startDate: string,
    endDate: string
  ): Promise<{ message: string; startDate: string; endDate: string }> {
    const params = new URLSearchParams({ startDate, endDate });
    const url = `/my-calendar/block-range?${params.toString()}`;
    
    return await apiClient.post<{ message: string; startDate: string; endDate: string }>(url);
  }

  /**
   * 날짜 범위 일괄 활성화 (드래그 선택)
   */
  async unblockDateRange(
    startDate: string,
    endDate: string
  ): Promise<{ message: string; startDate: string; endDate: string }> {
    const params = new URLSearchParams({ startDate, endDate });
    const url = `/my-calendar/unblock-range?${params.toString()}`;
    
    return await apiClient.post<{ message: string; startDate: string; endDate: string }>(url);
  }

  /**
   * 비활성화된 날짜 목록 조회
   */
  async getBlockedDates(startDate: string, endDate: string): Promise<string[]> {
    const params = new URLSearchParams({ startDate, endDate });
    const url = `/my-calendar/blocked-dates?${params.toString()}`;
    
    return await apiClient.get<string[]>(url);
  }

  /**
   * 사용자 iCalendar 이벤트 조회 (특정 기간) - 레거시
   */
  async getUserEventsInRange(
    startDate: string,
    endDate: string
  ): Promise<Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    allDay: boolean;
  }>> {
    const params = new URLSearchParams({ startDate, endDate });
    const url = `/my-calendar/events-in-range?${params.toString()}`;
    
    return await apiClient.get<Array<{
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      allDay: boolean;
    }>>(url);
  }

  /**
   * 다중 캘린더 이벤트 조회 (캘린더별 그룹화, 색상 정보 포함)
   */
  async getGroupedCalendarEvents(
    startDate: string,
    endDate: string
  ): Promise<Record<string, {
    calendarId: string;
    displayName: string;
    colorHex: string;
    colorIndex: number;
    events: Array<{
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      allDay: boolean;
      calendarId: string;
      colorHex: string;
      calendarName: string;
    }>;
    lastSynced?: string;
    syncStatus: string;
  }>> {
    const params = new URLSearchParams({ startDate, endDate });
    const url = `/my-calendar/events-in-range?${params.toString()}`;
    
    return await apiClient.get<Record<string, any>>(url);
  }
}

// 싱글톤 인스턴스 생성
export const scheduleService = new ScheduleService();