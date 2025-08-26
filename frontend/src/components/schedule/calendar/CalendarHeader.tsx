import React from 'react';
import { Calendar as CalendarIcon, RefreshCw, Grid, Maximize2, Minimize2 } from 'lucide-react';
import { CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type CalendarViewMode = 'compact' | 'standard' | 'expanded';

interface CalendarHeaderProps {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  isLoading: boolean;
  onRefresh: () => void;
  calendarSizes: {
    headerSize: string;
    iconSize: string;
    fontSize: string;
  };
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  viewMode,
  onViewModeChange,
  isLoading,
  onRefresh,
  calendarSizes
}) => {
  const isMobile = useIsMobile();

  return (
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
          {/* 뷰 모드 선택 - 데스크톱 */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">크기:</span>
              <ToggleGroup 
                type="single" 
                value={viewMode}
                onValueChange={(value) => value && onViewModeChange(value as CalendarViewMode)}
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

          {/* 뷰 모드 선택 - 모바일 */}
          {isMobile && (
            <Select
              value={viewMode}
              onValueChange={(value) => onViewModeChange(value as CalendarViewMode)}
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
              onClick={onRefresh}
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
  );
};

export default CalendarHeader;