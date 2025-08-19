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
  private readonly baseURL = '/api/v1/schedule';

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
   */
  async saveUserCalendar(request: UserCalendarRequest): Promise<void> {
    await apiClient.post<void>(`${this.baseURL}/my-calendar`, request);
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
}

// 싱글톤 인스턴스 생성
export const scheduleService = new ScheduleService();