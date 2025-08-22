import React from 'react';
import { createPortal } from 'react-dom';
import { Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/hooks/useCalendarState';

interface EventHoverTooltipProps {
  events: CalendarEvent[];
  position: { x: number; y: number };
  visible: boolean;
}

/**
 * 이벤트 목록을 호버 툴팁으로 표시하는 컴포넌트
 * - createPortal을 사용하여 body에 렌더링
 * - 마우스 위치 기준으로 동적 위치 조정
 * - 이벤트 소스별 색상 구분 표시
 */
const EventHoverTooltip: React.FC<EventHoverTooltipProps> = ({
  events,
  position,
  visible
}) => {
  if (!visible || events.length === 0) return null;

  /**
   * 시간 포맷팅
   */
  const formatTime = (timeString: string): string => {
    const time = new Date(timeString);
    return time.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  /**
   * 날짜 포맷팅
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  /**
   * 이벤트 소스별 배지 색상
   */
  const getSourceBadgeColor = (source?: string) => {
    switch (source) {
      case 'icalendar':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'crime-cat':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  /**
   * 툴팁 위치 계산 (화면 경계 고려)
   */
  const getTooltipStyle = () => {
    const tooltipWidth = 320; // 추정 너비
    const tooltipHeight = Math.min(events.length * 80 + 60, 300); // 추정 높이
    const margin = 10;

    let left = position.x + margin;
    let top = position.y - tooltipHeight - margin;

    // 오른쪽 경계 체크
    if (left + tooltipWidth > window.innerWidth) {
      left = position.x - tooltipWidth - margin;
    }

    // 상단 경계 체크
    if (top < margin) {
      top = position.y + margin;
    }

    return {
      left: Math.max(margin, left),
      top: Math.max(margin, top),
    };
  };

  const tooltipStyle = getTooltipStyle();

  return createPortal(
    <div 
      className="fixed z-50 bg-white shadow-2xl border rounded-xl p-4 max-w-sm animate-in fade-in-0 zoom-in-95 duration-200"
      style={tooltipStyle}
    >
      {/* 툴팁 헤더 */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <Calendar className="w-4 h-4 text-gray-600" />
        <span className="font-semibold text-gray-800">
          {formatDate(new Date(events[0].startTime))}
        </span>
        <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {events.length}개 일정
        </span>
      </div>

      {/* 이벤트 목록 */}
      <div className="max-h-48 overflow-y-auto space-y-3">
        {events.map((event, index) => (
          <div 
            key={event.id} 
            className={cn(
              "pb-3 last:pb-0",
              index < events.length - 1 && "border-b border-gray-100"
            )}
          >
            {/* 이벤트 제목 */}
            <div className="font-semibold text-sm text-gray-900 mb-1 leading-tight">
              {event.title}
            </div>

            {/* 시간 정보 */}
            {!event.allDay && (
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                <Clock className="w-3 h-3" />
                <span>
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </span>
              </div>
            )}

            {event.allDay && (
              <div className="text-xs text-gray-600 mb-2">
                하루 종일
              </div>
            )}

            {/* 이벤트 소스 배지 */}
            {event.source && (
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-block px-2 py-1 rounded-md text-xs font-medium border",
                  getSourceBadgeColor(event.source)
                )}>
                  {event.source === 'icalendar' ? '개인일정' : '크라임캣'}
                </span>

                {/* 카테고리 (있는 경우) */}
                {event.category && (
                  <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    {event.category}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 툴팁 화살표 (CSS로 구현) */}
      <div 
        className="absolute w-3 h-3 bg-white border transform rotate-45"
        style={{
          bottom: '-6px',
          left: '20px',
          borderTop: 'none',
          borderLeft: 'none',
        }}
      />
    </div>,
    document.body
  );
};

export default EventHoverTooltip;