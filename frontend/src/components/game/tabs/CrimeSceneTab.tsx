import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { integratedHistoryService, gameHistoryService } from "@/api/game";
import {
    IntegratedGameHistoryFilterRequest,
    GameType,
    IntegratedGameHistoryResponse,
    SortOption,
    SortDirection,
    UserGameHistoryDto,
    UserGameHistoryToUserDto,
} from "@/types/integratedGameHistory";
import { GameHistoryUpdateRequest } from "@/types/gameHistory";
import { UnifiedGameFilters } from "@/components/game/common/UnifiedGameFilters";
import { CrimeSceneHistoryCard } from "@/components/game/common/CrimeSceneHistoryCard";
import { CrimeSceneEditDialog } from "@/components/game/common/CrimeSceneEditDialog";
import { toast } from "sonner";

interface CrimeSceneTabProps {
    initialFilter?: Partial<IntegratedGameHistoryFilterRequest>;
}

export const CrimeSceneTab: React.FC<CrimeSceneTabProps> = ({
    initialFilter,
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [editingHistory, setEditingHistory] =
        useState<UserGameHistoryToUserDto | null>(null);
    const [filter, setFilter] = useState<IntegratedGameHistoryFilterRequest>({
        gameType: GameType.CRIMESCENE,
        page: 0,
        size: 20,
        sortBy: SortOption.CREATED_AT, // PLAY_DATE 대신 CREATED_AT 사용 (백엔드 버그 회피)
        sortDirection: SortDirection.DESC,
        ...initialFilter,
    });

    const { data, isLoading, error, refetch } =
        useQuery<IntegratedGameHistoryResponse>({
            queryKey: ["crimescene-history", user?.id, filter],
            queryFn: () =>
                integratedHistoryService.getCrimeSceneHistories(
                    user!.id,
                    filter
                ),
            enabled: !!user?.id,
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
            gameType: GameType.CRIMESCENE,
            page: 0,
            size: 20,
            sortBy: SortOption.CREATED_AT, // PLAY_DATE 대신 CREATED_AT 사용 (백엔드 버그 회피)
            sortDirection: SortDirection.DESC,
        });
    };

    const handlePageChange = (newPage: number) => {
        setFilter((prev) => ({ ...prev, page: newPage }));
        window.scrollTo(0, 0);
    };

    const handleEditHistory = async (data: GameHistoryUpdateRequest) => {
        if (!editingHistory?.themeId) {
            toast.error("테마 정보가 없습니다.");
            return;
        }

        try {
            await gameHistoryService.updateCrimeSceneHistory(
                editingHistory.themeId,
                data
            );
            toast.success("게임 기록이 수정되었습니다.");
            queryClient.invalidateQueries({
                queryKey: ["crimescene-history", user?.id, filter],
            });
        } catch (error) {
            toast.error("게임 기록 수정에 실패했습니다.");
            throw error;
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-20">
                    <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">
                            크라임씬 기록을 불러오는 중...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-20">
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-destructive mb-4">
                            데이터를 불러오는 중 오류가 발생했습니다.
                        </p>
                        <Button onClick={() => refetch()}>다시 시도</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* 필터 */}
            <UnifiedGameFilters
                filter={filter}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                onReset={handleReset}
                gameType={GameType.CRIMESCENE}
            />

            {/* 통계 요약 */}
            {data && data.statistics.crimeScene && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">
                                총 플레이
                            </p>
                            <p className="text-2xl font-bold">
                                {data.statistics.crimeScene.playCount} /
                                {data.statistics.crimeScene.total}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">
                                고유 테마
                            </p>
                            <p className="text-2xl font-bold">
                                {data.statistics.crimeScene.unique}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">
                                승리
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {data.statistics.crimeScene.winCount}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">
                                패배
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                                {data.statistics.crimeScene.playCount -
                                    data.statistics.crimeScene.winCount}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">
                                승률
                            </p>
                            <p className="text-2xl font-bold">
                                {data.statistics.crimeScene.winRate.toFixed(1)}%
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 결과 */}
            {data && (
                <>
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                            총 {data.pageInfo.totalElements}개의 크라임씬 기록
                        </p>
                    </div>

                    {/* 기록 목록 */}
                    {data.crimeSceneHistories.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <div className="flex flex-col items-center">
                                    <Home className="w-12 h-12 text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground mb-2">
                                        크라임씬 기록이 없습니다.
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        게임을 플레이하면 기록이 표시됩니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {data.crimeSceneHistories.map((history) => (
                                <CrimeSceneHistoryCard
                                    key={history.id}
                                    history={history}
                                    onClick={() =>
                                        history.themeId &&
                                        navigate(
                                            `/themes/crimescene/${history.themeId}`
                                        )
                                    }
                                    onEdit={() => setEditingHistory(history)}
                                    isEditable={true}
                                />
                            ))}
                        </div>
                    )}

                    {/* 페이지네이션 */}
                    {data.pageInfo.totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    handlePageChange(filter.page! - 1)
                                }
                                disabled={!data.pageInfo.hasPrevious}
                            >
                                이전
                            </Button>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">
                                    {data.pageInfo.currentPage + 1} /{" "}
                                    {data.pageInfo.totalPages}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    handlePageChange(filter.page! + 1)
                                }
                                disabled={!data.pageInfo.hasNext}
                            >
                                다음
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* 수정 다이얼로그 */}
            {editingHistory && (
                <CrimeSceneEditDialog
                    open={!!editingHistory}
                    onOpenChange={(open) => !open && setEditingHistory(null)}
                    history={editingHistory}
                    onSave={handleEditHistory}
                />
            )}
        </div>
    );
};
