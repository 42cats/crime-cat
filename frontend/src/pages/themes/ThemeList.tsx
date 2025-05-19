import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { themesService } from "@/api/themesService";
import { Theme, ThemePage } from "@/lib/types";
import ThemeCard from "@/components/themes/ThemeCard";
import PageTransition from "@/components/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Check, Search, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const PAGE_SIZE = 9;

const CATEGORY_LABELS: Record<Theme["type"], string> = {
  CRIMESCENE: "크라임씬 테마",
  ESCAPE_ROOM: "방탈출 테마",
  MURDER_MYSTERY: "머더미스터리 테마",
  REALWORLD: "리얼월드 테마",
};

const SORT_OPTIONS = [
  { value: "LATEST", label: "최신순" },
  { value: "LIKE", label: "추천순" },
  { value: "VIEW", label: "조회수순" },
  { value: "PRICE", label: "가격순" },
  { value: "PLAYER", label: "인원순" },
  { value: "PLAYTIME", label: "플레이타임순" },
];

const ThemeList: React.FC = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const validCategory = category?.toUpperCase() as Theme["type"];
  const page = Number(searchParams.get("page")) || 0;
  const sort = searchParams.get("sort") || "LATEST";
  const keyword = searchParams.get("keyword") || "";

  const [searchInput, setSearchInput] = useState(keyword);

  const { data, isLoading, error } = useQuery<ThemePage>({
    queryKey: ["themes", validCategory, page, sort, keyword],
    queryFn: () =>
      themesService.getThemes(validCategory, PAGE_SIZE, page, sort, keyword),
    enabled: !!validCategory,
    placeholderData: (prev) => prev,
  });

  const handleSearch = () => {
    setSearchParams((prev) => {
      prev.set("keyword", searchInput);
      prev.set("page", "0");
      return prev;
    });
  };

  const handleSortChange = (val: string) => {
    setSearchParams((prev) => {
      prev.set("sort", val);
      prev.set("page", "0");
      return prev;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", newPage.toString());
      return prev;
    });
  };

  if (!validCategory || !CATEGORY_LABELS[validCategory]) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">잘못된 카테고리입니다.</h1>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">{CATEGORY_LABELS[validCategory]}</h1>
          <p className="text-muted-foreground mt-1">다양한 테마를 확인할 수 있습니다.</p>
        </div>

        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="p-4 pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
                  <div className="flex w-full sm:w-auto gap-2 items-center">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        className="pl-10"
                        placeholder="검색어를 입력하세요"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                    <Button onClick={handleSearch} className="shrink-0">
                      검색
                    </Button>
                  </div>

                 <Popover>
                   <PopoverTrigger asChild>
                     <Button variant="outline" className="w-full sm:w-auto">
                       <Filter className="w-4 h-4 mr-2" />
                      {SORT_OPTIONS.find((s) => s.value === sort)?.label || "정렬"}
                       <ChevronDown className="ml-2 w-4 h-4" />
                    </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-40 p-1">
                     {SORT_OPTIONS.map((option) => (
                       <Button
                         key={option.value}
                         variant="ghost"
                         className="w-full justify-start text-left text-sm"
                         onClick={() => handleSortChange(option.value)}
                       >
                         {option.value === sort && <Check className="mr-1 w-4 h-4" />}
                         {option.label}
                       </Button>
                     ))}
                   </PopoverContent>
                 </Popover>
               </div>

               <div className="w-full sm:w-auto">
                 <Button className="w-full sm:w-auto" onClick={() => navigate(`/themes/new`, { state: { category, page } })}>
                   글쓰기
                 </Button>
               </div>
             </div>
          </CardHeader>

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
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!data.hasPrevious}
                    onClick={() => handlePageChange(Math.max(page - 1, 0))}
                  >
                    이전
                  </Button>
                  {Array.from({ length: data.totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={i === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(i)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!data.hasNext}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    다음
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-muted-foreground/50 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
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