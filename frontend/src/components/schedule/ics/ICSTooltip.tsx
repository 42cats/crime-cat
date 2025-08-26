import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CalendarIcon, Clock } from 'lucide-react';
import { CalendarEvent } from '@/hooks/useCalendarState';
import { formatEventTime, formatDateKorean } from '@/utils/icsEventUtils';
import { cn } from '@/lib/utils';

interface ICSTooltipProps {
  events: CalendarEvent[];
  date: Date | null;
  mousePosition: { x: number; y: number } | null;
  show: boolean;
  className?: string;
}

/**
 * PC용 iCS 이벤트 호버 툴팁 컴포넌트
 * - 마우스 위치에 따른 동적 포지셔닝
 * - 화면 경계 고려한 위치 조정
 * - 부드러운 애니메이션 효과
 */
const ICSTooltip: React.FC<ICSTooltipProps> = ({
  events,
  date,
  mousePosition,
  show,
  className,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number; placement: 'top' | 'bottom' | 'left' | 'right' }>({
    x: 0,
    y: 0,
    placement: 'top'
  });
  const [isVisible, setIsVisible] = useState(false);

  // 툴팁 위치 계산
  const calculatePosition = useMemo(() => {
    if (!mousePosition || !show || !date || !events.length) {
      return { x: 0, y: 0, placement: 'top' as const };
    }

    const tooltipWidth = 280;
    const tooltipMaxHeight = 200;
    const offset = 12;
    const { x: mouseX, y: mouseY } = mousePosition;

    // 화면 크기
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = mouseX;
    let y = mouseY;
    let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';

    // 수평 위치 조정
    if (mouseX + tooltipWidth + offset > viewportWidth) {
      if (mouseX - tooltipWidth - offset >= 0) {
        // 왼쪽으로 이동
        x = mouseX - tooltipWidth - offset;
        placement = 'left';
      } else {
        // 화면 내 최대한 오른쪽
        x = viewportWidth - tooltipWidth - 20;
      }
    } else {
      // 기본: 마우스 오른쪽
      x = mouseX + offset;
      placement = 'right';
    }

    // 수직 위치 조정  
    if (mouseY - tooltipMaxHeight - offset >= 0 && placement !== 'left') {
      // 위쪽에 표시
      y = mouseY - offset;
      placement = placement === 'right' ? 'top' : placement;
    } else if (mouseY + tooltipMaxHeight + offset <= viewportHeight) {
      // 아래쪽에 표시
      y = mouseY + offset;
      placement = placement === 'right' ? 'bottom' : placement;
    } else {
      // 중앙 정렬
      y = Math.max(20, Math.min(mouseY - tooltipMaxHeight / 2, viewportHeight - tooltipMaxHeight - 20));
    }

    return { x, y, placement };
  }, [mousePosition, show, date, events.length]);

  // 위치 업데이트
  useEffect(() => {
    setPosition(calculatePosition);
  }, [calculatePosition]);

  // 표시/숨김 애니메이션 - 지연 제거하여 즉시 표시
  useEffect(() => {
    if (show && events.length > 0 && date) {
      // 즉시 표시
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [show, events.length, date]);

  // 렌더링 조건 확인
  if (!show || !date || !events.length || !mousePosition) {
    return null;
  }

  const tooltipContent = (
    <div
      className={cn(
        "fixed z-50 pointer-events-none select-none",
        "transition-all duration-200 ease-out",
        isVisible 
          ? "opacity-100 scale-100" 
          : "opacity-0 scale-95",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        transformOrigin: position.placement === 'left' ? 'right center' : 
                        position.placement === 'right' ? 'left center' :
                        position.placement === 'top' ? 'center bottom' : 'center top'
      }}
    >
      <div className="bg-gray-900/90 backdrop-blur-sm text-white rounded-lg shadow-xl border border-gray-700/50 overflow-hidden">
        {/* 헤더 */}
        <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-sm">
              개인 일정 ({events.length}개)
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-1">
            {formatDateKorean(date)}
          </p>
        </div>

        {/* 이벤트 목록 */}
        <div className="max-h-40 overflow-y-auto">
          <div className="px-3 py-2 space-y-2">
            {events.map((event, index) => (
              <div key={event.id} className="space-y-1">
                {index > 0 && (
                  <div className="border-t border-gray-700/30 -mx-3 mx-3"></div>
                )}
                
                {/* 이벤트 제목 */}
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate" title={event.title}>
                      {event.title}
                    </p>
                    
                    {/* 시간 정보 */}
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-300">
                        {formatEventTime(event.startTime, event.endTime, event.allDay)}
                      </span>
                    </div>

                    {/* 카테고리 (있는 경우) */}
                    {event.category && (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 text-xs bg-gray-800/60 text-gray-300 rounded">
                          {event.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="px-3 py-1.5 bg-gray-800/30 border-t border-gray-700/30">
          <p className="text-xs text-gray-400 text-center">
            iCalendar에서 가져온 일정
          </p>
        </div>
      </div>
    </div>
  );

  // Portal을 통해 body에 렌더링
  return createPortal(tooltipContent, document.body);
};

export default ICSTooltip;