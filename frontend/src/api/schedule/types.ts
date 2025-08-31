// 일정 관리 시스템 타입 정의
export interface EventResponse {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: EventStatus;
  maxParticipants?: number;
  scheduledAt?: string; // ISO 8601 format
  createdAt: string;
  creatorName: string;
}

export interface PublicEventResponse {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: EventStatus;
  maxParticipants?: number;
  scheduledAt?: string;
  createdAt: string;
  creatorNickname: string; // 개인정보 제외, 닉네임만
}

export interface EventCreateRequest {
  title: string;
  description?: string;
  category: string;
  maxParticipants?: number;
}

export interface UserCalendarRequest {
  icalUrl: string;
}

export interface EventParticipant {
  id: string;
  userId: string;
  userNickname: string;
  status: string;
  joinedAt: string;
}

// 가용시간 타입 (백엔드에서 LocalDateTime[] 배열로 전송)
export type AvailabilityTimeSlot = [string, string]; // [startTime, endTime]

export enum EventStatus {
  RECRUITING = 'RECRUITING',
  RECRUITMENT_COMPLETE = 'RECRUITMENT_COMPLETE', 
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum EventCategory {
  MEETING = 'MEETING',
  WORKSHOP = 'WORKSHOP',
  GAMING = 'GAMING',
  SOCIAL = 'SOCIAL',
  STUDY = 'STUDY',
  OTHER = 'OTHER'
}

// API 응답 공통 타입
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// 페이지네이션 타입
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 필터 타입
export interface EventFilters {
  category?: string;
  status?: EventStatus;
  search?: string;
  page?: number;
  size?: number;
}

// 에러 타입
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

// 사용자 정보 (간소화된 버전)
export interface EventUser {
  id: string;
  nickname: string;
  profileImage?: string;
}