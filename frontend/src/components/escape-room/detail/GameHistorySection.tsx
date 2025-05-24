import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Calendar, Users, Clock, Edit2, Shield, Trash2, HelpCircle, Star, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/hooks/useToast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { escapeRoomHistoryService, EscapeRoomHistoryResponse } from '@/api/game/escapeRoomHistoryService';
import StarRating from '@/components/ui/star-rating';
import DeleteHistoryDialog from './DeleteHistoryDialog';
import { Skeleton } from '@/components/ui/skeleton';

interface GameHistorySectionProps {
    themeId: string;
    userGameHistory?: EscapeRoomHistoryResponse[];
    hasGameHistory: boolean;
    allowGameHistory: boolean;
    onAddGameHistory?: () => void;
    onEditGameHistory?: (historyId: string) => void;
}

const GameHistorySection: React.FC<GameHistorySectionProps> = ({
    themeId,
    userGameHistory = [],
    hasGameHistory,
    allowGameHistory,
    onAddGameHistory,
    onEditGameHistory
}) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(0);
    const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
    const [showSpoilers, setShowSpoilers] = useState<Set<string>>(new Set());
    const pageSize = 10;

    // 기록 목록 조회
    const { data: historiesData, isLoading } = useQuery({
        queryKey: ['escape-room-histories', themeId, currentPage],
        queryFn: () => escapeRoomHistoryService.getThemeHistories(themeId, currentPage, pageSize),
        enabled: allowGameHistory,
    });

    // 통계 정보 조회
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['escape-room-statistics', themeId],
        queryFn: () => escapeRoomHistoryService.getThemeStatistics(themeId),
        enabled: allowGameHistory,
    });

    // 기록 삭제 mutation
    const deleteMutation = useMutation({
        mutationFn: (historyId: string) => escapeRoomHistoryService.deleteHistory(historyId),
        onSuccess: () => {
            toast({
                title: "삭제 완료",
                description: "플레이 기록이 삭제되었습니다.",
            });
            queryClient.invalidateQueries({ queryKey: ['escape-room-histories', themeId] });
            queryClient.invalidateQueries({ queryKey: ['escape-room-statistics', themeId] });
            setDeletingHistoryId(null);
        },
        onError: () => {
            toast({
                title: "삭제 실패",
                description: "기록 삭제 중 오류가 발생했습니다.",
                variant: "destructive"
            });
            setDeletingHistoryId(null);
        }
    });

    const histories = historiesData?.content || [];
    const totalPages = historiesData?.totalPages || 0;

    if (!allowGameHistory) {
        return (
            <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">이 테마는 플레이 기록을 지원하지 않습니다.</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatPlayTime = (minutes?: number) => {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}시간 ${mins}분`;
        }
        return `${mins}분`;
    };

    const getSuccessStatusBadge = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return <Badge variant="success">성공</Badge>;
            case 'FAIL':
                return <Badge variant="secondary">실패</Badge>;
            case 'PARTIAL':
                return <Badge variant="outline">부분 성공</Badge>;
            default:
                return null;
        }
    };

    const toggleSpoiler = (historyId: string) => {
        setShowSpoilers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(historyId)) {
                newSet.delete(historyId);
            } else {
                newSet.add(historyId);
            }
            return newSet;
        });
    };

    const handleDelete = (historyId: string) => {
        deleteMutation.mutate(historyId);
    };

    if (isLoading || statsLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 전체 통계 */}
            {statsData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            전체 플레이 통계
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 border rounded-lg">
                                <div className="text-2xl font-bold">{statsData.totalRecords}</div>
                                <div className="text-sm text-gray-500">총 플레이 횟수</div>
                            </div>
                            <div className="text-center p-3 border rounded-lg">
                                <div className="text-2xl font-bold">
                                    {statsData.successRate}%
                                </div>
                                <div className="text-sm text-gray-500">성공률</div>
                            </div>
                            <div className="text-center p-3 border rounded-lg">
                                <div className="text-2xl font-bold">
                                    {statsData.formattedAverageEscapeTime || '-'}
                                </div>
                                <div className="text-sm text-gray-500">평균 클리어 시간</div>
                            </div>
                            <div className="text-center p-3 border rounded-lg">
                                <div className="text-2xl font-bold">
                                    {statsData.averageParticipants?.toFixed(1) || '-'}명
                                </div>
                                <div className="text-sm text-gray-500">평균 참가 인원</div>
                            </div>
                        </div>

                        {/* 평균 평점 */}
                        <div className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {statsData.averageFeltDifficulty !== undefined && statsData.averageFeltDifficulty !== null && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">평균 체감 난이도</span>
                                        <StarRating 
                                            rating={statsData.averageFeltDifficulty}
                                            isOneToTen={true}
                                            size="sm"
                                        />
                                    </div>
                                )}
                                {statsData.averageSatisfaction !== undefined && statsData.averageSatisfaction !== null && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">평균 만족도</span>
                                        <StarRating 
                                            rating={statsData.averageSatisfaction}
                                            isOneToTen={true}
                                            size="sm"
                                        />
                                    </div>
                                )}
                            </div>
                            {statsData.averageHintUsed !== undefined && statsData.averageHintUsed !== null && (
                                <div className="mt-2 text-center">
                                    <span className="text-sm text-gray-600">평균 힌트 사용: </span>
                                    <span className="font-medium">{statsData.averageHintUsed.toFixed(1)}개</span>
                                </div>
                            )}
                            {statsData.fastestEscapeTime && statsData.slowestEscapeTime && (
                                <div className="mt-2 flex justify-center gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">최단 시간: </span>
                                        <span className="font-medium">{statsData.formattedFastestTime}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">최장 시간: </span>
                                        <span className="font-medium">{statsData.formattedSlowestTime}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 플레이 기록 목록 */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-lg">플레이 기록</h3>
                    {onAddGameHistory && (
                        <Button onClick={onAddGameHistory} variant="outline" size="sm">
                            <Trophy className="w-4 h-4 mr-2" />
                            기록 추가
                        </Button>
                    )}
                </div>

                {histories.length === 0 ? (
                    <div className="text-center py-8">
                        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">아직 플레이 기록이 없습니다.</p>
                        {onAddGameHistory && (
                            <Button onClick={onAddGameHistory}>
                                <Trophy className="w-4 h-4 mr-2" />
                                첫 플레이 기록 추가
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {histories.map((history) => {
                            const isSpoilerVisible = showSpoilers.has(history.id);
                            const shouldShowSpoiler = history.isSpoiler && !history.isOwn;

                            return (
                                <Card key={history.id} className={history.isOwn ? 'border-primary' : ''}>
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            {/* 헤더 정보 */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    {history.isOwn && (
                                                        <Badge variant="default" className="bg-primary">내 기록</Badge>
                                                    )}
                                                    <span className="font-medium text-sm">{history.userNickname}</span>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{formatDate(history.playDate)}</span>
                                                    </div>
                                                    {getSuccessStatusBadge(history.successStatus)}
                                                    {history.isSpoiler && (
                                                        <Badge variant="destructive">스포일러</Badge>
                                                    )}
                                                </div>
                                                {history.isOwn && (
                                                    <div className="flex items-center gap-2">
                                                        {onEditGameHistory && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => onEditGameHistory(history.id)}
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDeletingHistoryId(history.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 상세 정보 */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <Users className="w-4 h-4" />
                                                    <span>{history.teamSize}명</span>
                                                </div>
                                                {history.clearTime && (
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{formatPlayTime(history.clearTime)}</span>
                                                    </div>
                                                )}
                                                {history.hintCount !== undefined && history.hintCount !== null && (
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <HelpCircle className="w-4 h-4" />
                                                        <span>힌트 {history.hintCount}개</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 평점 정보 */}
                                            <div className="space-y-2">
                                                {history.difficultyRating !== undefined && history.difficultyRating !== null && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-600 w-16">난이도</span>
                                                        <StarRating 
                                                            rating={history.difficultyRating}
                                                            isOneToTen={true}
                                                            size="sm"
                                                        />
                                                    </div>
                                                )}
                                                {history.funRating !== undefined && history.funRating !== null && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-600 w-16">재미</span>
                                                        <StarRating 
                                                            rating={history.funRating}
                                                            isOneToTen={true}
                                                            size="sm"
                                                        />
                                                    </div>
                                                )}
                                                {history.storyRating !== undefined && history.storyRating !== null && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-600 w-16">스토리</span>
                                                        <StarRating 
                                                            rating={history.storyRating}
                                                            isOneToTen={true}
                                                            size="sm"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* 메모 */}
                                            {history.memo && (
                                                <div>
                                                    {shouldShowSpoiler && !isSpoilerVisible ? (
                                                        <div 
                                                            className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                                                            onClick={() => toggleSpoiler(history.id)}
                                                        >
                                                            <Shield className="w-4 h-4 text-orange-600" />
                                                            <span className="text-sm text-gray-600">
                                                                스포일러가 포함된 내용입니다. 클릭하여 표시
                                                            </span>
                                                            <Eye className="w-4 h-4 text-gray-500 ml-auto" />
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <p className="text-sm">{history.memo}</p>
                                                            {shouldShowSpoiler && isSpoilerVisible && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute -top-2 -right-2"
                                                                    onClick={() => toggleSpoiler(history.id)}
                                                                >
                                                                    <EyeOff className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="mt-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* 삭제 확인 다이얼로그 */}
            <DeleteHistoryDialog
                isOpen={!!deletingHistoryId}
                onClose={() => setDeletingHistoryId(null)}
                onConfirm={() => {
                    if (deletingHistoryId) {
                        handleDelete(deletingHistoryId);
                    }
                }}
                isDeleting={deleteMutation.isPending}
            />
        </div>
    );
};

export default GameHistorySection;