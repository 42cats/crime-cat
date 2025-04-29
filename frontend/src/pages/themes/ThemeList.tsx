import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { themesService } from "@/api/themesService";
import { Theme, ThemePage } from "@/lib/types";
import ThemeCard from "@/components/themes/ThemeCard";
import PageTransition from "@/components/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 9;

const ThemeList: React.FC = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 0; // 쿼리스트링에서 읽기

  const validCategory = category?.toUpperCase() as Theme["type"];

  const { data, isLoading, error } = useQuery<ThemePage>({
    queryKey: ["themes", validCategory, page],
    queryFn: () => themesService.getThemes(validCategory, PAGE_SIZE, page),
    enabled: !!validCategory,
    keepPreviousData: true,
  });

  const goToPage = (pageNum: number) => {
    navigate(`/themes/${category}?page=${pageNum}`);
  };

  const renderPagination = () => {
    if (!data) return null;
    const { totalPages } = data;
    const start = Math.max(0, page - 2);
    const end = Math.min(totalPages, start + 5);
    const pages = Array.from({ length: end - start }, (_, i) => start + i);

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          disabled={!data.hasPrevious}
          onClick={() => goToPage(Math.max(page - 1, 0))}
        >
          이전
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            onClick={() => goToPage(p)}
          >
            {p + 1}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={!data.hasNext}
          onClick={() => goToPage(page + 1)}
        >
          다음
        </Button>
      </div>
    );
  };

  if (!category || !["CRIMESCENE", "ESCAPE_ROOM", "MURDER_MYSTERY", "REALWORLD"].includes(validCategory)) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">잘못된 카테고리입니다.</h1>
        </div>
      </PageTransition>
    );
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-20">
          <h1 className="text-3xl font-bold text-center mb-10">{validCategory} 테마</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !data) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">테마를 불러오지 못했습니다.</h1>
          <p className="text-muted-foreground">잠시 후 다시 시도해주세요.</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-6 py-20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{validCategory} 테마</h1>
          <Button onClick={() => navigate("/themes/new", { state: { category, page } })}>글쓰기</Button>
        </div>

        {/* 테마 목록 */}
        {data.themes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {data.themes.map((theme, i) => (
              <ThemeCard key={theme.id} theme={theme} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">등록된 테마가 없습니다.</p>
          </div>
        )}

        {/* 페이지네이션 */}
        {renderPagination()}
      </div>
    </PageTransition>
  );
};

export default ThemeList;