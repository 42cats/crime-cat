import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import EscapeRoomSearchHeader from "@/components/escape-room/list/EscapeRoomSearchHeader";
import EscapeRoomThemeGrid from "@/components/escape-room/list/EscapeRoomThemeGrid";
import { EscapeRoomTheme, ThemePage } from "@/lib/types";
import { themesService } from "@/api/content";
import { useToast } from "@/hooks/useToast";

interface SearchFilters {
    query: string;
    difficulty: number[];
    priceRange: [number, number];
    participantRange: [number, number];
    durationRange: [number, number];
    tags: string[];
    location: string;
    sortBy:
        | "newest"
        | "oldest"
        | "popularity"
        | "rating"
        | "price_low"
        | "price_high";
}

const EscapeRoomListPage: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [themes, setThemes] = useState<EscapeRoomTheme[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [canCreateTheme, setCanCreateTheme] = useState(false);

    const pageSize = 9;

    const [filters, setFilters] = useState<SearchFilters>({
        query: "",
        difficulty: [],
        priceRange: [0, 100000],
        participantRange: [1, 20],
        durationRange: [15, 180],
        tags: [],
        location: "",
        sortBy: "newest",
    });

    const fetchThemes = async () => {
        setIsLoading(true);
        try {
            // 필터 파라미터 변환
            const filterParams: any = {};

            // 기본 범위 필터
            if (filters.priceRange[0] > 0)
                filterParams.priceMin = filters.priceRange[0].toString();
            if (filters.priceRange[1] < 100000)
                filterParams.priceMax = filters.priceRange[1].toString();
            if (filters.participantRange[0] > 1)
                filterParams.playerMin = filters.participantRange[0].toString();
            if (filters.participantRange[1] < 20)
                filterParams.playerMax = filters.participantRange[1].toString();
            if (filters.durationRange[0] > 15)
                filterParams.playtimeMin = filters.durationRange[0].toString();
            if (filters.durationRange[1] < 180)
                filterParams.playtimeMax = filters.durationRange[1].toString();

            // 난이도 필터
            if (filters.difficulty.length > 0) {
                filterParams.difficultyMin = Math.min(
                    ...filters.difficulty
                ).toString();
                filterParams.difficultyMax = Math.max(
                    ...filters.difficulty
                ).toString();
            }

            // 지역 검색은 keyword로 처리
            const keyword = filters.location || filters.query;

            const response = await themesService.getEscapeRoomThemes({
                type: "ESCAPE_ROOM",
                page: currentPage - 1,
                size: pageSize,
                sort: filters.sortBy,
                keyword: keyword,
                filters: filterParams,
            });
            console.log(response);
            if (response && response.themes) {
                // API 응답에서 ESCAPE_ROOM 타입만 필터링
                const escapeRoomThemes = response.themes.filter(
                    (theme): theme is EscapeRoomTheme =>
                        theme.type === "ESCAPE_ROOM"
                );

                setThemes(escapeRoomThemes);
                setTotalPages(response.totalPages);
                setTotalCount(response.totalElements);
            }
        } catch (error) {
            console.error("Failed to fetch themes:", error);
            toast({
                title: "오류",
                description: "테마 목록을 불러오는데 실패했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchThemes();
    }, [currentPage, filters]);

    const handleFiltersChange = (newFilters: SearchFilters) => {
        setFilters(newFilters);
        setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
    };

    const handleCreateTheme = () => {
        navigate("/escape-room/create");
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* 검색 헤더 */}
            <EscapeRoomSearchHeader
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onCreateTheme={handleCreateTheme}
                canCreateTheme={canCreateTheme}
                totalCount={totalCount}
                isLoading={isLoading}
            />
            {/* 테마 그리드 */}
            <div className="mt-8">
                <EscapeRoomThemeGrid
                    themes={themes}
                    isLoading={isLoading}
                    pageSize={pageSize}
                    onCreateTheme={handleCreateTheme}
                    canCreateTheme={canCreateTheme}
                />
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && !isLoading && (
                <div className="mt-12 flex justify-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        showFirstLast
                        showPrevNext
                    />
                </div>
            )}

            {/* 하단 안내 */}
            {!isLoading && themes.length > 0 && (
                <div className="mt-16 text-center text-sm text-muted-foreground">
                    <p>더 많은 방탈출 테마를 찾고 계신가요?</p>
                    <p className="mt-1">
                        새로운 테마들이 계속 추가되고 있습니다!
                    </p>
                </div>
            )}
        </div>
    );
};

export default EscapeRoomListPage;
