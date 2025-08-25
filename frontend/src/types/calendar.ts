/**
 * 캘린더 관련 타입 정의
 */

export interface CalendarResponse {
  id: string;
  icalUrl: string;
  calendarName?: string;
  displayName?: string;
  colorIndex: number;
  colorHex: string;
  colorName: string;
  syncStatus: 'PENDING' | 'SUCCESS' | 'ERROR';
  syncErrorMessage?: string;
  isActive: boolean;
  sortOrder: number;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarCreateRequest {
  icalUrl: string;
  displayName?: string;
}

export interface CalendarUpdateRequest {
  displayName?: string;
  colorIndex?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CalendarGroup {
  calendarId: string;
  displayName: string;
  colorHex: string;
  colorIndex: number;
  events: CalendarEvent[];
  lastSynced?: Date;
  syncStatus: 'PENDING' | 'SUCCESS' | 'ERROR';
  syncError?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  allDay?: boolean;
  source: string;
  calendarId?: string;
  calendarName?: string;
  colorHex?: string;
}

export interface ColorPalette {
  index: number;
  hex: string;
  name: string;
}

export type CalendarDisplayMode = 'unified' | 'separated';
export type CalendarSyncStatus = 'PENDING' | 'SUCCESS' | 'ERROR';