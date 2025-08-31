import { CalendarEvent } from '@/hooks/useCalendarState';

/**
 * iCS 이벤트 관련 유틸리티 함수들
 */

/**
 * 전체 이벤트에서 iCS 이벤트만 필터링
 */
export const filterICSEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  return events.filter(event => event.source === 'icalendar');
};

/**
 * 전체 이벤트에서 Crime-Cat 이벤트만 필터링
 */
export const filterCrimeCatEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  return events.filter(event => event.source === 'crime-cat');
};

/**
 * 특정 날짜의 iCS 이벤트 조회 (백엔드 방식과 동일한 날짜 비교)
 */
export const getICSEventsForDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  // 백엔드 방식과 동일: 시간 정보 제거하고 날짜만 비교
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  return filterICSEvents(events).filter(event => {
    const eventDate = new Date(event.startTime);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === targetDate.getTime();
  });
};

/**
 * 날짜별로 iCS 이벤트 그룹화
 */
export interface GroupedICSEvents {
  [dateString: string]: CalendarEvent[]; // 'YYYY-MM-DD' format
}

export const groupICSEventsByDate = (events: CalendarEvent[], month: Date): GroupedICSEvents => {
  const icsEvents = filterICSEvents(events);
  const grouped: GroupedICSEvents = {};
  
  // 해당 월의 시작과 끝 날짜 (백엔드 방식과 동일하게 처리)
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  // 시간 정보 제거하여 날짜만 비교 (백엔드 toLocalDate() 방식과 동일)
  monthStart.setHours(0, 0, 0, 0);
  monthEnd.setHours(23, 59, 59, 999); // 월말 마지막 순간까지 포함
  
  icsEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    // 시간 정보 제거하여 날짜만 추출 (백엔드 toLocalDate() 방식과 동일)
    eventDate.setHours(0, 0, 0, 0);
    
    // 백엔드 방식과 동일한 날짜 범위 비교: !eventDate.isBefore(monthStart) && !eventDate.isAfter(monthEnd)
    // JavaScript에서는 >= monthStart && <= monthEnd로 표현
    if (eventDate >= monthStart && eventDate <= monthEnd) {
      const dateKey = new Date(event.startTime).toISOString().split('T')[0]; // YYYY-MM-DD (원본 시간 사용)
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(event);
    }
  });
  
  // 각 날짜별로 시간순 정렬
  Object.keys(grouped).forEach(dateKey => {
    grouped[dateKey].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  });
  
  return grouped;
};

/**
 * 특정 날짜에 iCS 이벤트가 있는지 확인
 */
export const hasICSEventsOnDate = (events: CalendarEvent[], date: Date): boolean => {
  return getICSEventsForDate(events, date).length > 0;
};

/**
 * 이벤트 시간 포맷팅
 */
export const formatEventTime = (startTime: string, endTime: string, allDay: boolean): string => {
  if (allDay) {
    return '종일';
  }
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };
  
  return `${formatTime(start)} - ${formatTime(end)}`;
};

/**
 * 날짜 포맷팅 (한국어)
 */
export const formatDateKorean = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  
  return `${month}월 ${day}일 (${weekday})`;
};

/**
 * 정렬된 날짜 키 목록 반환 (오늘부터)
 */
export const getSortedDateKeys = (groupedEvents: GroupedICSEvents): string[] => {
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  
  return Object.keys(groupedEvents)
    .sort()
    .sort((a, b) => {
      // 오늘 이후 날짜를 먼저 표시
      if (a >= todayKey && b < todayKey) return -1;
      if (a < todayKey && b >= todayKey) return 1;
      return a.localeCompare(b);
    });
};