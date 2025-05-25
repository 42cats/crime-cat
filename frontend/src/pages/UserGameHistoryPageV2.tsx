import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Trophy, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { integratedHistoryService } from "@/api/game";
import {
    IntegratedGameHistoryFilterRequest,
    GameType,
    SortOption,
    SortDirection,
    IntegratedGameHistoryResponse,
} from "@/types/integratedGameHistory";
import { UnifiedGameFilters } from "@/components/game/common/UnifiedGameFilters";
import { GameStatisticsCard } from "@/components/game/common/GameStatisticsCard";
import { EscapeRoomHistoryCard } from "@/components/game/common/EscapeRoomHistoryCard";
import GameHistoryItem from "@/components/game/GameHistoryItem";
import {
    CrimeSceneTab,
    EscapeRoomTab,
    UnplayedThemesTab,
} from "@/components/game/tabs";

const PAGE_SIZE = 20;

const UserGameHistoryPageV2: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // URL 쿼리 파라미터 파싱
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get("tab") || "all";
    const pageParam = queryParams.get("page");

    const [activeTab, setActiveTab] = useState(tabParam);
    const [filter, setFilter] = useState<IntegratedGameHistoryFilterRequest>({
        page: pageParam ? parseInt(pageParam) : 0,
        size: PAGE_SIZE,
        sortBy: SortOption.CREATED_AT, // PLAY_DATE 대신 CREATED_AT 사용 (백엔드 버그 회피)
        sortDirection: SortDirection.DESC,
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // URL 업데이트
    useEffect(() => {
        const params = new URLSearchParams();
        params.set("tab", activeTab);
        if (filter.page && filter.page > 0)
            params.set("page", filter.page.toString());

        const newSearch = params.toString();
        const path = `${location.pathname}${newSearch ? `?${newSearch}` : ""}`;
        navigate(path, { replace: true });
    }, [activeTab, filter.page, navigate, location.pathname]);

    // 탭 변경 시 필터 업데이트
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        let gameType: GameType | undefined;

        switch (value) {
            case "crimescene":
                gameType = GameType.CRIMESCENE;
                break;
            case "escaperoom":
                gameType = GameType.ESCAPE_ROOM;
                break;
            case "unplayed":
                // 미플레이 테마 탭은 별도 구현
                return;
            default:
                gameType = undefined;
        }

        setFilter((prev) => ({
            ...prev,
            gameType,
            page: 0,
        }));
    };

    // 통합 게임 기록 조회
    const { data, isLoading, error, refetch } =
        useQuery<IntegratedGameHistoryResponse>({
            queryKey: ["integrated-game-history", user?.id, filter],
            queryFn: () =>
                integratedHistoryService.getUserGameHistories(user!.id, filter),
            enabled: !!user?.id && activeTab !== "unplayed",
        });

    const handleFilterChange = (
        newFilter: IntegratedGameHistoryFilterRequest
    ) => {
        setFilter(newFilter);
    };

    const handleSearch = () => {
        setFilter((prev) => ({ ...prev, page: 0 }));
    };

    const handleReset = () => {
        setFilter({
            page: 0,
            size: PAGE_SIZE,
            sortBy: SortOption.CREATED_AT, // PLAY_DATE 대신 CREATED_AT 사용 (백엔드 버그 회피)
            sortDirection: SortDirection.DESC,
            gameType:
                activeTab === "crimescene"
                    ? GameType.CRIMESCENE
                    : activeTab === "escaperoom"
                    ? GameType.ESCAPE_ROOM
                    : undefined,
        });
    };

    const handlePageChange = (newPage: number) => {
        setFilter((prev) => ({ ...prev, page: newPage }));
        window.scrollTo(0, 0);
    };

    const handleCompareClick = () => {
        navigate("/game-comparison");
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
            <div className="mb-8">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h1 className="text-3xl font-bold">내 게임 기록</h1>
                        <p className="text-muted-foreground mt-2">
                            플레이한 모든 게임의 기록을 한 곳에서 확인하세요
                        </p>
                        <p>
                            크라임씬 기록은 v2에서는 등록된 테마 기준으로
                            표시합니다.
                        </p>
                    </div>
                    <Button
                        onClick={handleCompareClick}
                        variant="outline"
                        className="gap-2"
                    >
                        <Users className="w-4 h-4" />
                        친구와 비교
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="all">전체 기록</TabsTrigger>
                    <TabsTrigger value="crimescene">크라임씬</TabsTrigger>
                    <TabsTrigger value="escaperoom">방탈출</TabsTrigger>
                    <TabsTrigger value="unplayed">미플레이 테마</TabsTrigger>
                </TabsList>

                {/* 전체 기록 탭 */}
                <TabsContent value="all" className="space-y-6">
                    {data && (
                        <div className="grid gap-6">
                            <div className="lg:col-span-1">
                                <GameStatisticsCard
                                    statistics={data.statistics}
                                />
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* 크라임씬 탭 */}
                <TabsContent value="crimescene">
                    <CrimeSceneTab />
                </TabsContent>

                {/* 방탈출 탭 */}
                <TabsContent value="escaperoom">
                    <EscapeRoomTab />
                </TabsContent>

                {/* 미플레이 테마 탭 */}
                <TabsContent value="unplayed">
                    <UnplayedThemesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default UserGameHistoryPageV2;
