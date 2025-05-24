import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    SlidersHorizontal,
    X,
    MapPin,
    Tag,
    Gamepad2,
    AlertCircle,
    Star as StarIcon,
} from "lucide-react";
import NumberRangeFilter from "./NumberRangeFilter";
import DifficultyFilter from "./DifficultyFilter";

import { EscapeRoomFilterValues } from "./types";
import { useAuth } from "@/hooks/useAuth";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

interface SortOption {
    value: string;
    label: string;
}

interface EscapeRoomFiltersProps {
    filters: EscapeRoomFilterValues;
    searchInput: string;
    sort: string;
    sortOptions: SortOption[];
    onSearchInputChange: (value: string) => void;
    onFilterChange: (key: string, value: string | string[]) => void;
    onSortChange: (value: string) => void;
    onSearch: () => void;
    onReset: () => void;
}

// 인기 태그 목록
const POPULAR_TAGS = [
    "호러",
    "추리",
    "판타지",
    "SF",
    "어드벤처",
    "코미디",
    "스릴러",
    "액션",
    "미스터리",
    "로맨스",
    "역사",
    "좀비",
    "마법",
    "시간여행",
    "공포",
];

// 인기 지역 목록
const POPULAR_LOCATIONS = [
    "홍대",
    "강남",
    "건대",
    "신촌",
    "잠실",
    "노원",
    "분당",
    "수원",
    "부천",
    "인천",
    "일산",
    "안양",
];

