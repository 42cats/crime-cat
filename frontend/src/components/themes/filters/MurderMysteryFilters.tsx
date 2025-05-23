import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";
import { FilterValues } from "./types";

interface MurderMysteryFiltersProps {
  filters: FilterValues;
  searchInput: string;
  sort: string;
  sortOptions: { value: string; label: string }[];
  onSearchInputChange: (value: string) => void;
  onFilterChange: (key: keyof FilterValues, value: string) => void;
  onSortChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

const MurderMysteryFilters: React.FC<MurderMysteryFiltersProps> = ({
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
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">머더미스터리 검색 및 필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 검색 */}
        <div className="space-y-2">
          <Label htmlFor="search">테마 검색</Label>
          <div className="flex gap-2">
            <Input
              id="search"
              placeholder="테마 이름, 설명 검색..."
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
            />
            <Button onClick={onSearch} className="gap-2">
              <Search className="h-4 w-4" />
              검색
            </Button>
          </div>
        </div>

        {/* 정렬 */}
        <div className="space-y-2">
          <Label>정렬 기준</Label>
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 기본 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 가격 범위 */}
          <div className="space-y-2">
            <Label>가격 범위 (원)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="최소"
                type="number"
                value={filters.priceMin}
                onChange={(e) => onFilterChange("priceMin", e.target.value)}
              />
              <Input
                placeholder="최대"
                type="number"
                value={filters.priceMax}
                onChange={(e) => onFilterChange("priceMax", e.target.value)}
              />
            </div>
          </div>

          {/* 인원 범위 */}
          <div className="space-y-2">
            <Label>참여 인원</Label>
            <div className="flex gap-2">
              <Input
                placeholder="최소"
                type="number"
                value={filters.playerMin}
                onChange={(e) => onFilterChange("playerMin", e.target.value)}
              />
              <Input
                placeholder="최대"
                type="number"
                value={filters.playerMax}
                onChange={(e) => onFilterChange("playerMax", e.target.value)}
              />
            </div>
          </div>

          {/* 플레이 시간 */}
          <div className="space-y-2">
            <Label>플레이 시간 (분)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="최소"
                type="number"
                value={filters.playtimeMin}
                onChange={(e) => onFilterChange("playtimeMin", e.target.value)}
              />
              <Input
                placeholder="최대"
                type="number"
                value={filters.playtimeMax}
                onChange={(e) => onFilterChange("playtimeMax", e.target.value)}
              />
            </div>
          </div>

          {/* 난이도 */}
          <div className="space-y-2">
            <Label>난이도 (1-5)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="최소"
                type="number"
                min="1"
                max="5"
                value={filters.difficultyMin}
                onChange={(e) => onFilterChange("difficultyMin", e.target.value)}
              />
              <Input
                placeholder="최대"
                type="number"
                min="1"
                max="5"
                value={filters.difficultyMax}
                onChange={(e) => onFilterChange("difficultyMax", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 필터 초기화 */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            필터 초기화
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MurderMysteryFilters;