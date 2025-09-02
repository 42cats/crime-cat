import React from 'react';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/hooks/useCalendarState';
import { getCalendarColor, findClosestColorIndex } from '@/utils/calendarColors';

interface EventCountIndicatorProps {
  events: CalendarEvent[];
  date: Date;
  className?: string;
  overlapInfo?: {
    hasOverlap: boolean;
    overlapType: 'none' | 'time-conflict' | 'all-day-conflict' | 'mixed-conflict';
    conflictingEvents: CalendarEvent[];
    calendarsInvolved: string[];
  };
}

/**
 * 이벤트 개수를 숫자 배지로 표시하는 컴포넌트
 * - 겹침 상태에 따른 경고 색상 표시
 * - 소스별 서브 인디케이터 표시
 */
const EventCountIndicator: React.FC<EventCountIndicatorProps> = ({
  events,
  date,
  className,
  overlapInfo
}) => {
  if (events.length === 0) return null;

  // 이벤트 소스별 개수 계산
  const icsEvents = events.filter(e => e.source === 'icalendar');
  const crimeCatEvents = events.filter(e => e.source === 'crime-cat');

  // 주 배경색 결정 (겹침 정보 우선, 그 다음 실제 캘린더 색상 사용)
  const getBadgeColor = () => {
    // 겹침이 있는 경우 경고 색상 우선
    if (overlapInfo?.hasOverlap) {
      switch (overlapInfo.overlapType) {
        case 'time-conflict':
          return 'bg-red-600 text-white ring-2 ring-red-300';
        case 'all-day-conflict':
          return 'bg-orange-500 text-white ring-2 ring-orange-300';
        case 'mixed-conflict':
          return 'bg-gradient-to-br from-red-600 to-orange-500 text-white ring-2 ring-red-200';
        default:
          break;
      }
    }
    
    // 실제 캘린더 색상 사용 (다중 캘린더인 경우 첫 번째 이벤트 기준)
    if (events.length > 0) {
      const firstEvent = events[0];
      const colorIndex = firstEvent.colorIndex ?? findClosestColorIndex(firstEvent.colorHex);
      const colorInfo = getCalendarColor(colorIndex);
      return `${colorInfo.tailwindBg} text-white`;
    }
    
    // 기본값 (이벤트가 없는 경우 - 실제로는 호출되지 않음)
    return 'bg-gray-500 text-white';
  };

  return (
    <div className={cn("relative", className)}>
        {/* 이벤트 개수 배지 */}
        <div className={cn(
          "absolute top-1 right-1 rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs font-bold px-1",
          "border border-white/20",
          getBadgeColor()
        )}>
          {events.length}
        </div>

        {/* 겹침 경고 인디케이터 */}
        {overlapInfo?.hasOverlap && (
          <div className="absolute top-0.5 left-0.5">
            <div className="w-3 h-3 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold border border-white/50">
              ⚠
            </div>
          </div>
        )}
        
        {/* 소스별 서브 인디케이터 (겹침이 없는 경우만) */}
        {!overlapInfo?.hasOverlap && icsEvents.length > 0 && crimeCatEvents.length > 0 && (
          <div className="absolute top-1 left-1 flex gap-0.5">
            <div className="w-2 h-2 rounded-full bg-yellow-400 border border-white/50" />
            <div className="w-2 h-2 rounded-full bg-blue-400 border border-white/50" />
          </div>
        )}
    </div>
  );
};

export default EventCountIndicator;