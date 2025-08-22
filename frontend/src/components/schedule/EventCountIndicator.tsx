import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/hooks/useCalendarState';
import EventHoverTooltip from './EventHoverTooltip';

interface EventCountIndicatorProps {
  events: CalendarEvent[];
  date: Date;
  className?: string;
}

/**
 * 이벤트 개수를 숫자 배지로 표시하고, 
 * 마우스 호버 시 상세 내용을 툴팁으로 보여주는 컴포넌트
 */
const EventCountIndicator: React.FC<EventCountIndicatorProps> = ({
  events,
  date,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  if (events.length === 0) return null;

  // 이벤트 소스별 개수 계산
  const icsEvents = events.filter(e => e.source === 'icalendar');
  const crimeCatEvents = events.filter(e => e.source === 'crime-cat');

  // 주 배경색 결정 (더 많은 이벤트 타입 기준)
  const getBadgeColor = () => {
    if (icsEvents.length > crimeCatEvents.length) {
      return 'bg-emerald-500 text-white';
    } else if (crimeCatEvents.length > icsEvents.length) {
      return 'bg-blue-500 text-white';
    } else {
      // 같거나 혼합된 경우
      return 'bg-purple-500 text-white';
    }
  };

  return (
    <>
      <div 
        className={cn("relative cursor-pointer", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 이벤트 개수 배지 */}
        <div className={cn(
          "absolute top-1 right-1 rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs font-bold px-1",
          "transition-all duration-200 hover:scale-110 hover:shadow-lg",
          "border border-white/20",
          getBadgeColor()
        )}>
          {events.length}
        </div>

        {/* 소스별 서브 인디케이터 (옵션) */}
        {icsEvents.length > 0 && crimeCatEvents.length > 0 && (
          <div className="absolute top-1 left-1 flex gap-0.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 border border-white/50" />
            <div className="w-2 h-2 rounded-full bg-blue-400 border border-white/50" />
          </div>
        )}
      </div>

      {/* 호버 툴팁 */}
      {isHovered && (
        <EventHoverTooltip
          events={events}
          position={mousePosition}
          visible={isHovered}
        />
      )}
    </>
  );
};

export default EventCountIndicator;