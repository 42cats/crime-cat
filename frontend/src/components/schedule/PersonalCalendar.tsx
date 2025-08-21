import React, { useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, Ban, Check, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useCalendarState, DateStatus } from '@/hooks/useCalendarState';
import CalendarEventOverlay from './CalendarEventOverlay';
import { cn } from '@/lib/utils';

interface PersonalCalendarProps {
  className?: string;
  onDateSelect?: (date: Date) => void;
  showBlockedDates?: boolean;
  allowBlocking?: boolean;
  showEvents?: boolean;
  autoRefresh?: boolean;
}

/**
 * 개인 캘린더 컴포넌트
 * - iCalendar 데이터 시각화
 * - 3가지 날짜 상태 표시 (사용가능/비활성화/기존일정)
 * - 클릭/드래그 날짜 비활성화 기능
 * - 월간/주간 뷰 지원
 */
const PersonalCalendar: React.FC<PersonalCalendarProps> = ({
  className,
  onDateSelect,
  showBlockedDates = true,
  allowBlocking = true,
  showEvents = true,
  autoRefresh = false,
}) => {
  // 캘린더 상태 관리 훅 사용
  const {
    currentMonth,
    setCurrentMonth,
    monthStats,
    isLoading,
    error,
    isDragging,
    dragStart,
    dragEnd,
    getDateInfo,
    handleDateClick: hookHandleDateClick,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    refreshData,
    userEvents,
  } = useCalendarState({
    enableBlocking: allowBlocking && showBlockedDates,
    enableEventFetching: showEvents,
    autoRefreshInterval: autoRefresh ? 30000 : 0, // 30초
  });

  /**
   * 날짜 클릭 핸들러 (커스텀 로직 추가)
   */
  const handleDateClick = useCallback((date: Date) => {
    hookHandleDateClick(date);
    onDateSelect?.(date);
  }, [hookHandleDateClick, onDateSelect]);

  /**
   * 날짜 스타일 계산
   */
  const getDateClassName = useCallback((date: Date) => {
    const dateInfo = getDateInfo(date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    
    // 드래그 선택 범위인지 확인
    const isInDragRange = isDragging && dragStart && dragEnd && 
      date >= (dragStart < dragEnd ? dragStart : dragEnd) && 
      date <= (dragStart < dragEnd ? dragEnd : dragStart);
    
    const baseClasses = [
      'relative',
      'w-full',
      'h-full',
      'flex',
      'items-center',
      'justify-center',
      'cursor-pointer',
      'transition-all',
      'duration-200',
    ];
    
    // 상태별 스타일
    switch (dateInfo.status) {
      case DateStatus.BLOCKED:
        baseClasses.push(
          'bg-red-100',
          'text-red-700',
          'border-2',
          'border-red-300',
          'hover:bg-red-200'
        );
        break;
      case DateStatus.BUSY:
        baseClasses.push(
          'bg-blue-100',
          'text-blue-700',
          'border-2',
          'border-blue-300',
          'hover:bg-blue-200'
        );
        break;
      default:
        baseClasses.push(
          'bg-green-50',
          'text-green-700',
          'border-2',
          'border-green-200',
          'hover:bg-green-100'
        );
    }
    
    // 오늘 날짜 강조
    if (isToday) {
      baseClasses.push('ring-2', 'ring-primary', 'ring-offset-1');
    }
    
    // 과거 날짜 비활성화
    if (isPast) {
      baseClasses.push('opacity-50', 'cursor-not-allowed');
    }
    
    // 드래그 선택 영역
    if (isInDragRange) {
      baseClasses.push('bg-primary/20', 'border-primary');
    }
    
    return cn(baseClasses);
  }, [getDateInfo, isDragging, dragStart, dragEnd]);

  /**
   * 날짜 아이콘 렌더링
   */
  const renderDateIcon = useCallback((date: Date) => {
    const dateInfo = getDateInfo(date);
    
    switch (dateInfo.status) {
      case DateStatus.BLOCKED:
        return <Ban className="w-3 h-3 absolute top-0.5 right-0.5 text-red-500" />;
      case DateStatus.BUSY:
        return <Clock className="w-3 h-3 absolute top-0.5 right-0.5 text-blue-500" />;
      default:
        return <Check className="w-3 h-3 absolute top-0.5 right-0.5 text-green-500" />;
    }
  }, [getDateInfo]);

  /**
   * 범례 컴포넌트
   */
  const Legend = () => (
    <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-green-100 border-2 border-green-200 rounded"></div>
        <Check className="w-3 h-3 text-green-500" />
        <span className="text-sm">사용 가능</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
        <Ban className="w-3 h-3 text-red-500" />
        <span className="text-sm">비활성화됨</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
        <Clock className="w-3 h-3 text-blue-500" />
        <span className="text-sm">기존 일정</span>
      </div>
    </div>
  );

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            개인 캘린더
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                로딩 중...
              </div>
            )}
            
            {!isLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshData}
                className="flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </Button>
            )}
          </div>
        </div>
        
        {allowBlocking && (
          <p className="text-sm text-muted-foreground">
            날짜를 클릭하거나 드래그하여 추천에서 제외할 날짜를 선택하세요.
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 에러 표시 */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">
              데이터를 불러오는 중 오류가 발생했습니다.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="mt-2"
            >
              다시 시도
            </Button>
          </div>
        )}
        
        {/* 범례 */}
        <Legend />
        
        {/* 캘린더 */}
        <div 
          onMouseUp={endDrag}
          onMouseLeave={cancelDrag}
        >
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={() => {}} // 기본 선택 동작 비활성화
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border"
            classNames={{
              day: "relative p-0 h-9 w-9 text-sm",
            }}
            components={{
              Day: ({ date, displayMonth, ...props }) => {
                // displayMonth 등 DOM에 불필요한 props 필터링
                const { 
                  selected, 
                  today, 
                  disabled, 
                  range_start, 
                  range_end, 
                  range_middle, 
                  outside, 
                  ...domProps 
                } = props;
                
                return (
                  <div
                    className={getDateClassName(date)}
                    onClick={() => handleDateClick(date)}
                    onMouseDown={() => startDrag(date)}
                    onMouseEnter={() => updateDrag(date)}
                    {...domProps}
                  >
                    {date.getDate()}
                    {renderDateIcon(date)}
                    
                    {/* 이벤트 오버레이 */}
                    {showEvents && userEvents.length > 0 && (
                      <CalendarEventOverlay
                        events={userEvents}
                        date={date}
                        maxVisible={2}
                        onEventClick={(event) => {
                          console.log('Event clicked:', event);
                          // 향후 이벤트 상세 모달 구현
                        }}
                      />
                    )}
                  </div>
                );
              },
            }}
          />
        </div>
        
        {/* 통계 정보 */}
        <div className="flex flex-wrap gap-4 pt-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Check className="w-3 h-3 text-green-500" />
            사용 가능: {monthStats.availableDays}일
          </Badge>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <Ban className="w-3 h-3 text-red-500" />
            비활성화: {monthStats.blockedDays}일
          </Badge>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-500" />
            기존 일정: {monthStats.busyDays}일
          </Badge>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3 text-primary" />
            가용률: {monthStats.availabilityRate}%
          </Badge>
        </div>
        
        {/* 도움말 */}
        {allowBlocking && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p>💡 <strong>사용법:</strong></p>
            <p>• 단일 날짜: 클릭하여 비활성화/활성화 토글</p>
            <p>• 날짜 범위: 드래그하여 범위 선택 후 일괄 비활성화</p>
            <p>• 과거 날짜와 기존 일정이 있는 날짜는 수정할 수 없습니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PersonalCalendar;