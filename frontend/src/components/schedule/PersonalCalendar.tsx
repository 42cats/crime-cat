import React, { useCallback, useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Ban, Check, RefreshCw, ChevronLeft, ChevronRight, Maximize2, Minimize2, Grid, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCalendarState, DateStatus, CalendarEvent } from '@/hooks/useCalendarState';
import { useMemo } from 'react';
import CalendarEventOverlay from './CalendarEventOverlay';
import { ICSTooltip, ICSMobileList } from './ics';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebouncedCallback } from '@/hooks/useDebounce';

interface PersonalCalendarProps {
  className?: string;
  onDateSelect?: (date: Date) => void;
  showBlockedDates?: boolean;
  allowBlocking?: boolean;
  showEvents?: boolean;
  autoRefresh?: boolean;
  defaultViewMode?: CalendarViewMode;
  onViewModeChange?: (mode: CalendarViewMode) => void;
}

type CalendarViewMode = 'compact' | 'standard' | 'expanded';

type CalendarSize = {
  cellSize: string;
  fontSize: string;
  iconSize: string;
  spacing: string;
  headerSize: string;
};

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
  defaultViewMode = 'standard',
  onViewModeChange,
}) => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<CalendarViewMode>(
    isMobile ? 'compact' : defaultViewMode
  );

  // 모바일/데스크톱 전환 시 뷰 모드 자동 조정
  useEffect(() => {
    if (isMobile && viewMode === 'expanded') {
      setViewMode('standard');
    }
  }, [isMobile, viewMode]);

  // 뷰 모드 변경 핸들러
  const handleViewModeChange = useCallback((mode: CalendarViewMode) => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  }, [onViewModeChange]);

  // 뷰 모드별 사이즈 설정
  const getCalendarSizes = useCallback((mode: CalendarViewMode): CalendarSize => {
    const sizes: Record<CalendarViewMode, CalendarSize> = {
      compact: {
        cellSize: isMobile ? 'h-8 w-8' : 'h-10 w-10',
        fontSize: 'text-xs',
        iconSize: 'w-2.5 h-2.5',
        spacing: 'space-y-2',
        headerSize: 'text-sm',
      },
      standard: {
        cellSize: isMobile ? 'h-10 w-10' : 'h-12 w-12',
        fontSize: 'text-sm',
        iconSize: 'w-3 h-3',
        spacing: 'space-y-3',
        headerSize: 'text-base',
      },
      expanded: {
        cellSize: isMobile ? 'h-12 w-12' : 'h-16 w-16',
        fontSize: 'text-base',
        iconSize: 'w-4 h-4',
        spacing: 'space-y-4',
        headerSize: 'text-lg',
      },
    };
    return sizes[mode];
  }, [isMobile]);

  const calendarSizes = getCalendarSizes(viewMode);
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
    icsEvents,
    groupedICSEvents,
    getICSEventsForDate,
    hasICSEventsOnDate,
  } = useCalendarState({
    enableBlocking: allowBlocking && showBlockedDates,
    enableEventFetching: showEvents,
    autoRefreshInterval: autoRefresh ? 30000 : 0, // 30초
  });

  // PC 호버 툴팁 상태
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredEvents, setHoveredEvents] = useState<CalendarEvent[]>([]);

  // Crime-Cat 이벤트만 필터링 (메모이제이션)
  const crimeCatEvents = useMemo(() => {
    return userEvents.filter(event => event.source === 'crime-cat');
  }, [userEvents]);

  /**
   * 날짜 클릭 핸들러 (커스텀 로직 추가)
   */
  const handleDateClick = useCallback((date: Date) => {
    hookHandleDateClick(date);
    onDateSelect?.(date);
  }, [hookHandleDateClick, onDateSelect]);

  /**
   * PC 호버 이벤트 핸들러 (디바운스됨)
   */
  const handleCellMouseEnter = useDebouncedCallback((date: Date, event: React.MouseEvent) => {
    // 모바일에서는 호버 비활성화
    if (isMobile) return;

    // iCS 이벤트가 있는 날짜만 호버 반응
    if (hasICSEventsOnDate(date)) {
      const events = getICSEventsForDate(date);
      setHoveredDate(date);
      setMousePosition({ x: event.clientX, y: event.clientY });
      setHoveredEvents(events);
    }
  }, 50); // 50ms 디바운스

  /**
   * 호버 종료 핸들러 (디바운스됨)
   */
  const handleCellMouseLeave = useDebouncedCallback(() => {
    if (isMobile) return;

    // 툴팁 숨기기
    setHoveredDate(null);
    setMousePosition(null);
    setHoveredEvents([]);
  }, 100); // 100ms 디바운스로 깜빡임 방지


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
      'text-xs sm:text-sm',
      'min-h-[2.5rem] sm:min-h-[3rem]',
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
      case DateStatus.BUSY: {
        // iCalendar vs Crime-Cat 이벤트에 따른 배경색 구분
        const hasICalEvent = dateInfo.events.some(event => event.source === 'icalendar');
        const hasCrimeCatEvent = dateInfo.events.some(event => event.source === 'crime-cat');
        
        if (hasICalEvent && hasCrimeCatEvent) {
          // 둘 다 있는 경우 - 보라색 배경
          baseClasses.push(
            'bg-purple-100',
            'text-purple-700',
            'border-2',
            'border-purple-300',
            'hover:bg-purple-200'
          );
        } else if (hasICalEvent) {
          // iCalendar 이벤트만 - 에메랄드 배경
          baseClasses.push(
            'bg-emerald-100',
            'text-emerald-700',
            'border-2',
            'border-emerald-300',
            'hover:bg-emerald-200'
          );
        } else {
          // Crime-Cat 이벤트만 - 파란색 배경
          baseClasses.push(
            'bg-blue-100',
            'text-blue-700',
            'border-2',
            'border-blue-300',
            'hover:bg-blue-200'
          );
        }
        break;
      }
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
   * 날짜 아이콘 렌더링 (이벤트 소스별 구분)
   */
  const renderDateIcon = useCallback((date: Date) => {
    const dateInfo = getDateInfo(date);
    
    const iconSize = calendarSizes.iconSize;
    const iconPosition = viewMode === 'compact' ? "top-0 right-0" : "top-0.5 right-0.5";
    
    switch (dateInfo.status) {
      case DateStatus.BLOCKED:
        return <Ban className={`${iconSize} absolute ${iconPosition} text-red-500`} />;
      case DateStatus.BUSY: {
        // iCalendar vs Crime-Cat 이벤트 구분
        const hasICalEvent = dateInfo.events.some(event => event.source === 'icalendar');
        const hasCrimeCatEvent = dateInfo.events.some(event => event.source === 'crime-cat');
        
        if (hasICalEvent && hasCrimeCatEvent) {
          // 둘 다 있는 경우 - 보라색 시계
          return <Clock className={`${iconSize} absolute ${iconPosition} text-purple-500`} />;
        } else if (hasICalEvent) {
          // iCalendar 이벤트만 - 초록색 달력
          return <CalendarIcon className={`${iconSize} absolute ${iconPosition} text-emerald-500`} />;
        } else {
          // Crime-Cat 이벤트만 - 파란색 시계
          return <Clock className={`${iconSize} absolute ${iconPosition} text-blue-500`} />;
        }
      }
      default:
        return <Check className={`${iconSize} absolute ${iconPosition} text-green-500`} />;
    }
  }, [getDateInfo, calendarSizes.iconSize, viewMode]);

  /**
   * 범례 컴포넌트 (반응형 디자인)
   */
  const Legend = () => {
    const isMobile = useIsMobile();
    
    return (
      <div className={cn(
        "grid gap-2 p-3 bg-muted/30 rounded-lg",
        isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      )}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 border-2 border-green-200 rounded flex-shrink-0"></div>
          <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm truncate">사용 가능</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 border-2 border-red-300 rounded flex-shrink-0"></div>
          <Ban className="w-3 h-3 text-red-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm truncate">비활성화됨</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-100 border-2 border-emerald-300 rounded flex-shrink-0"></div>
          <CalendarIcon className="w-3 h-3 text-emerald-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm truncate">개인 일정</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 border-2 border-blue-300 rounded flex-shrink-0"></div>
          <Clock className="w-3 h-3 text-blue-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm truncate">Crime-Cat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-100 border-2 border-purple-300 rounded flex-shrink-0"></div>
          <Clock className="w-3 h-3 text-purple-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm truncate">복합 일정</span>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('w-full max-w-full', className)}>
      <CardHeader className={cn(
        "pb-4",
        isMobile && "px-4 py-3"
      )}>
        <div className="flex flex-col gap-4">
          {/* 제목 및 컨트롤 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className={cn(
              "flex items-center gap-2",
              calendarSizes.headerSize
            )}>
              <CalendarIcon className={cn(
                calendarSizes.iconSize === 'w-2.5 h-2.5' ? "w-4 h-4" : 
                calendarSizes.iconSize === 'w-3 h-3' ? "w-5 h-5" : "w-6 h-6"
              )} />
              개인 캘린더
            </CardTitle>
            
            <div className="flex items-center gap-3">
              {/* 뷰 모드 선택 */}
              {!isMobile && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">크기:</span>
                  <ToggleGroup 
                    type="single" 
                    value={viewMode}
                    onValueChange={(value) => value && handleViewModeChange(value as CalendarViewMode)}
                    size="sm"
                  >
                    <ToggleGroupItem value="compact" aria-label="컴팩트 뷰">
                      <Minimize2 className="w-3 h-3" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="standard" aria-label="표준 뷰">
                      <Grid className="w-3 h-3" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="expanded" aria-label="확대 뷰">
                      <Maximize2 className="w-3 h-3" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}

              {/* 모바일 뷰 모드 선택 */}
              {isMobile && (
                <Select
                  value={viewMode}
                  onValueChange={(value) => handleViewModeChange(value as CalendarViewMode)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">컴팩트</SelectItem>
                    <SelectItem value="standard">표준</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {/* 새로고침 버튼 */}
              {isLoading ? (
                <div className={cn(
                  "flex items-center gap-2 text-muted-foreground",
                  calendarSizes.fontSize
                )}>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {!isMobile && "로딩 중..."}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size={isMobile ? "sm" : "default"}
                  onClick={refreshData}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  {!isMobile && "새로고침"}
                </Button>
              )}
            </div>
          </div>

          {/* 뷰 모드 설명 */}
          <div className={cn(
            "text-muted-foreground",
            calendarSizes.fontSize
          )}>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {viewMode === 'compact' && '컴팩트'}
                {viewMode === 'standard' && '표준'}
                {viewMode === 'expanded' && '확대'}
              </Badge>
              <span>
                {viewMode === 'compact' && '작은 크기로 한눈에 보기'}
                {viewMode === 'standard' && '기본 크기로 편리하게 보기'}
                {viewMode === 'expanded' && '큰 크기로 자세히 보기'}
              </span>
            </div>
          </div>
        </div>
        
        {allowBlocking && (
          <p className={cn(
            "text-muted-foreground",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {isMobile 
              ? "탭하거나 드래그하여 날짜를 비활성화하세요."
              : "날짜를 클릭하거나 드래그하여 추천에서 제외할 날짜를 선택하세요."
            }
          </p>
        )}
      </CardHeader>
      
      <CardContent className={cn(
        "space-y-4",
        isMobile && "px-4 pb-4"
      )}>
        {/* 에러 표시 */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className={cn(
              "text-destructive",
              isMobile ? "text-xs" : "text-sm"
            )}>
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
          className="overflow-hidden"
        >
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={() => {}} // 기본 선택 동작 비활성화
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className={cn(
              "rounded-md border w-full",
              isMobile && "text-sm"
            )}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: cn("w-full", calendarSizes.spacing),
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: cn("font-medium", calendarSizes.fontSize),
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
                calendarSizes.cellSize.split(' ').slice(0, 2).join(' ') // h-x w-x 만 추출
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: cn("w-full border-collapse", viewMode === 'compact' ? 'space-y-1' : 'space-y-2'),
              head_row: "flex w-full",
              head_cell: cn(
                "text-muted-foreground rounded-md font-normal text-center flex items-center justify-center",
                calendarSizes.cellSize,
                calendarSizes.fontSize
              ),
              row: cn("flex w-full", viewMode === 'compact' ? 'mt-1' : 'mt-2'),
              cell: cn(
                "relative p-0 text-center focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                calendarSizes.cellSize
              ),
              day: cn(
                "relative p-0",
                calendarSizes.cellSize,
                calendarSizes.fontSize
              ),
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: ({ ...props }) => (
                <ChevronLeft className={calendarSizes.iconSize} />
              ),
              IconRight: ({ ...props }) => (
                <ChevronRight className={calendarSizes.iconSize} />
              ),
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
                
                // 현재 날짜의 정보 가져오기
                const dateInfo = getDateInfo(date);
                
                return (
                  <div
                    className={getDateClassName(date)}
                    onClick={() => handleDateClick(date)}
                    onMouseDown={() => startDrag(date)}
                    onMouseEnter={(e) => {
                      updateDrag(date);
                      handleCellMouseEnter(date, e);
                    }}
                    onMouseLeave={handleCellMouseLeave}
                    onTouchStart={() => startDrag(date)}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      const touch = e.touches[0];
                      const element = document.elementFromPoint(touch.clientX, touch.clientY);
                      if (element) {
                        const dateStr = element.getAttribute('data-date');
                        if (dateStr) {
                          updateDrag(new Date(dateStr));
                        }
                      }
                    }}
                    onTouchEnd={endDrag}
                    data-date={date.toISOString()}
                    {...domProps}
                  >
                    <span className={cn(
                      "flex items-center justify-center font-medium",
                      calendarSizes.fontSize
                    )}>
                      {date.getDate()}
                    </span>
                    {renderDateIcon(date)}
                    
                    {/* 모든 이벤트 오버레이 (뷰모드와 모바일에 따라 조정) */}
                    {showEvents && dateInfo.events.length > 0 && viewMode !== 'compact' && !isMobile && (
                      <CalendarEventOverlay
                        events={dateInfo.events}
                        date={date}
                        maxVisible={viewMode === 'expanded' ? 2 : 1}
                        onEventClick={(event) => {
                          console.log('Crime-Cat Event clicked:', event);
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
        <div className={cn(
          "grid gap-2 pt-2",
          viewMode === 'compact' ? "grid-cols-2" : 
          viewMode === 'standard' ? (isMobile ? "grid-cols-2" : "grid-cols-4") :
          "grid-cols-2 sm:grid-cols-4"
        )}>
          <Badge variant="outline" className={cn(
            "flex items-center justify-center gap-1 py-2 transition-all",
            calendarSizes.fontSize,
            viewMode === 'expanded' && "py-3"
          )}>
            <Check className={cn(calendarSizes.iconSize, "text-green-500 flex-shrink-0")} />
            <span className="truncate">가능 {monthStats.availableDays}</span>
          </Badge>
          
          <Badge variant="outline" className={cn(
            "flex items-center justify-center gap-1 py-2 transition-all",
            calendarSizes.fontSize,
            viewMode === 'expanded' && "py-3"
          )}>
            <Ban className={cn(calendarSizes.iconSize, "text-red-500 flex-shrink-0")} />
            <span className="truncate">차단 {monthStats.blockedDays}</span>
          </Badge>
          
          <Badge variant="outline" className={cn(
            "flex items-center justify-center gap-1 py-2 transition-all",
            calendarSizes.fontSize,
            viewMode === 'expanded' && "py-3"
          )}>
            <Clock className={cn(calendarSizes.iconSize, "text-blue-500 flex-shrink-0")} />
            <span className="truncate">일정 {monthStats.busyDays}</span>
          </Badge>
          
          <Badge variant="outline" className={cn(
            "flex items-center justify-center gap-1 py-2 transition-all",
            calendarSizes.fontSize,
            viewMode === 'expanded' && "py-3"
          )}>
            <CalendarIcon className={cn(calendarSizes.iconSize, "text-primary flex-shrink-0")} />
            <span className="truncate">{monthStats.availabilityRate}%</span>
          </Badge>
        </div>
        
        {/* 도움말 */}
        {allowBlocking && !isMobile && viewMode !== 'compact' && (
          <div className={cn(
            "text-muted-foreground space-y-1 pt-2 border-t",
            calendarSizes.fontSize
          )}>
            <p>💡 <strong>사용법:</strong></p>
            <p>• 단일 날짜: 클릭하여 비활성화/활성화 토글</p>
            <p>• 날짜 범위: 드래그하여 범위 선택 후 일괄 비활성화</p>
            <p>• 과거 날짜와 기존 일정이 있는 날짜는 수정할 수 없습니다</p>
          </div>
        )}
        
        {/* 모바일 전용 간단 도움말 */}
        {allowBlocking && isMobile && (
          <div className={cn(
            "text-muted-foreground pt-2 border-t text-center",
            calendarSizes.fontSize
          )}>
            <p>💡 탭하여 날짜 상태 변경, 드래그하여 범위 선택</p>
          </div>
        )}
        
        {/* 컴팩트 모드 전용 간단 도움말 */}
        {allowBlocking && viewMode === 'compact' && !isMobile && (
          <div className={cn(
            "text-muted-foreground pt-2 border-t text-center",
            calendarSizes.fontSize
          )}>
            <p>💡 클릭/드래그로 날짜 관리</p>
          </div>
        )}
      </CardContent>

      {/* PC용 iCS 호버 툴팁 */}
      {!isMobile && (
        <ICSTooltip
          events={hoveredEvents}
          date={hoveredDate}
          mousePosition={mousePosition}
          show={!!hoveredDate && hoveredEvents.length > 0}
        />
      )}

      {/* iCS 이벤트 하단 목록 (PC/모바일 공통) */}
      {showEvents && (
        <ICSMobileList
          groupedEvents={groupedICSEvents}
          currentMonth={currentMonth}
          isLoading={isLoading}
          error={error}
          className="mt-0"
        />
      )}
    </Card>
  );
};

export default PersonalCalendar;