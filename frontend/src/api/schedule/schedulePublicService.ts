import { apiClient } from '@/lib/api';
import {
  PublicEventResponse,
  EventStatus,
  EventFilters,
  AvailabilityTimeSlot
} from './types';

/**
 * 비로그인 사용자를 위한 퍼블릭 일정 관리 API 서비스
 */
export class SchedulePublicService {
  private readonly baseURL = '/api/v1/public/schedule';

  /**
   * 전체 일정 목록 조회 (퍼블릭)
   */
  async getPublicEvents(filters?: EventFilters): Promise<PublicEventResponse[]> {
    const params = new URLSearchParams();
    
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.size) params.append('size', filters.size.toString());

    return await apiClient.get<PublicEventResponse[]>(`${this.baseURL}/events?${params.toString()}`);
  }

  /**
   * 특정 일정 상세 조회 (퍼블릭)
   */
  async getPublicEvent(eventId: string): Promise<PublicEventResponse> {
    return await apiClient.get<PublicEventResponse>(`${this.baseURL}/events/${eventId}`);
  }

  /**
   * 일정 가용시간 조회 (퍼블릭)
   */
  async getPublicAvailability(eventId: string): Promise<AvailabilityTimeSlot[]> {
    return await apiClient.get<AvailabilityTimeSlot[]>(`${this.baseURL}/events/${eventId}/availability`);
  }

  /**
   * 일정 참여자 수 조회 (퍼블릭)
   */
  async getPublicParticipantCount(eventId: string): Promise<number> {
    return await apiClient.get<number>(`${this.baseURL}/events/${eventId}/participant-count`);
  }

  /**
   * 카테고리별 일정 조회 (퍼블릭)
   */
  async getPublicEventsByCategory(category: string): Promise<PublicEventResponse[]> {
    return await apiClient.get<PublicEventResponse[]>(`${this.baseURL}/events/category/${category}`);
  }

  /**
   * 모집 중인 일정 조회 (퍼블릭)
   */
  async getPublicRecruitingEvents(): Promise<PublicEventResponse[]> {
    return await apiClient.get<PublicEventResponse[]>(`${this.baseURL}/events/recruiting`);
  }

  /**
   * 카테고리별 일정 조회 (편의 메서드)
   */
  async getEventsByCategory(category: string): Promise<PublicEventResponse[]> {
    return this.getPublicEvents({ category });
  }

  /**
   * 상태별 일정 조회 (편의 메서드)
   */
  async getEventsByStatus(status: EventStatus): Promise<PublicEventResponse[]> {
    return this.getPublicEvents({ status });
  }

  /**
   * 모집 중인 일정만 조회 (편의 메서드)
   */
  async getRecruitingEvents(): Promise<PublicEventResponse[]> {
    return this.getPublicEvents({ status: EventStatus.RECRUITING });
  }

  /**
   * 검색어로 일정 조회 (편의 메서드)
   */
  async searchEvents(query: string): Promise<PublicEventResponse[]> {
    return this.getPublicEvents({ search: query });
  }
}

// 싱글톤 인스턴스 생성
export const schedulePublicService = new SchedulePublicService();