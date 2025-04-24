import React, { useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import PageTransition from "@/components/PageTransition";
import ThemeCard from "@/components/themes/ThemeCard";
import { Input } from "@/components/ui/input";
import { Search, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { themesService } from "@/api/themesService";
import { Skeleton } from "@/components/ui/skeleton";
import type { Theme } from "@/lib/types";

/**
 * "3"    => [3, 3]
 * "3~4"  => [3, 4]
 * " 10 " => [10, 10] (앞뒤 공백 무시)
 * 범위 파싱이 불가능하면 null 반환
 */
function parseRange(str: string): [number, number] | null {
    const trimmed = str.trim();
    if (!trimmed) return null;

    if (trimmed.includes("~")) {
        const [startStr, endStr] = trimmed.split("~");
        const start = Number(startStr);
        const end = Number(endStr);
        if (isNaN(start) || isNaN(end)) return null;
        return [Math.min(start, end), Math.max(start, end)];
    } else {
        const val = Number(trimmed);
        if (isNaN(val)) return null;
        return [val, val];
    }
}

/** 두 범위 [a1,a2], [b1,b2]가 겹치는지 확인 */
function hasOverlap(
    rangeA: [number, number],
    rangeB: [number, number]
): boolean {
    // rangeA[0] ~ rangeA[1]와 rangeB[0] ~ rangeB[1] 사이에 공통구간이 있으면 true
    return rangeA[0] <= rangeB[1] && rangeB[0] <= rangeA[1];
}

type SortOption = "none" | "recDesc" | "recAsc";

const Themes: React.FC = () => {

    const navigate = useNavigate();

    // 검색/필터 상태
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // 추가 필터 상태(인원수·제작자·가격 범위)
    const [playerFilter, setPlayerFilter] = useState(""); // 예: "3", "3~4"
    const [makerFilter, setMakerFilter] = useState(""); // 예: "테서랙트"
    const [minPrice, setMinPrice] = useState<number | "">("");
    const [maxPrice, setMaxPrice] = useState<number | "">("");
    const [freeOnly, setFreeOnly] = useState(false);

    // 정렬 상태 (추천수)
    const [sortOption, setSortOption] = useState<SortOption>("none");

    // 테마 불러오기
    const {
        data: themes,
        isLoading,
        error,
    } = useQuery<Theme[]>({
        queryKey: ["themes"],
        queryFn: themesService.getThemes,
    });

    // 전체 태그 목록(중복 제거, 정렬)
    const allTags = useMemo(() => {
        if (!themes) return [];
        return Array.from(
            new Set(themes.flatMap((theme) => theme.tags || []))
        ).sort();
    }, [themes]);

    // 필터된 결과
    const filteredThemes = useMemo(() => {
        if (!themes) return [];

        return themes.filter((theme) => {
            // (1) 검색어(제목 + 설명)
            const lowerTitle = theme.title.toLowerCase();
            const lowerDesc = theme.description.toLowerCase();
            const lowerSearch = searchQuery.toLowerCase();
            const matchesSearch =
                lowerTitle.includes(lowerSearch) ||
                lowerDesc.includes(lowerSearch);

            // (2) 태그 필터
            const matchesTag = selectedTag
                ? theme.tags?.includes(selectedTag)
                : true;

            // (3) 인원수 필터(범위)
            let matchesPlayer = true;
            const userRange = parseRange(playerFilter); // 사용자 입력
            const themeRange = parseRange(String(theme.players)); // 테마 값
            if (userRange && themeRange) {
                matchesPlayer = hasOverlap(userRange, themeRange);
            }
            // userRange == null이면 필터 미적용 => matchesPlayer = true

            // (4) 제작자 필터
            const lowerMaker = makerFilter.toLowerCase();
            const matchesMaker = makerFilter
                ? theme.makers.some((m) => m.toLowerCase().includes(lowerMaker))
                : true;

            // (5) 가격 범위
            const priceNumber = theme.price;
            const withinMin =
                minPrice === "" ? true : priceNumber >= Number(minPrice);
            const withinMax =
                maxPrice === "" ? true : priceNumber <= Number(maxPrice);
            const matchesPrice = withinMin && withinMax;
            const matchesFree = freeOnly ? theme.price === 0 : true;

            return (
                matchesSearch &&
                matchesTag &&
                matchesPlayer &&
                matchesMaker &&
                matchesPrice &&
                matchesFree
            );
        });
    }, [
        themes,
        searchQuery,
        selectedTag,
        playerFilter,
        makerFilter,
        minPrice,
        maxPrice,
        freeOnly,
    ]);

    // 정렬된 결과
    const sortedThemes = useMemo(() => {
        const arr = [...filteredThemes];
        if (sortOption === "recDesc") {
            // 추천수 높은 순
            arr.sort((a, b) => b.recommendations - a.recommendations);
        } else if (sortOption === "recAsc") {
            // 추천수 낮은 순
            arr.sort((a, b) => a.recommendations - b.recommendations);
        }
        // sortOption === "none" => 정렬 없이 그대로
        return arr;
    }, [filteredThemes, sortOption]);

    const handleTagClick = (tag: string) => {
        setSelectedTag((prev) => (prev === tag ? null : tag));
    };

    if (isLoading) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-20">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-bold mb-4">게임 테마</h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            흥미로운 크라임씬 시나리오와 테마를 찾아보세요.
                        </p>
                    </div>
                    <div className="max-w-4xl mx-auto mb-6">
                        <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                    <div className="max-w-4xl mx-auto mb-10">
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton
                                    key={i}
                                    className="h-8 w-20 rounded-full"
                                />
                            ))}
                        </div>
                    </div>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Skeleton key={i} className="h-80 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </PageTransition>
        );
    }

    if (error) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-20">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-bold mb-4">
                            테마 불러오기 오류
                        </h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            테마를 불러오는 중 문제가 발생했습니다. 나중에 다시
                            시도해주세요.
                        </p>
                    </div>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="container mx-auto px-6 py-20">
                {/* 상단 제목/설명 */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold mb-4">게임 테마</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        다양한 크라임씬 테마를 탐색하고, 자세한 설명과 함께
                        테마를 살펴보세요.
                    </p>
                </div>

                {/* 검색어 입력 */}
                <div className="max-w-4xl mx-auto mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="테마 제목 또는 설명 검색..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                {/* 검색 결과수 표시*/}
                <div className="max-w-4xl mx-auto mb-6 text-right text-sm text-muted-foreground">
                    총 {sortedThemes.length.toLocaleString()}개 테마 검색됨
                </div>
                {/* 추가 필터들: 인원수, 제작자, 가격 */}
                <div className="max-w-4xl mx-auto mb-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* 인원수 (예: "3", "3~4") */}
                    <div>
                        <label className="block mb-1 text-sm font-medium">
                            인원수
                        </label>
                        <Input
                            type="text"
                            placeholder="예: 3 또는 3~4"
                            value={playerFilter}
                            onChange={(e) => setPlayerFilter(e.target.value)}
                        />
                    </div>

                    {/* 제작자 필터 */}
                    <div>
                        <label className="block mb-1 text-sm font-medium">
                            제작자 검색
                        </label>
                        <Input
                            type="text"
                            placeholder="예: 민달팽이"
                            value={makerFilter}
                            onChange={(e) => setMakerFilter(e.target.value)}
                        />
                    </div>

                    {/* 최소 가격 */}
                    <div>
                        <label className="block mb-1 text-sm font-medium">
                            최소 가격
                        </label>
                        <Input
                            type="number"
                            placeholder="예: 1000"
                            value={minPrice}
                            onChange={(e) =>
                                setMinPrice(
                                    e.target.value === ""
                                        ? ""
                                        : Number(e.target.value)
                                )
                            }
                        />
                    </div>

                    {/* 최대 가격 */}
                    <div>
                        <label className="block mb-1 text-sm font-medium">
                            최대 가격
                        </label>
                        <Input
                            type="number"
                            placeholder="예: 10000"
                            value={maxPrice}
                            onChange={(e) =>
                                setMaxPrice(
                                    e.target.value === ""
                                        ? ""
                                        : Number(e.target.value)
                                )
                            }
                        />
                    </div>
                </div>

                {/* 정렬 옵션 (추천순 토글) */}
                <div className="max-w-4xl mx-auto mb-10 flex items-center gap-2">
                    <Button
                        variant={
                            sortOption === "recDesc" ? "default" : "outline"
                        }
                        onClick={() =>
                            setSortOption((prev) =>
                                prev === "recDesc" ? "none" : "recDesc"
                            )
                        }
                    >
                        추천수 많은순
                    </Button>
                    <Button
                        variant={freeOnly ? "default" : "outline"}
                        onClick={() => setFreeOnly((prev) => !prev)}
                    >
                        무료 테마만 보기
                    </Button>
                </div>

                {/* 태그 필터 */}
                {allTags.length > 0 && (
                    <div className="max-w-4xl mx-auto mb-10">
                        <div className="flex flex-wrap gap-2">
                            {allTags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant={
                                        selectedTag === tag
                                            ? "default"
                                            : "outline"
                                    }
                                    className="cursor-pointer transition-colors"
                                    onClick={() => handleTagClick(tag)}
                                >
                                    <Hash className="h-3 w-3 mr-1" />
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
                {/* 글쓰기 버튼 - 테마 카드 위 */}
                <div className="max-w-6xl mx-auto mb-6 text-right">
                    <Button onClick={() => navigate('/themes/new')}>
                        글쓰기
                    </Button>
                </div>
                {/* 최종 결과 목록 */}
                <div className="max-w-6xl mx-auto">
                    {sortedThemes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sortedThemes.map((theme, index) => (
                                <ThemeCard
                                    key={theme.id}
                                    theme={theme}
                                    index={index}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-lg text-muted-foreground">
                                검색 조건에 맞는 테마가 없습니다.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};

export default Themes;
