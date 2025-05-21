import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { FilterValues } from "./types";
import NumberRangeFilter from "./NumberRangeFilter";
import DifficultyFilter from "./DifficultyFilter";

interface SortOption {
  value: string;
  label: string;
}

interface ThemeFiltersProps {
  filters: FilterValues;
  searchInput: string;
  sort: string;
  sortOptions: SortOption[];
  onSearchInputChange: (value: string) => void;
  onFilterChange: (key: keyof FilterValues, value: string) => void;
  onSortChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

const ThemeFilters: React.FC<ThemeFiltersProps> = ({
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="p-4 md:p-5">
        {/* 검색창 영역 */}
        <div className="mb-4">
          <div className="relative">
            <Input
              placeholder="테마 이름, 키워드로 검색하세요"
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
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 animate-in fade-in duration-200">
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
        )}
      </div>
    </Card>
  );
};

export default ThemeFilters;
