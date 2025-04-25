import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { themesService } from "@/api/themesService";
import { Theme } from "@/lib/types";
import ThemeCard from "@/components/themes/ThemeCard";
import PageTransition from "@/components/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const LIMIT = 9;

const ThemeList: React.FC = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const [page, setPage] = useState(0); // 🔥 현재 페이지

  const validCategory = category?.toUpperCase() as Theme["type"];

  const {
    data: themes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["themes", validCategory, page],
    queryFn: () => themesService.getThemes(validCategory, LIMIT, page),
    enabled: !!validCategory,
  });

  // 에러: 유효하지 않은 카테고리
  if (!category || !["CRIMESCENE", "ESCAPE_ROOM", "MURDER_MYSTERY", "REALWORLD"].includes(validCategory)) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">잘못된 카테고리입니다.</h1>
        </div>
      </PageTransition>
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-20">
          <h1 className="text-3xl font-bold text-center mb-10">{validCategory} 테마</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  // 에러 발생
  if (error) {
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
          <Button onClick={() => navigate("/themes/new", { state: { category } })}>글쓰기</Button>
        </div>

        {/* 테마 목록 */}
        {themes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {themes.map((theme, i) => (
              <ThemeCard key={theme.id} theme={theme} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">등록된 테마가 없습니다.</p>
          </div>
        )}

        {/* 페이지네이션 */}
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1}</span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={themes.length < LIMIT} // 마지막 페이지로 추정
          >
            다음
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default ThemeList;