const EscapeRoomFilters: React.FC<EscapeRoomFiltersProps> = ({
    filters,
    searchInput,
    sort,
    sortOptions,
    onSearchInputChange,
    onFilterChange,
    onSortChange,
    onSearch,
    onReset,
}) => {
    const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);
    const [tagInput, setTagInput] = useState("");
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") onSearch();
    };

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !filters.selectedTags.includes(trimmed)) {
            onFilterChange("selectedTags", [...filters.selectedTags, trimmed]);
            setTagInput("");
        }
    };
    const removeTag = (tag: string) => {
        onFilterChange(
            "selectedTags",
            filters.selectedTags.filter((t) => t !== tag)
        );
    };
    const addTagFromInput = () => addTag(tagInput);

    return (
        <Card className="mb-6 overflow-hidden">
            <div className="p-4 md:p-5">
                {/* 검색창 */}
                <div className="mb-4">
                    <div className="relative">
                        <Input
                            placeholder="테마명, 매장명으로 검색하세요"
                            value={searchInput}
                            onChange={(e) =>
                                onSearchInputChange(e.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            className="pr-16 h-12 text-base"
                        />
                        <Button
                            onClick={onSearch}
                            size="sm"
                            className="absolute right-1 top-1 bottom-1 h-10"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            검색
                        </Button>
                    </div>
                </div>

                {/* 선택된 태그 표시 */}
                {filters.selectedTags.length > 0 && (
                    <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                선택된 태그
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {filters.selectedTags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => removeTag(tag)}
                                >
                                    {tag}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* 상세 필터 토글 & 정렬/초기화 */}
                <div className="flex items-center justify-between border-t pt-3">
                    <Button
                        variant="ghost"
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                        className="text-sm flex items-center gap-1"
                    >
                        <SlidersHorizontal className="h-4 w-4 mr-1" />
                        상세 필터 {filtersExpanded ? "접기" : "펼치기"}
                    </Button>
                    <div className="flex items-center gap-2">
                        <Select value={sort} onValueChange={onSortChange}>
                            <SelectTrigger className="w-[140px] h-9">
                                <SelectValue placeholder="정렬 기준" />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onReset}
                            className="h-9"
                        >
                            <X className="h-4 w-4 mr-1" />
                            초기화
                        </Button>
                    </div>
                </div>

                {/* 상세 필터 내용 */}
                {filtersExpanded && (
                    <div className="mt-4 space-y-6 border-t pt-4 animate-in fade-in duration-200">
                        {/* 기본 정보 필터 */}
                        <div>
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                기본 정보
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <NumberRangeFilter
                                    label="인원"
                                    minValue={filters.playerMin}
                                    maxValue={filters.playerMax}
                                    onMinChange={(v) =>
                                        onFilterChange("playerMin", v)
                                    }
                                    onMaxChange={(v) =>
                                        onFilterChange("playerMax", v)
                                    }
                                    minPlaceholder="최소 인원"
                                    maxPlaceholder="최대 인원"
                                />
                                <NumberRangeFilter
                                    label="가격"
                                    minValue={filters.priceMin}
                                    maxValue={filters.priceMax}
                                    onMinChange={(v) =>
                                        onFilterChange("priceMin", v)
                                    }
                                    onMaxChange={(v) =>
                                        onFilterChange("priceMax", v)
                                    }
                                    minPlaceholder="최소 가격"
                                    maxPlaceholder="최대 가격"
                                    unit="원"
                                />
                                <NumberRangeFilter
                                    label="플레이타임"
                                    minValue={filters.playtimeMin}
                                    maxValue={filters.playtimeMax}
                                    onMinChange={(v) =>
                                        onFilterChange("playtimeMin", v)
                                    }
                                    onMaxChange={(v) =>
                                        onFilterChange("playtimeMax", v)
                                    }
                                    minPlaceholder="최소 시간"
                                    maxPlaceholder="최대 시간"
                                    unit="분"
                                />
                                <DifficultyFilter
                                    filterLabel="난이도"
                                    minValue={filters.difficultyMin}
                                    maxValue={filters.difficultyMax}
                                    onMinChange={(v) =>
                                        onFilterChange("difficultyMin", v)
                                    }
                                    onMaxChange={(v) =>
                                        onFilterChange("difficultyMax", v)
                                    }
                                />
                            </div>
                        </div>

                        {/* 방탈출 전용 필터 */}
                        <div>
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                <StarIcon className="w-4 h-4" />
                                테마 특성
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                                <DifficultyFilter
                                    filterLabel="공포"
                                    minValue={filters.horrorMin}
                                    maxValue={filters.horrorMax}
                                    onMinChange={(v) =>
                                        onFilterChange("horrorMin", v)
                                    }
                                    onMaxChange={(v) =>
                                        onFilterChange("horrorMax", v)
                                    }
                                />
                                <DifficultyFilter
                                    filterLabel="장치"
                                    minValue={filters.deviceMin}
                                    maxValue={filters.deviceMax}
                                    onMinChange={(v) =>
                                        onFilterChange("deviceMin", v)
                                    }
                                    onMaxChange={(v) =>
                                        onFilterChange("deviceMax", v)
                                    }
                                />
                                <DifficultyFilter
                                    filterLabel="활동"
                                    minValue={filters.activityMin}
                                    maxValue={filters.activityMax}
                                    onMinChange={(v) =>
                                        onFilterChange("activityMin", v)
                                    }
                                    onMaxChange={(v) =>
                                        onFilterChange("activityMax", v)
                                    }
                                />
                            </div>
                        </div>

                        {/* 플레이 여부 필터 */}
                        <div>
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                <Gamepad2 className="w-4 h-4" />
                                플레이 여부
                            </h3>
                            <div className="space-y-2">
                                <Select
                                    value={filters.hasPlayed || "all"}
                                    onValueChange={(val) => {
                                        if (val !== "all" && !isAuthenticated) {
                                            setShowLoginDialog(true);
                                            return;
                                        }
                                        onFilterChange("hasPlayed", val);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="플레이 여부 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            <div className="flex items-center gap-2">
                                                <Gamepad2 className="w-4 h-4" />{" "}
                                                전체
                                            </div>
                                        </SelectItem>
                                        <SelectItem
                                            value="true"
                                            disabled={!isAuthenticated}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Gamepad2 className="w-4 h-4 text-green-600" />{" "}
                                                플레이함
                                                {!isAuthenticated && (
                                                    <AlertCircle className="w-3 h-3 text-yellow-500 ml-1" />
                                                )}
                                            </div>
                                        </SelectItem>
                                        <SelectItem
                                            value="false"
                                            disabled={!isAuthenticated}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Gamepad2 className="w-4 h-4 text-gray-400" />{" "}
                                                플레이 안함
                                                {!isAuthenticated && (
                                                    <AlertCircle className="w-3 h-3 text-yellow-500 ml-1" />
                                                )}
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {!isAuthenticated && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        플레이 여부 필터는 로그인이 필요합니다.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 운영 상태 및 지역 */}
                        <div>
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                위치 및 운영
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">
                                        운영 상태
                                    </Label>
                                    <Select
                                        value={filters.isOperating}
                                        onValueChange={(val) =>
                                            onFilterChange("isOperating", val)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="운영 상태 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                전체
                                            </SelectItem>
                                            <SelectItem value="operating">
                                                운영중
                                            </SelectItem>
                                            <SelectItem value="closed">
                                                운영중단
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">
                                        지역
                                    </Label>
                                    <Input
                                        placeholder="지역명 입력 (예: 홍대, 강남)"
                                        value={filters.location}
                                        onChange={(e) =>
                                            onFilterChange(
                                                "location",
                                                e.target.value
                                            )
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        지역명은 키워드 검색에 포함되어 매장
                                        주소를 검색합니다.
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {POPULAR_LOCATIONS.slice(0, 6).map(
                                            (loc) => (
                                                <Badge
                                                    key={loc}
                                                    variant="outline"
                                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                                                    onClick={() =>
                                                        onFilterChange(
                                                            "location",
                                                            loc
                                                        )
                                                    }
                                                >
                                                    {loc}
                                                </Badge>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 태그 입력 */}
                        <div>
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                <Tag className="w-4 h-4" /> 태그
                            </h3>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="태그 입력"
                                        value={tagInput}
                                        onChange={(e) =>
                                            setTagInput(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addTagFromInput();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        onClick={addTagFromInput}
                                        size="sm"
                                        disabled={!tagInput.trim()}
                                    >
                                        추가
                                    </Button>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        인기 태그:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {POPULAR_TAGS.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant={
                                                    filters.selectedTags.includes(
                                                        tag
                                                    )
                                                        ? "default"
                                                        : "outline"
                                                }
                                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                                onClick={() =>
                                                    filters.selectedTags.includes(
                                                        tag
                                                    )
                                                        ? removeTag(tag)
                                                        : addTag(tag)
                                                }
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 로그인 요청 다이얼로그 */}
                <AlertDialog
                    open={showLoginDialog}
                    onOpenChange={setShowLoginDialog}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                로그인이 필요합니다
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                플레이 여부 필터를 사용하려면 로그인이
                                필요합니다. 로그인 하시겠습니까?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => navigate("/login")}
                            >
                                로그인 하러 가기
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </Card>
    );
};

export default EscapeRoomFilters;
