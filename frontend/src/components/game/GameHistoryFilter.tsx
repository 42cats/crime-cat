import React from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    SortAsc,
    Filter,
    Calendar,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface GameHistoryFilterProps {
    sortType: string;
    onSortChange: (sort: any) => void;
    keyword: string;
    onKeywordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSearch: () => void;
    searchField: string;
    onSearchFieldChange: (value: string) => void;
    inputRef?: React.RefObject<HTMLInputElement>;
    // 추가된 필터링 프롭스
    winFilter?: boolean | null;
    onWinFilterChange?: (value: boolean | null) => void;
    startDate?: Date | null;
    endDate?: Date | null;
    onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
    hasTheme?: boolean | null;
    onHasThemeChange?: (value: boolean | null) => void;
}

const GameHistoryFilter: React.FC<GameHistoryFilterProps> = ({
    sortType,
    onSortChange,
    keyword,
    onKeywordChange,
    onSearch,
    searchField,
    onSearchFieldChange,
    inputRef,
    // 추가된 프롭스
    winFilter = null,
    onWinFilterChange = () => {},
    startDate = null,
    endDate = null,
    onDateRangeChange = () => {},
    hasTheme = null,
    onHasThemeChange = () => {},
}) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            onSearch();
        }
    };

    const getSortTypeName = (sortType: string): string => {
        switch (sortType) {
            case "LATEST":
                return "최신순";
            case "OLDEST":
                return "오래된순";
            case "GUILDNAME":
                return "길드 가나다순";
            case "CHARACTERNAME":
                return "캐릭터명순";
            case "WIN_FIRST":
                return "승리 먼저";
            case "LOSE_FIRST":
                return "패배 먼저";
            case "THEME_NAME":
                return "테마명순";
            default:
                return "최신순";
        }
    };

    // 필터 요약 텍스트
    const getFilterSummary = (): string => {
        const filters = [];

        if (winFilter !== null) {
            filters.push(winFilter ? "승리" : "패배");
        }

        if (startDate && endDate) {
            filters.push(
                `${format(startDate, "yy.MM.dd")}~${format(
                    endDate,
                    "yy.MM.dd"
                )}`
            );
        } else if (startDate) {
            filters.push(`${format(startDate, "yy.MM.dd")}부터`);
        } else if (endDate) {
            filters.push(`${format(endDate, "yy.MM.dd")}까지`);
        }

        if (hasTheme !== null) {
            filters.push(hasTheme ? "테마있음" : "테마없음");
        }

        return filters.length > 0 ? filters.join(", ") : "필터";
    };

    // 필터 초기화
    const resetFilters = () => {
        onWinFilterChange(null);
        onDateRangeChange(null, null);
        onHasThemeChange(null);
    };

    // 필터가 적용되었는지 확인
    const hasActiveFilters =
        winFilter !== null ||
        startDate !== null ||
        endDate !== null ||
        hasTheme !== null;

    return (
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between w-full mb-4">
            {/* 왼쪽 여백 - 데스크톱에서만 표시 */}
            <div className="hidden md:block md:w-1/4"></div>

            {/* 검색창 - 중앙 정렬 */}
            <div className="w-full md:w-2/4 mx-auto">
                <div className="relative flex items-center w-full">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="검색어를 입력하세요"
                        className="pl-8 pr-20 h-9 text-sm"
                        value={keyword}
                        onChange={onKeywordChange}
                        onKeyDown={handleKeyDown}
                    />
                    <Button
                        type="button"
                        size="sm"
                        onClick={onSearch}
                        className="absolute right-0 h-9 text-xs px-3 rounded-l-none"
                    >
                        검색
                    </Button>
                </div>
            </div>

            {/* 필터 및 정렬 영역 - 항상 가로 배치 */}
            <div className="flex flex-row justify-end items-center space-x-2 w-full md:w-1/4 md:mr-4">
                {/* 필터 버튼 */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant={hasActiveFilters ? "default" : "outline"}
                            size="sm"
                            className="h-9 flex items-center gap-1 text-xs"
                        >
                            <Filter className="h-3.5 w-3.5" />
                            <span>{getFilterSummary()}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[240px]">
                        {/* 승패 필터 */}
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <span>승패 필터</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuCheckboxItem
                                        checked={winFilter === true}
                                        onCheckedChange={() =>
                                            onWinFilterChange(
                                                winFilter === true ? null : true
                                            )
                                        }
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                        <span>승리</span>
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={winFilter === false}
                                        onCheckedChange={() =>
                                            onWinFilterChange(
                                                winFilter === false
                                                    ? null
                                                    : false
                                            )
                                        }
                                    >
                                        <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                        <span>패배</span>
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        {/* 날짜 범위 */}
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <span>날짜 범위</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="p-2">
                                    <div className="flex flex-col space-y-2">
                                        <div className="text-xs font-medium">
                                            시작일
                                        </div>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left text-xs h-8"
                                                >
                                                    <Calendar className="mr-2 h-3.5 w-3.5" />
                                                    {startDate
                                                        ? format(
                                                              startDate,
                                                              "PPP",
                                                              { locale: ko }
                                                          )
                                                        : "선택하세요"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={
                                                        startDate || undefined
                                                    }
                                                    onSelect={(date) =>
                                                        onDateRangeChange(
                                                            date,
                                                            endDate
                                                        )
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <div className="text-xs font-medium">
                                            종료일
                                        </div>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left text-xs h-8"
                                                >
                                                    <Calendar className="mr-2 h-3.5 w-3.5" />
                                                    {endDate
                                                        ? format(
                                                              endDate,
                                                              "PPP",
                                                              { locale: ko }
                                                          )
                                                        : "선택하세요"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={
                                                        endDate || undefined
                                                    }
                                                    onSelect={(date) =>
                                                        onDateRangeChange(
                                                            startDate,
                                                            date
                                                        )
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        {/* 테마 유무 필터 */}
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <span>테마 유무</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuCheckboxItem
                                        checked={hasTheme === true}
                                        onCheckedChange={() =>
                                            onHasThemeChange(
                                                hasTheme === true ? null : true
                                            )
                                        }
                                    >
                                        <span>테마 있음</span>
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={hasTheme === false}
                                        onCheckedChange={() =>
                                            onHasThemeChange(
                                                hasTheme === false
                                                    ? null
                                                    : false
                                            )
                                        }
                                    >
                                        <span>테마 없음</span>
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />

                        {/* 필터 초기화 */}
                        <DropdownMenuItem
                            disabled={!hasActiveFilters}
                            onClick={resetFilters}
                            className="justify-center text-sm font-medium"
                        >
                            필터 초기화
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* 정렬 드롭다운 */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 flex items-center gap-1 text-xs"
                        >
                            <SortAsc className="h-3.5 w-3.5" />
                            <span>{getSortTypeName(sortType)}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuRadioGroup
                            value={sortType}
                            onValueChange={onSortChange}
                        >
                            <DropdownMenuRadioItem
                                value="LATEST"
                                className="text-xs"
                            >
                                최신순
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                                value="OLDEST"
                                className="text-xs"
                            >
                                오래된순
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                                value="GUILDNAME"
                                className="text-xs"
                            >
                                길드 가나다순
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                                value="CHARACTERNAME"
                                className="text-xs"
                            >
                                캐릭터명순
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                                value="WIN_FIRST"
                                className="text-xs"
                            >
                                승리 먼저
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                                value="LOSE_FIRST"
                                className="text-xs"
                            >
                                패배 먼저
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                                value="THEME_NAME"
                                className="text-xs"
                            >
                                테마명순
                            </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default GameHistoryFilter;
