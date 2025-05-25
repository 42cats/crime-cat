import React from "react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { EscapeRoomDetailFilters } from "./EscapeRoomDetailFilters";
import {
    GameType,
    SortOption,
    SortDirection,
    SuccessStatusFilter,
    IntegratedGameHistoryFilterRequest,
} from "@/types/integratedGameHistory";
import { cn } from "@/lib/utils";

interface UnifiedGameFiltersProps {
    filter: IntegratedGameHistoryFilterRequest;
    onFilterChange: (filter: IntegratedGameHistoryFilterRequest) => void;
    onSearch: () => void;
    onReset: () => void;
    gameType?: GameType;
    showGameTypeSelector?: boolean;
}

export const UnifiedGameFilters: React.FC<UnifiedGameFiltersProps> = ({
    filter,
    onFilterChange,
    onSearch,
    onReset,
    gameType,
    showGameTypeSelector = false,
}) => {
    const [showDetailFilters, setShowDetailFilters] = React.useState(false);
    
    const updateFilter = (
        updates: Partial<IntegratedGameHistoryFilterRequest>
    ) => {
        onFilterChange({ ...filter, ...updates });
    };

    const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
        updateFilter({
            startDate: range.from?.toISOString().split("T")[0],
            endDate: range.to?.toISOString().split("T")[0],
        });
    };

    const isEscapeRoom =
        gameType === GameType.ESCAPE_ROOM ||
        filter.gameType === GameType.ESCAPE_ROOM;
    const isCrimeScene =
        gameType === GameType.CRIMESCENE ||
        filter.gameType === GameType.CRIMESCENE;
        
    // 활성화된 필터 개수 계산
    const activeFilterCount = React.useMemo(() => {
        let count = 0;
        if (filter.keyword) count++;
        if (filter.startDate || filter.endDate) count++;
        if (filter.isWin !== undefined) count++;
        if (filter.successStatus && filter.successStatus !== SuccessStatusFilter.ALL) count++;
        if (filter.hasTheme) count++;
        if (filter.sortBy !== SortOption.CREATED_AT) count++;
        if (filter.sortDirection !== SortDirection.DESC) count++;
        // 방탈출 상세 필터
        if (isEscapeRoom) {
            if (filter.minClearTime !== undefined || filter.maxClearTime !== undefined) count++;
            if (filter.minDifficulty !== undefined && filter.minDifficulty > 1) count++;
            if (filter.maxDifficulty !== undefined && filter.maxDifficulty < 5) count++;
            if (filter.minFunRating !== undefined && filter.minFunRating > 1) count++;
            if (filter.maxFunRating !== undefined && filter.maxFunRating < 5) count++;
            if (filter.minStoryRating !== undefined && filter.minStoryRating > 1) count++;
            if (filter.maxStoryRating !== undefined && filter.maxStoryRating < 5) count++;
        }
        return count;
    }, [filter, isEscapeRoom]);

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        필터
                    </h3>
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary">
                            {activeFilterCount}개 적용중
                        </Badge>
                    )}
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onReset}
                    className={cn(
                        activeFilterCount > 0 
                            ? "text-destructive hover:text-destructive" 
                            : ""
                    )}
                >
                    <X className="w-4 h-4 mr-1" />
                    모두 초기화
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 게임 타입 선택 (옵션) */}
                {showGameTypeSelector && (
                    <div>
                        <Label>게임 타입</Label>
                        <Select
                            value={filter.gameType}
                            onValueChange={(value) =>
                                updateFilter({ gameType: value as GameType })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="전체" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">전체</SelectItem>
                                <SelectItem value={GameType.CRIMESCENE}>
                                    크라임씬
                                </SelectItem>
                                <SelectItem value={GameType.ESCAPE_ROOM}>
                                    방탈출
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* 검색어 */}
                <div className="md:col-span-2 lg:col-span-1">
                    <Label>검색어</Label>
                    <Input
                        placeholder="테마명, 길드명, 매장명 검색"
                        value={filter.keyword || ""}
                        onChange={(e) =>
                            updateFilter({ keyword: e.target.value })
                        }
                        onKeyPress={(e) => e.key === "Enter" && onSearch()}
                    />
                </div>

                {/* 날짜 범위 */}
                <div>
                    <Label>플레이 날짜</Label>
                    <DateRangePicker
                        from={
                            filter.startDate
                                ? new Date(filter.startDate)
                                : undefined
                        }
                        to={
                            filter.endDate
                                ? new Date(filter.endDate)
                                : undefined
                        }
                        onSelect={handleDateRangeChange}
                    />
                </div>

                {/* 승패 필터 (크라임씬) / 성공 상태 (방탈출) */}
                {isCrimeScene && (
                    <div>
                        <Label>승패</Label>
                        <Select
                            value={
                                filter.isWin === undefined
                                    ? "ALL"
                                    : filter.isWin
                                    ? "WIN"
                                    : "LOSE"
                            }
                            onValueChange={(value) => {
                                if (value === "ALL")
                                    updateFilter({ isWin: undefined });
                                else updateFilter({ isWin: value === "WIN" });
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="전체" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">전체</SelectItem>
                                <SelectItem value="WIN">승리</SelectItem>
                                <SelectItem value="LOSE">패배</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {isEscapeRoom && (
                    <div>
                        <Label>성공 상태</Label>
                        <Select
                            value={
                                filter.successStatus || SuccessStatusFilter.ALL
                            }
                            onValueChange={(value) =>
                                updateFilter({
                                    successStatus: value as SuccessStatusFilter,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={SuccessStatusFilter.ALL}>
                                    전체
                                </SelectItem>
                                <SelectItem
                                    value={SuccessStatusFilter.SUCCESS_ONLY}
                                >
                                    성공만
                                </SelectItem>
                                <SelectItem
                                    value={SuccessStatusFilter.FAIL_ONLY}
                                >
                                    실패만
                                </SelectItem>
                                <SelectItem
                                    value={SuccessStatusFilter.PARTIAL_ONLY}
                                >
                                    부분성공만
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* 테마 존재 여부 (크라임씬) */}
                {isCrimeScene && (
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="hasTheme"
                            checked={filter.hasTheme || false}
                            onCheckedChange={(checked) =>
                                updateFilter({ hasTheme: checked })
                            }
                        />
                        <Label htmlFor="hasTheme">테마 있는 기록만</Label>
                    </div>
                )}

                {/* 정렬 옵션 */}
                <div>
                    <Label>정렬 기준</Label>
                    <Select
                        value={filter.sortBy || SortOption.CREATED_AT} // PLAY_DATE 대신 CREATED_AT 사용 (백엔드 버그 회피)
                        onValueChange={(value) =>
                            updateFilter({ sortBy: value as SortOption })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={SortOption.CREATED_AT}>
                                플레이 날짜
                            </SelectItem>
                            <SelectItem value={SortOption.CREATED_AT}>
                                기록 생성일
                            </SelectItem>
                            <SelectItem value={SortOption.THEME_NAME}>
                                테마명
                            </SelectItem>
                            {isCrimeScene && (
                                <SelectItem value={SortOption.GUILD_NAME}>
                                    길드명
                                </SelectItem>
                            )}
                            {isEscapeRoom && (
                                <SelectItem value={SortOption.STORE_NAME}>
                                    매장명
                                </SelectItem>
                            )}
                            {isEscapeRoom && (
                                <SelectItem value={SortOption.CLEAR_TIME}>
                                    클리어 시간
                                </SelectItem>
                            )}
                            {isEscapeRoom && (
                                <SelectItem value={SortOption.DIFFICULTY}>
                                    난이도
                                </SelectItem>
                            )}
                            {isEscapeRoom && (
                                <SelectItem value={SortOption.FUN_RATING}>
                                    재미 평가
                                </SelectItem>
                            )}
                            {isEscapeRoom && (
                                <SelectItem value={SortOption.STORY_RATING}>
                                    스토리 평가
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* 정렬 방향 */}
                <div>
                    <Label>정렬 순서</Label>
                    <Select
                        value={filter.sortDirection || SortDirection.DESC}
                        onValueChange={(value) =>
                            updateFilter({
                                sortDirection: value as SortDirection,
                            })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={SortDirection.DESC}>
                                내림차순
                            </SelectItem>
                            <SelectItem value={SortDirection.ASC}>
                                오름차순
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 방탈출 전용 상세 필터 */}
            {isEscapeRoom && (
                <div className="border-t pt-4 mt-4">
                    <button
                        onClick={() => setShowDetailFilters(!showDetailFilters)}
                        className="w-full flex items-center justify-between py-2 text-left hover:text-primary transition-colors"
                    >
                        <span className="text-sm font-semibold">방탈출 상세 필터</span>
                        {showDetailFilters ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>
                    
                    {showDetailFilters && (
                        <div className="mt-4">
                            <EscapeRoomDetailFilters
                                filter={filter}
                                onFilterChange={updateFilter}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* 검색 버튼 */}
            <div className="flex justify-end pt-4">
                <Button onClick={onSearch} className="gap-2">
                    <Search className="w-4 h-4" />
                    검색
                </Button>
            </div>
        </div>
    );
};
