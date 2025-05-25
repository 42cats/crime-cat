import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { themesService } from '@/api/content';
import { Theme, ThemePage } from "@/lib/types";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { Edit } from "lucide-react";
import { FilterValues, EscapeRoomFilterValues, ThemeFilterValues } from "@/components/themes/filters/types";
import ThemeFilters from "@/components/themes/filters/ThemeFilters";
import EscapeRoomFilters from "@/components/themes/filters/EscapeRoomFilters";
import MurderMysteryFilters from "@/components/themes/filters/MurderMysteryFilters";
import RealWorldFilters from "@/components/themes/filters/RealWorldFilters";
import ThemeGridRouter from "@/components/themes/router/ThemeGridRouter";
import Pagination from "@/components/themes/Pagination";

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
    { value: "DIFFICULTY", label: "난이도 낮은 순" },
    { value: "DIFFICULTY_DESC", label: "난이도 높은 순" },
];

const CATEGORY_LABELS: Record<Theme["type"], string> = {
    CRIMESCENE: "크라임씬 테마",
    ESCAPE_ROOM: "방탈출 테마",
    MURDER_MYSTERY: "머더미스터리 테마",
    REALWORLD: "리얼월드 테마",
};

const CATEGORY_DESCRIPTIONS: Record<Theme["type"], string> = {
    CRIMESCENE:
        "범죄현장을 재구성하여 증거를 찾고 사건을 해결하는 체험형 테마입니다.",
    ESCAPE_ROOM:
        "주어진 시간 내에 단서를 찾아 문제를 해결하고 탈출하는 테마입니다.",
    MURDER_MYSTERY: "살인사건의 범인을 찾아내는 추리 게임 테마입니다.",
    REALWORLD: "현실 세계의 장소와 상황을 기반으로 한 몰입형 체험 테마입니다.",
};

// 테마 타입별 필터 컴포넌트 매핑
const FILTER_COMPONENTS = {
    CRIMESCENE: ThemeFilters,
    ESCAPE_ROOM: EscapeRoomFilters,
    MURDER_MYSTERY: MurderMysteryFilters,
    REALWORLD: RealWorldFilters,
} as const;

