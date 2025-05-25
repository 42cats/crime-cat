import React from "react";
import { Label } from "@/components/ui/label";
import { RangeSlider, TimeRangeSlider } from "@/components/ui/enhanced-slider";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Gamepad2, BookOpen, Filter as FilterIcon } from "lucide-react";
import { IntegratedGameHistoryFilterRequest } from "@/types/integratedGameHistory";
import { cn } from "@/lib/utils";

interface EscapeRoomDetailFiltersProps {
  filter: IntegratedGameHistoryFilterRequest;
  onFilterChange: (updates: Partial<IntegratedGameHistoryFilterRequest>) => void;
}

export const EscapeRoomDetailFilters: React.FC<EscapeRoomDetailFiltersProps> = ({
  filter,
  onFilterChange,
}) => {
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filter.minClearTime !== undefined || filter.maxClearTime !== undefined) count++;
    if (filter.minDifficulty !== undefined && filter.minDifficulty > 1) count++;
    if (filter.maxDifficulty !== undefined && filter.maxDifficulty < 5) count++;
    if (filter.minFunRating !== undefined && filter.minFunRating > 1) count++;
    if (filter.maxFunRating !== undefined && filter.maxFunRating < 5) count++;
    if (filter.minStoryRating !== undefined && filter.minStoryRating > 1) count++;
    if (filter.maxStoryRating !== undefined && filter.maxStoryRating < 5) count++;
    return count;
  }, [filter]);

  const resetDetailFilters = () => {
    onFilterChange({
      minClearTime: undefined,
      maxClearTime: undefined,
      minDifficulty: undefined,
      maxDifficulty: undefined,
      minFunRating: undefined,
      maxFunRating: undefined,
      minStoryRating: undefined,
      maxStoryRating: undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">방탈출 상세 필터</h4>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}개 적용중
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={resetDetailFilters}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            상세 필터 초기화
          </button>
        )}
      </div>

      {/* Filters Grid */}
      <div className="space-y-8">
        {/* Clear Time Filter */}
        <div className="bg-muted/30 rounded-lg p-6">
          <TimeRangeSlider
            min={0}
            max={600}
            value={[filter.minClearTime, filter.maxClearTime]}
            onValueChange={([min, max]) =>
              onFilterChange({
                minClearTime: min,
                maxClearTime: max,
              })
            }
            label="클리어 시간"
          />
        </div>

        {/* Rating Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Difficulty */}
          <div className={cn(
            "rounded-lg p-6 transition-colors",
            (filter.minDifficulty !== undefined && filter.minDifficulty > 1) || 
            (filter.maxDifficulty !== undefined && filter.maxDifficulty < 5)
              ? "bg-primary/5 border border-primary/20"
              : "bg-muted/30"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">난이도</Label>
            </div>
            <RangeSlider
              min={1}
              max={5}
              step={1}
              value={[filter.minDifficulty || 1, filter.maxDifficulty || 5]}
              onValueChange={([min, max]) =>
                onFilterChange({
                  minDifficulty: min,
                  maxDifficulty: max,
                })
              }
              showStars={true}
            />
          </div>

          {/* Fun Rating */}
          <div className={cn(
            "rounded-lg p-6 transition-colors",
            (filter.minFunRating !== undefined && filter.minFunRating > 1) || 
            (filter.maxFunRating !== undefined && filter.maxFunRating < 5)
              ? "bg-primary/5 border border-primary/20"
              : "bg-muted/30"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">재미</Label>
            </div>
            <RangeSlider
              min={1}
              max={5}
              step={1}
              value={[filter.minFunRating || 1, filter.maxFunRating || 5]}
              onValueChange={([min, max]) =>
                onFilterChange({
                  minFunRating: min,
                  maxFunRating: max,
                })
              }
              showStars={true}
            />
          </div>

          {/* Story Rating */}
          <div className={cn(
            "rounded-lg p-6 transition-colors",
            (filter.minStoryRating !== undefined && filter.minStoryRating > 1) || 
            (filter.maxStoryRating !== undefined && filter.maxStoryRating < 5)
              ? "bg-primary/5 border border-primary/20"
              : "bg-muted/30"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">스토리</Label>
            </div>
            <RangeSlider
              min={1}
              max={5}
              step={1}
              value={[filter.minStoryRating || 1, filter.maxStoryRating || 5]}
              onValueChange={([min, max]) =>
                onFilterChange({
                  minStoryRating: min,
                  maxStoryRating: max,
                })
              }
              showStars={true}
            />
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {(filter.minClearTime !== undefined || filter.maxClearTime !== undefined) && (
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {filter.minClearTime ?? 0}-{filter.maxClearTime ?? 600}분
            </Badge>
          )}
          {((filter.minDifficulty !== undefined && filter.minDifficulty > 1) || 
            (filter.maxDifficulty !== undefined && filter.maxDifficulty < 5)) && (
            <Badge variant="outline" className="text-xs">
              <Gamepad2 className="w-3 h-3 mr-1" />
              난이도 {filter.minDifficulty ?? 1}-{filter.maxDifficulty ?? 5}
            </Badge>
          )}
          {((filter.minFunRating !== undefined && filter.minFunRating > 1) || 
            (filter.maxFunRating !== undefined && filter.maxFunRating < 5)) && (
            <Badge variant="outline" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              재미 {filter.minFunRating ?? 1}-{filter.maxFunRating ?? 5}
            </Badge>
          )}
          {((filter.minStoryRating !== undefined && filter.minStoryRating > 1) || 
            (filter.maxStoryRating !== undefined && filter.maxStoryRating < 5)) && (
            <Badge variant="outline" className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              스토리 {filter.minStoryRating ?? 1}-{filter.maxStoryRating ?? 5}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
