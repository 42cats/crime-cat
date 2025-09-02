import { useMemo, useRef, useCallback } from 'react';
import { CalendarEvent } from './useCalendarState';

/**
 * 캘린더 상태 최적화 훅
 * - 메모리 사용량 최적화
 * - 불필요한 재계산 방지
 * - 성능 최적화된 날짜 정보 캐싱
 */
export const useOptimizedCalendarState = () => {
  // 날짜 정보 캐시
  const dateInfoCache = useRef(new Map<string, any>());
  const cacheTimestamp = useRef(Date.now());

  // 캐시 무효화 (5분마다)
  const isCacheValid = useCallback(() => {
    return Date.now() - cacheTimestamp.current < 5 * 60 * 1000; // 5분
  }, []);

  /**
   * 타임존 문제 없이 Date 객체를 YYYY-MM-DD 문자열로 변환
   * toISOString()은 UTC 변환으로 인해 타임존 오프셋 문제가 발생하므로 로컬 날짜 기반으로 변환
   */
  const formatDateToString = (date: Date): string => {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' +
           String(date.getDate()).padStart(2, '0');
  };

  // 최적화된 날짜 정보 계산
  const getOptimizedDateInfo = useCallback((date: Date, events: CalendarEvent[]) => {
    const key = formatDateToString(date);
    
    if (!isCacheValid()) {
      dateInfoCache.current.clear();
      cacheTimestamp.current = Date.now();
    }

    if (!dateInfoCache.current.has(key)) {
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime).toDateString();
        return eventDate === date.toDateString();
      });

      const info = {
        hasEvents: dayEvents.length > 0,
        eventCount: dayEvents.length,
        hasTimeConflict: checkTimeConflict(dayEvents),
        calendarIds: [...new Set(dayEvents.map(e => e.calendarId).filter(Boolean))],
        eventTypes: [...new Set(dayEvents.map(e => e.source))]
      };

      dateInfoCache.current.set(key, info);
    }

    return dateInfoCache.current.get(key);
  }, [isCacheValid]);

  // 시간 충돌 체크 (최적화됨)
  const checkTimeConflict = useMemo(() => {
    return (events: CalendarEvent[]): boolean => {
      if (events.length <= 1) return false;
      
      const timedEvents = events.filter(e => !e.allDay);
      if (timedEvents.length <= 1) return false;

      // 정렬된 이벤트로 O(n) 충돌 검사
      timedEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      for (let i = 0; i < timedEvents.length - 1; i++) {
        const current = timedEvents[i];
        const next = timedEvents[i + 1];
        
        if (new Date(current.endTime) > new Date(next.startTime)) {
          return true; // 충돌 발견
        }
      }
      
      return false;
    };
  }, []);

  // 캐시 클리어 함수
  const clearCache = useCallback(() => {
    dateInfoCache.current.clear();
    cacheTimestamp.current = Date.now();
  }, []);

  return {
    getOptimizedDateInfo,
    clearCache,
    cacheSize: dateInfoCache.current.size
  };
};

export default useOptimizedCalendarState;