const ThemeList: React.FC = () => {
    const navigate = useNavigate();
    const { category } = useParams<{ category: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const { toast } = useToast();

    // escape-room을 ESCAPE_ROOM으로 변환
    const validCategory = category?.replace('-', '_').toUpperCase() as Theme["type"];
    const page = Number(searchParams.get("page")) || 0;
    const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
    const [searchInput, setSearchInput] = useState(keyword);
    const [sort, setSort] = useState(searchParams.get("sort") || "LATEST");
    const [hasSearched, setHasSearched] = useState(false);

    // 테마 타입별 초기 필터 상태 생성
    const getInitialFilters = (): ThemeFilterValues => {
        const baseFilters = {
            priceMin: searchParams.get("priceMin") || "",
            priceMax: searchParams.get("priceMax") || "",
            playerMin: searchParams.get("playerMin") || "",
            playerMax: searchParams.get("playerMax") || "",
            playtimeMin: searchParams.get("playtimeMin") || "",
            playtimeMax: searchParams.get("playtimeMax") || "",
            difficultyMin: searchParams.get("difficultyMin") || "",
            difficultyMax: searchParams.get("difficultyMax") || "",
        };

        if (validCategory === "ESCAPE_ROOM") {
            // tag 파라미터 처리
            const tagParam = searchParams.get("tag");
            const selectedTagsParam = searchParams.get("selectedTags")?.split(",").filter(Boolean) || [];
            
            // tag 파라미터가 있고 selectedTags에 없으면 추가
            if (tagParam && !selectedTagsParam.includes(tagParam)) {
                selectedTagsParam.push(tagParam);
            }
            
            return {
                ...baseFilters,
                horrorMin: searchParams.get("horrorMin") || "",
                horrorMax: searchParams.get("horrorMax") || "",
                deviceMin: searchParams.get("deviceMin") || "",
                deviceMax: searchParams.get("deviceMax") || "",
                activityMin: searchParams.get("activityMin") || "",
                activityMax: searchParams.get("activityMax") || "",
                isOperating: searchParams.get("isOperating") || "",
                selectedTags: selectedTagsParam,
                selectedLocations: searchParams.get("selectedLocations")?.split(",").filter(Boolean) || [],
                location: searchParams.get("location") || "",
                hasPlayed: searchParams.get("hasPlayed") || "all",
            };
        }

        return baseFilters;
    };

    const [filters, setFilters] = useState<ThemeFilterValues>(getInitialFilters());

    // 테마 타입별 필터 변경 핸들러
    const handleFilterChange = (key: string, value: string | string[]) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const validateFilters = () => {
        const basePairs: [string, string][] = [
            ["priceMin", "priceMax"],
            ["playerMin", "playerMax"],
            ["playtimeMin", "playtimeMax"],
            ["difficultyMin", "difficultyMax"],
        ];

        // 방탈출 전용 필터 추가
        const escapeRoomPairs: [string, string][] = [
            ["horrorMin", "horrorMax"],
            ["deviceMin", "deviceMax"],
            ["activityMin", "activityMax"],
        ];

        const pairs = validCategory === "ESCAPE_ROOM" 
            ? [...basePairs, ...escapeRoomPairs] 
            : basePairs;

        for (const [minKey, maxKey] of pairs) {
            const min = Number((filters as any)[minKey]);
            const max = Number((filters as any)[maxKey]);

            if ((filters as any)[minKey] && min < 1) {
                toast({
                    description: "최소 값은 1보다 커야 합니다.",
                    variant: "destructive",
                });
                return false;
            }

            if ((filters as any)[maxKey] && max < min) {
                toast({
                    description: "최대 값은 최소 값보다 크거나 같아야 합니다.",
                    variant: "destructive",
                });
                return false;
            }

            // 난이도는 1-5, 방탈출 특성은 1-10
            const maxLimit = minKey.includes("difficulty") ? 5 : 10;
            if (
                (minKey.includes("difficulty") || minKey.includes("horror") || 
                 minKey.includes("device") || minKey.includes("activity")) && min > maxLimit
            ) {
                const limitText = minKey.includes("difficulty") ? "1에서 5" : "1에서 10";
                toast({
                    description: `${minKey.includes("difficulty") ? "난이도" : "특성"}는 ${limitText} 사이여야 합니다.`,
                    variant: "destructive",
                });
                return false;
            }

            if (
                (maxKey.includes("difficulty") || maxKey.includes("horror") || 
                 maxKey.includes("device") || maxKey.includes("activity")) && max > maxLimit
            ) {
                const limitText = maxKey.includes("difficulty") ? "1에서 5" : "1에서 10";
                toast({
                    description: `${maxKey.includes("difficulty") ? "난이도" : "특성"}는 ${limitText} 사이여야 합니다.`,
                    variant: "destructive",
                });
                return false;
            }
        }

        return true;
    };

    const shouldFetch = !!validCategory && hasSearched;

    const { data, isLoading } = useQuery<ThemePage>({
        queryKey: ["themes", validCategory, page, sort, keyword, filters],
        queryFn: () =>
            themesService.getThemes(
                validCategory,
                PAGE_SIZE,
                page,
                sort,
                keyword,
                filters
            ),
        enabled: shouldFetch,
        placeholderData: (prev) => prev,
    });

    useEffect(() => {
        if (!hasSearched) {
            handleSearch();
        }
    }, []);
    
    // tag 파라미터가 변경되면 자동으로 검색 실행
    useEffect(() => {
        const tagParam = searchParams.get("tag");
        if (tagParam && validCategory === "ESCAPE_ROOM") {
            handleSearch();
        }
    }, [searchParams.get("tag")]);

    const handleSearch = () => {
        if (!validateFilters()) return;
        
        // 방탈출의 경우 location을 keyword와 통합
        let finalKeyword = searchInput;
        if (validCategory === "ESCAPE_ROOM" && filters.location) {
            finalKeyword = searchInput ? `${searchInput} ${filters.location}` : filters.location;
        }
        
        setSearchParams((prev) => {
            prev.set("keyword", finalKeyword);
            prev.set("sort", sort);
            prev.set("page", "0");
            
            // tag 파라미터 제거 (selectedTags로 이동했으므로)
            prev.delete("tag");
            
            Object.entries(filters).forEach(([k, v]) => {
                // location은 keyword로 처리하므로 URL 파라미터에서 제외
                if (k === "location") return;
                
                if (Array.isArray(v) && v.length > 0) {
                    prev.set(k, v.join(","));
                } else if (typeof v === "string" && v) {
                    prev.set(k, v);
                } else {
                    prev.delete(k);
                }
            });
            return prev;
        });
        setKeyword(finalKeyword);
        setHasSearched(true);
    };

    const handleResetFilters = () => {
        setSearchInput("");
        
        // 테마 타입별 초기 필터 상태로 리셋
        const resetFilters: ThemeFilterValues = validCategory === "ESCAPE_ROOM" 
            ? {
                priceMin: "", priceMax: "", playerMin: "", playerMax: "",
                playtimeMin: "", playtimeMax: "", difficultyMin: "", difficultyMax: "",
                horrorMin: "", horrorMax: "", deviceMin: "", deviceMax: "",
                activityMin: "", activityMax: "", isOperating: "",
                selectedTags: [], selectedLocations: [], location: "", hasPlayed: "all",
            }
            : {
                priceMin: "", priceMax: "", playerMin: "", playerMax: "",
                playtimeMin: "", playtimeMax: "", difficultyMin: "", difficultyMax: "",
            };
        
        setFilters(resetFilters);
        setSort("LATEST");

        setSearchParams({ page: "0" });
        setKeyword("");
        setHasSearched(true);
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams((prev) => {
            prev.set("page", newPage.toString());
            return prev;
        });
    };

    const handleSortChange = (val: string) => {
        setSort(val);
        setSearchParams((prev) => {
            prev.set("sort", val);
            prev.set("page", "0");
            return prev;
        });
    };

    return (
        <PageTransition>
            <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold mb-2">
                        {validCategory
                            ? CATEGORY_LABELS[validCategory]
                            : "모든 테마"}
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        {validCategory
                            ? CATEGORY_DESCRIPTIONS[validCategory]
                            : "다양한 테마를 찾아보세요."}
                    </p>
                </div>

                {/* 👇 정렬된 정보 + 버튼 */}
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-muted-foreground">
                        {data?.totalElements ? (
                            <>
                                총 <strong>{data.totalElements}</strong>개의
                                테마
                            </>
                        ) : (
                            ""
                        )}
                    </p>

                    <Button
                        onClick={() =>
                            navigate(`/themes/new`, {
                                state: { category, page },
                            })
                        }
                        className="gap-2"
                    >
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">테마 작성하기</span>
                        <span className="sm:hidden">작성</span>
                    </Button>
                </div>

                {(() => {
                    const FilterComponent = validCategory ? FILTER_COMPONENTS[validCategory] : ThemeFilters;
                    
                    return (
                        <FilterComponent
                            filters={filters}
                            searchInput={searchInput}
                            sort={sort}
                            sortOptions={SORT_OPTIONS}
                            onSearchInputChange={setSearchInput}
                            onFilterChange={handleFilterChange}
                            onSortChange={handleSortChange}
                            onSearch={handleSearch}
                            onReset={handleResetFilters}
                        />
                    );
                })()}

                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                        <ThemeGridRouter
                            themes={data?.themes || []}
                            isLoading={isLoading}
                            pageSize={PAGE_SIZE}
                            category={category}
                            onCreateTheme={() => navigate('/themes/new')}
                            canCreateTheme={true}
                        />

                        {data && data.totalPages > 1 && (
                            <Pagination
                                currentPage={page}
                                totalPages={data.totalPages}
                                hasPrevious={data.hasPrevious}
                                hasNext={data.hasNext}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageTransition>
    );
};

export default ThemeList;
