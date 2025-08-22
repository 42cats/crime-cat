import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  category?: string;
  participantCount?: number;
  source?: 'icalendar' | 'crime-cat';
}

interface CalendarEventOverlayProps {
  events: CalendarEvent[];
  date: Date;
  className?: string;
  maxVisible?: number;
  onEventClick?: (event: CalendarEvent) => void;
}

/**
 * 캘린더 날짜에 표시되는 이벤트 오버레이 컴포넌트
 * - 해당 날짜의 이벤트 목록을 시각적으로 표시
 * - 최대 표시 개수 제한 및 "더보기" 표시
 * - 이벤트 클릭 핸들링
 */
const CalendarEventOverlay: React.FC<CalendarEventOverlayProps> = ({
  events,
  date,
  className,
  maxVisible = 3,
  onEventClick,
}) => {
  const isMobile = useIsMobile();
  
  // 모바일에서는 표시할 이벤트 수를 줄임
  const responsiveMaxVisible = isMobile ? Math.min(maxVisible, 2) : maxVisible;
  // 해당 날짜의 이벤트만 필터링
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === date.toDateString();
  });

  // 시간순으로 정렬
  const sortedEvents = dayEvents.sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // 표시할 이벤트와 숨겨진 이벤트 분리
  const visibleEvents = sortedEvents.slice(0, responsiveMaxVisible);
  const hiddenEventsCount = sortedEvents.length - responsiveMaxVisible;

  if (sortedEvents.length === 0) {
    return null;
  }

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
   * 스마트 텍스트 축약 - 중요 단어 보존하며 축약
   */
  const smartTruncate = (text: string, maxLength: number = 15): string => {
    if (text.length <= maxLength) return text;
    
    // 중요 키워드들을 우선 보존
    const importantWords = ['회의', '미팅', '면접', '발표', '세미나', '교육', '점심', '저녁'];
    const hasImportantWord = importantWords.some(word => text.includes(word));
    
    if (hasImportantWord) {
      // 중요 단어가 있으면 더 길게 표시
      if (text.length <= maxLength + 5) return text;
      return text.substring(0, maxLength + 2) + '…';
    }
    
    // 일반적인 축약
    return text.substring(0, maxLength) + '…';
  };

  /**
   * 이벤트 소스 및 카테고리별 색상
   */
  const getEventColor = (event: CalendarEvent): string => {
    // iCalendar 이벤트는 별도 스타일링
    if (event.source === 'icalendar') {
      return 'bg-yellow-50 text-yellow-800 border-yellow-200 ring-1 ring-yellow-200';
    }

    // Crime-Cat 이벤트는 카테고리별 색상
    switch (event.category?.toLowerCase()) {
      case 'meeting':
      case '회의':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'personal':
      case '개인':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'work':
      case '업무':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'event':
      case '이벤트':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  /**
   * 이벤트 아이템 렌더링
   */
  const renderEventItem = (event: CalendarEvent, index: number) => (
    <div
      key={event.id}
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:shadow-sm hover:scale-[1.02]',
        isMobile 
          ? 'text-xs p-1 rounded border' 
          : 'text-sm p-2 rounded-md border',
        getEventColor(event)
      )}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick?.(event);
      }}
      title={`${event.title} - ${formatTime(event.startTime)} ~ ${formatTime(event.endTime)}`}
    >
      <div className={cn(
        "flex items-center gap-1",
        isMobile ? "justify-start" : "justify-between"
      )}>
        <span className={cn(
          "font-medium leading-tight",
          isMobile ? "text-xs" : "text-sm"
        )} title={event.title}>
          {smartTruncate(event.title, isMobile ? 12 : 18)}
        </span>
        {event.participantCount && event.participantCount > 1 && !isMobile && (
          <div className="flex items-center gap-0.5 text-xs opacity-70">
            <Users className="w-3 h-3" />
            <span>{event.participantCount}</span>
          </div>
        )}
      </div>
      
      {!event.allDay && !isMobile && (
        <div className="flex items-center gap-1 mt-1 opacity-75">
          <Clock className="w-3 h-3" />
          <span className="text-xs font-medium">
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('absolute inset-0 z-10 pointer-events-none', className)}>
      <div className="relative w-full h-full">
        {/* 이벤트 목록 */}
        <div className={cn(
          "pointer-events-auto",
          isMobile 
            ? "space-y-0.5 p-0.5" 
            : "space-y-0.5 p-1"
        )}>
          {visibleEvents.map((event, index) => renderEventItem(event, index))}
          
          {/* 더보기 표시 */}
          {hiddenEventsCount > 0 && (
            <div
              className={cn(
                'bg-gradient-to-r from-blue-50 to-purple-50',
                'text-blue-700 border-blue-200/50',
                'cursor-pointer hover:from-blue-100 hover:to-purple-100',
                'transition-all duration-200 hover:shadow-sm',
                'text-center font-semibold',
                isMobile 
                  ? 'text-xs p-1 rounded border'
                  : 'text-sm p-1.5 rounded-md border'
              )}
              onClick={(e) => {
                e.stopPropagation();
                // 더보기 클릭 이벤트 (향후 모달 구현)
                console.log('Show more events for', date, sortedEvents);
              }}
            >
              +{hiddenEventsCount}개 더 보기
            </div>
          )}
        </div>

        {/* 이벤트 개수 인디케이터 */}
        {sortedEvents.length > 0 && !isMobile && (
          <div className="absolute top-0.5 right-0.5">
            <Badge 
              variant="secondary" 
              className="text-xs px-1.5 py-0.5 h-auto min-w-0"
            >
              {sortedEvents.length}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarEventOverlay;