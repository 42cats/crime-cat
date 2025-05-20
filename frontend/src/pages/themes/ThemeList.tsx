import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { themesService } from "@/api/themesService";
import { Theme, ThemePage } from "@/lib/types";
import ThemeCard from "@/components/themes/ThemeCard";
import PageTransition from "@/components/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";

const PAGE_SIZE = 9;

const SORT_OPTIONS = [
  { value: "LATEST", label: "최신 순" },
  { value: "OLDEST", label: "오래된 순" },
  { value: "LIKE", label: "추천 낮은 순" },
  { value: "LIKE_DESC", label: "추천 높은 순" },
  { value: "VIEW", label: "조회수 낮은 순" },
  { value: "VIEW_DESC", label: "조회수 높은 순" },
  { value: "PRICE", label: "가격 낮은 순" },
  { value: "PRICE_DESC", label: "가격 높은 순" },
  { value: "PLAYTIME", label: "시간 낮은 순" },
  { value: "PLAYTIME_DESC", label: "시간 높은 순" },
];

const CATEGORY_LABELS: Record<Theme["type"], string> = {
  CRIMESCENE: "크라임씬 테마",
  ESCAPE_ROOM: "방탈출 테마",
  MURDER_MYSTERY: "머더미스터리 테마",
  REALWORLD: "리얼월드 테마",
};

const ThemeList: React.FC = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const validCategory = category?.toUpperCase() as Theme["type"];
  const page = Number(searchParams.get("page")) || 0;
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [searchInput, setSearchInput] = useState(keyword);
  const [sort, setSort] = useState(searchParams.get("sort") || "LATEST");
  const [hasSearched, setHasSearched] = useState(false);

  const [filters, setFilters] = useState({
    priceMin: searchParams.get("priceMin") || "",
    priceMax: searchParams.get("priceMax") || "",
    playerMin: searchParams.get("playerMin") || "",
    playerMax: searchParams.get("playerMax") || "",
    timeMin: searchParams.get("timeMin") || "",
    timeMax: searchParams.get("timeMax") || "",
    difficultyMin: searchParams.get("difficultyMin") || "",
    difficultyMax: searchParams.get("difficultyMax") || "",
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const validateFilters = () => {
    const pairs: [string, string][] = [
      ["priceMin", "priceMax"],
      ["playerMin", "playerMax"],
      ["timeMin", "timeMax"],
      ["difficultyMin", "difficultyMax"],
    ];

    for (const [minKey, maxKey] of pairs) {
      const min = Number(filters[minKey]);
      const max = Number(filters[maxKey]);

      if (filters[minKey] && min < 1) {
        toast({ description: "최소 값은 1보다 커야 합니다.", variant: "destructive" });
        return false;
      }

      if (filters[maxKey] && max < min) {
        toast({ description: "최대 값은 최소 값보다 크거나 같아야 합니다.", variant: "destructive" });
        return false;
      }

      if ((minKey.includes("difficulty") && min > 5) || (maxKey.includes("difficulty") && max > 5)) {
        toast({ description: "난이도는 1에서 5 사이여야 합니다.", variant: "destructive" });
        return false;
      }
    }

    return true;
  };

  const shouldFetch = !!validCategory && hasSearched;

  const { data, isLoading } = useQuery<ThemePage>({
    queryKey: ["themes", validCategory, page, sort, keyword, filters],
    queryFn: () => themesService.getThemes(validCategory, PAGE_SIZE, page, sort, keyword, filters),
    enabled: shouldFetch,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!hasSearched) handleSearch();
  }, []);

  const handleSearch = () => {
    if (!validateFilters()) return;
    setSearchParams((prev) => {
      prev.set("keyword", searchInput);
      prev.set("sort", sort);
      prev.set("page", "0");
      Object.entries(filters).forEach(([k, v]) => v && prev.set(k, v));
      return prev;
    });
    setKeyword(searchInput);
    setHasSearched(true);
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", newPage.toString());
      return prev;
    });
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">{CATEGORY_LABELS[validCategory]}</h1>
          <p className="text-muted-foreground text-base">다양한 테마를 확인할 수 있습니다.</p>
        </div>

        <Card className="p-4 mb-6 max-w-screen-md mx-auto">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <Label htmlFor="keyword">검색어</Label>
              <div className="flex gap-2">
                <Input
                  id="keyword"
                  placeholder="검색어를 입력하세요"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-9"
                />
                <Button onClick={handleSearch} className="h-9 px-4">검색</Button>
              </div>
            </div>

            <div>
              <Label>인원</Label>
              <div className="flex gap-2">
                <Input type="number" placeholder="최소" className="h-9" value={filters.playerMin} onChange={(e) => handleFilterChange("playerMin", e.target.value)} />
                <Input type="number" placeholder="최대" className="h-9" value={filters.playerMax} onChange={(e) => handleFilterChange("playerMax", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>가격</Label>
              <div className="flex gap-2">
                <Input type="number" placeholder="최소" className="h-9" value={filters.priceMin} onChange={(e) => handleFilterChange("priceMin", e.target.value)} />
                <Input type="number" placeholder="최대" className="h-9" value={filters.priceMax} onChange={(e) => handleFilterChange("priceMax", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>시간</Label>
              <div className="flex gap-2">
                <Input type="number" placeholder="최소" className="h-9" value={filters.timeMin} onChange={(e) => handleFilterChange("timeMin", e.target.value)} />
                <Input type="number" placeholder="최대" className="h-9" value={filters.timeMax} onChange={(e) => handleFilterChange("timeMax", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>난이도</Label>
              <div className="flex gap-2">
                <Input type="number" placeholder="최소" className="h-9" value={filters.difficultyMin} onChange={(e) => handleFilterChange("difficultyMin", e.target.value)} />
                <Input type="number" placeholder="최대" className="h-9" value={filters.difficultyMax} onChange={(e) => handleFilterChange("difficultyMax", e.target.value)} />
              </div>
            </div>

            <div className="col-span-2">
              <Label>정렬</Label>
              <Select value={sort} onValueChange={(val) => setSort(val)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <div className="flex justify-end mx-auto mb-4">
          <Button onClick={() => navigate(`/themes/new`, { state: { category, page } })}>글쓰기</Button>
        </div>

        <Card>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : data?.themes.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {data.themes.map((theme, i) => (
                    <ThemeCard key={theme.id} theme={theme} index={i} />
                  ))}
                </div>

                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button variant="outline" size="sm" disabled={!data.hasPrevious} onClick={() => handlePageChange(Math.max(page - 1, 0))}>이전</Button>
                  {Array.from({ length: data.totalPages }, (_, i) => (
                    <Button key={i} variant={i === page ? "default" : "outline"} size="sm" onClick={() => handlePageChange(i)}>{i + 1}</Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={!data.hasNext} onClick={() => handlePageChange(page + 1)}>다음</Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <p className="text-muted-foreground mb-2">아직 게시글이 없습니다.</p>
                <p className="text-sm text-muted-foreground/70">가장 먼저 글을 작성해보세요.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default ThemeList;
