import React from 'react';
import { CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarEvent } from '@/hooks/useCalendarState';
import { 
  formatEventTime, 
  formatDateKorean, 
  getSortedDateKeys, 
  type GroupedICSEvents 
} from '@/utils/icsEventUtils';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { findClosestColorIndex, getAccessibleColorStyle } from '@/utils/calendarColors';

interface ICSMobileListProps {
  groupedEvents: GroupedICSEvents;
  currentMonth: Date;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

/**
 * iCS 일정 목록 컴포넌트 (PC/모바일 반응형)
 * - 월별 iCS 이벤트를 날짜별로 그룹화하여 표시
 * - 스크롤 가능한 목록
 * - 빈 상태 및 에러 상태 처리
 * - PC/모바일에 따른 반응형 레이아웃
 */
const ICSMobileList: React.FC<ICSMobileListProps> = ({
  groupedEvents,
  currentMonth,
  isLoading = false,
  error = null,
  className,
}) => {
  const isMobile = useIsMobile();
  const sortedDateKeys = getSortedDateKeys(groupedEvents);
  const hasEvents = sortedDateKeys.length > 0;
  const totalEvents = sortedDateKeys.reduce((sum, dateKey) => sum + groupedEvents[dateKey].length, 0);

  /**
   * 날짜 키를 Date 객체로 변환
   */
  const parseDate = (dateKey: string): Date => {
    return new Date(dateKey + 'T00:00:00');
  };

  /**
   * 이벤트 아이템 렌더링 (접근성 강화된 캘린더별 색상 적용)
   */
  const renderEventItem = (event: CalendarEvent, index: number) => {
    // colorIndex가 없는 경우 colorHex에서 추정
    const colorIndex = event.colorIndex ?? findClosestColorIndex(event.colorHex);
    const accessibleStyle = getAccessibleColorStyle(colorIndex, '#FAFAFA');
    
    // 향상된 컨테이너 및 점 스타일
    const containerStyle = {
      backgroundColor: `${accessibleStyle.backgroundColor}10`, // 10% 투명도
      borderColor: `${accessibleStyle.backgroundColor}30`,     // 30% 투명도
      border: accessibleStyle.border,
      boxShadow: accessibleStyle.boxShadow
    };
    
    const dotStyle = {
      backgroundColor: accessibleStyle.backgroundColor,
      width: '8px',  // 더 큰 점
      height: '8px',
      border: accessibleStyle.border,
      boxShadow: accessibleStyle.boxShadow
    };
    
    return (
      <div 
        key={event.id} 
        className={cn(
          "flex items-start gap-2 rounded-lg border",
          isMobile ? "p-2" : "p-3"
        )}
        style={containerStyle}
      >
        <div 
          className="rounded-full mt-2 flex-shrink-0"
          style={dotStyle}
        ></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate" title={event.title}>
            {event.title}
          </p>
          
          {/* 캘린더 이름 표시 (있는 경우) */}
          {event.calendarName && (
            <p className="text-xs text-muted-foreground truncate mb-1">
              📅 {event.calendarName}
            </p>
          )}
          
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatEventTime(event.startTime, event.endTime, event.allDay)}
            </span>
          </div>

          {/* 카테고리 (있는 경우) */}
          {event.category && (
            <div className="mt-1">
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                {event.category}
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * 날짜 그룹 렌더링
   */
  const renderDateGroup = (dateKey: string) => {
    const date = parseDate(dateKey);
    const events = groupedEvents[dateKey];
    const isToday = dateKey === new Date().toISOString().split('T')[0];

    return (
      <div key={dateKey} className="space-y-2">
        {/* 날짜 헤더 */}
        <div className="flex items-center gap-2 pt-3 first:pt-0">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
            isToday 
              ? "bg-primary/10 text-primary border border-primary/20" 
              : "bg-muted text-muted-foreground"
          )}>
            <CalendarIcon className="w-3 h-3" />
            <span>{formatDateKorean(date)}</span>
            {isToday && (
              <span className="text-xs bg-primary text-primary-foreground px-1 py-0.5 rounded">
                오늘
              </span>
            )}
          </div>
          <Badge variant="outline" className="text-xs h-auto px-1.5 py-0.5">
            {events.length}개
          </Badge>
        </div>

        {/* 이벤트 목록 */}
        <div className="space-y-2 ml-1">
          {events.map((event, index) => renderEventItem(event, index))}
        </div>
      </div>
    );
  };

  /**
   * 로딩 상태 렌더링
   */
  if (isLoading) {
    return (
      <Card className={cn("mt-4", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="w-4 h-4 animate-pulse text-emerald-500" />
            개인 일정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              개인 일정을 불러오는 중...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * 에러 상태 렌더링
   */
  if (error) {
    return (
      <Card className={cn("mt-4 border-destructive/20", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertCircle className="w-4 h-4" />
            개인 일정 오류
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <p className="text-xs text-muted-foreground">
              설정에서 iCalendar URL을 다시 확인해주세요.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("mt-4", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="w-4 h-4 text-emerald-500" />
            개인 일정
          </CardTitle>
          {hasEvents && (
            <Badge variant="secondary" className="text-xs px-2 py-1">
              총 {totalEvents}개
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {!hasEvents ? (
          // 빈 상태
          <div className="text-center py-8">
            <CalendarIcon className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">
              이번 달 개인 일정이 없습니다
            </p>
            <p className="text-xs text-muted-foreground/70">
              설정에서 iCalendar를 연동해보세요
            </p>
          </div>
        ) : (
          // 이벤트 목록
          <ScrollArea className={cn(isMobile ? "h-48" : "h-64")}>
            <div className="space-y-1 pr-4">
              {sortedDateKeys.map(dateKey => renderDateGroup(dateKey))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ICSMobileList;