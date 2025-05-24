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
import { Search, SlidersHorizontal, X, MapPin, Tag, Star } from "lucide-react";
import NumberRangeFilter from "./NumberRangeFilter";
import DifficultyFilter from "./DifficultyFilter";

import { EscapeRoomFilterValues } from "./types";

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
  "호러", "추리", "판타지", "SF", "어드벤처", 
  "코미디", "스릴러", "액션", "미스터리", "로맨스",
  "역사", "좀비", "마법", "시간여행", "공포"
];

// 인기 지역 목록
const POPULAR_LOCATIONS = [
  "홍대", "강남", "건대", "신촌", "잠실", "노원", 
  "분당", "수원", "부천", "인천", "일산", "안양"
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !filters.selectedTags.includes(trimmedTag)) {
      onFilterChange("selectedTags", [...filters.selectedTags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    onFilterChange("selectedTags", filters.selectedTags.filter(t => t !== tag));
  };

  const addTagFromInput = () => {
    addTag(tagInput);
  };

  // 별점 표시 컴포넌트 (1-10을 별 5개로 표시)
  const RatingDisplay: React.FC<{ value: number; label: string }> = ({ value, label }) => {
    const stars = Math.floor(value / 2);
    const hasHalf = value % 2 === 1;
    
    return (
      <div className="flex items-center gap-1 text-xs">
        <span className="text-muted-foreground">{label}:</span>
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < stars
                  ? "text-yellow-400 fill-yellow-400"
                  : i === stars && hasHalf
                  ? "text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-muted-foreground">({value}/10)</span>
      </div>
    );
  };
  
  // 별점 범위 필터 컴포넌트
  const StarRangeFilter: React.FC<{
    label: string;
    minValue: string;
    maxValue: string;
    onMinChange: (value: string) => void;
    onMaxChange: (value: string) => void;
  }> = ({ label, minValue, maxValue, onMinChange, onMaxChange }) => {
    return (
      <div>
        <Label className="text-sm font-medium mb-2 block">{label}</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-8">최소:</span>
            <div className="flex gap-1">
              {[...Array(10)].map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onMinChange(String(i + 1))}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-4 h-4 ${
                      Number(minValue) > i
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-1">
              {minValue || "0"}/10
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-8">최대:</span>
            <div className="flex gap-1">
              {[...Array(10)].map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onMaxChange(String(i + 1))}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-4 h-4 ${
                      Number(maxValue) > i
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-1">
              {maxValue || "0"}/10
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="p-4 md:p-5">
        {/* 검색창 영역 */}
        <div className="mb-4">
          <div className="relative">
            <Input
              placeholder="테마명, 매장명으로 검색하세요"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-16 h-12 text-base"
            />
            <Button
              onClick={onSearch}
              size="sm"
              className="absolute right-1 top-1 bottom-1 h-10"
            >
              <Search className="h-4 w-4 mr-2" />
              <span>검색</span>
            </Button>
          </div>
        </div>

        {/* 빠른 필터 - 태그 */}
        {filters.selectedTags.length > 0 && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">선택된 태그</span>
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

        {/* 필터 영역 토글 버튼 */}
        <div className="flex items-center justify-between border-t pt-3">
          <Button
            variant="ghost"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="text-sm flex items-center gap-1"
          >
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            상세 필터
            {filtersExpanded ? " 접기" : " 펼치기"}
          </Button>

          <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={onSortChange}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="정렬 기준" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
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

        {/* 확장된 필터 영역 */}
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
                  onMinChange={(value) => onFilterChange("playerMin", value)}
                  onMaxChange={(value) => onFilterChange("playerMax", value)}
                  minPlaceholder="최소 인원"
                  maxPlaceholder="최대 인원"
                />

                <NumberRangeFilter
                  label="가격"
                  minValue={filters.priceMin}
                  maxValue={filters.priceMax}
                  onMinChange={(value) => onFilterChange("priceMin", value)}
                  onMaxChange={(value) => onFilterChange("priceMax", value)}
                  minPlaceholder="최소 가격"
                  maxPlaceholder="최대 가격"
                  unit="원"
                />

                <NumberRangeFilter
                  label="플레이타임"
                  minValue={filters.playtimeMin}
                  maxValue={filters.playtimeMax}
                  onMinChange={(value) => onFilterChange("playtimeMin", value)}
                  onMaxChange={(value) => onFilterChange("playtimeMax", value)}
                  minPlaceholder="최소 시간"
                  maxPlaceholder="최대 시간"
                  unit="분"
                />

                <DifficultyFilter
                  minValue={filters.difficultyMin}
                  maxValue={filters.difficultyMax}
                  onMinChange={(value) => onFilterChange("difficultyMin", value)}
                  onMaxChange={(value) => onFilterChange("difficultyMax", value)}
                />
              </div>
            </div>

            {/* 방탈출 전용 필터 */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Star className="w-4 h-4" />
                테마 특성
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <StarRangeFilter
                  label="공포도"
                  minValue={filters.horrorMin}
                  maxValue={filters.horrorMax}
                  onMinChange={(value) => onFilterChange("horrorMin", value)}
                  onMaxChange={(value) => onFilterChange("horrorMax", value)}
                />

                <StarRangeFilter
                  label="장치 비중"
                  minValue={filters.deviceMin}
                  maxValue={filters.deviceMax}
                  onMinChange={(value) => onFilterChange("deviceMin", value)}
                  onMaxChange={(value) => onFilterChange("deviceMax", value)}
                />

                <StarRangeFilter
                  label="활동성"
                  minValue={filters.activityMin}
                  maxValue={filters.activityMax}
                  onMinChange={(value) => onFilterChange("activityMin", value)}
                  onMaxChange={(value) => onFilterChange("activityMax", value)}
                />
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
                  <Label className="text-sm font-medium mb-2 block">운영 상태</Label>
                  <Select 
                    value={filters.isOperating} 
                    onValueChange={(value) => onFilterChange("isOperating", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="운영 상태 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="operating">운영중</SelectItem>
                      <SelectItem value="closed">운영중단</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">지역</Label>
                  <Input
                    placeholder="지역명 입력 (예: 홍대, 강남)"
                    value={filters.location}
                    onChange={(e) => onFilterChange("location", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    지역명은 키워드 검색에 포함되어 매장 주소를 검색합니다.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {POPULAR_LOCATIONS.slice(0, 6).map((location) => (
                      <Badge
                        key={location}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                        onClick={() => onFilterChange("location", location)}
                      >
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 태그 */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                태그
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="태그 입력"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
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
                  <p className="text-sm text-muted-foreground mb-2">인기 태그:</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_TAGS.map((tag) => (
                      <Badge
                        key={tag}
                        variant={filters.selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => 
                          filters.selectedTags.includes(tag) 
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
      </div>
    </Card>
  );
};

export default EscapeRoomFilters;