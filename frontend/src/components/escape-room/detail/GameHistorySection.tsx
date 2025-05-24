import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Calendar, Users, Clock, Star, Edit2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useQuery } from '@tanstack/react-query';
import { escapeRoomHistoryService, EscapeRoomHistoryResponse } from '@/api/game/escapeRoomHistoryService';

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

    // React Query를 사용하여 데이터 페칭
    const { data: historiesData, isLoading, error } = useQuery({
        queryKey: ['escape-room-histories', themeId],
        queryFn: () => escapeRoomHistoryService.getThemeHistories(themeId, 0, 20),
        enabled: allowGameHistory,
        onError: (error) => {
            console.error('기록 목록 조회 실패:', error);
            toast({
                title: "기록 로딩 실패",
                description: "플레이 기록을 불러오는데 실패했습니다.",
                variant: "destructive"
            });
        }
    });

    const histories = historiesData?.content || [];
    if (!allowGameHistory) {
        return (
            <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">이 테마는 플레이 기록을 지원하지 않습니다.</p>
            </div>
        );
    }

    const myHistories = histories.filter(h => h.isOwn);
    const publicHistories = histories.filter(h => !h.isOwn);

    if (isLoading) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">플레이 기록을 불러오는 중...</p>
            </div>
        );
    }

    if (histories.length === 0) {
        return (
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

    return (
        <div className="space-y-4">
            {/* 내 플레이 통계 */}
            {myHistories.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">나의 플레이 통계</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold">{myHistories.length}</div>
                                <div className="text-sm text-gray-500">총 플레이 횟수</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">
                                    {myHistories.filter(h => h.successStatus === 'SUCCESS').length}
                                </div>
                                <div className="text-sm text-gray-500">성공 횟수</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">
                                    {(myHistories.reduce((sum, h) => sum + h.teamSize, 0) / myHistories.length || 0).toFixed(1)}
                                </div>
                                <div className="text-sm text-gray-500">평균 참가 인원</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">
                                    {(myHistories.reduce((sum, h) => sum + (h.funRating || 0), 0) / myHistories.filter(h => h.funRating).length || 0).toFixed(1)}
                                </div>
                                <div className="text-sm text-gray-500">평균 평점</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 내 플레이 기록 */}
            {myHistories.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-medium text-lg">내 플레이 기록</h3>
                    <div className="space-y-3">
                        {myHistories.map((history) => (
                            <Card key={history.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm">{formatDate(history.playDate)}</span>
                                                </div>
                                                {getSuccessStatusBadge(history.successStatus)}
                                                {history.isSpoiler && (
                                                    <Badge variant="destructive">스포일러</Badge>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    <span>{history.teamSize}명</span>
                                                </div>
                                                {history.clearTime && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{formatPlayTime(history.clearTime)}</span>
                                                    </div>
                                                )}
                                                {history.funRating && (
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: 5 }, (_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-4 h-4 ${
                                                                    i < history.funRating
                                                                        ? 'fill-yellow-400 text-yellow-400'
                                                                        : 'text-gray-300'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {history.memo && (
                                                <p className={`text-sm ${history.isSpoiler ? 'blur-sm hover:blur-none transition-all cursor-pointer' : ''}`}>
                                                    {history.memo}
                                                </p>
                                            )}
                                        </div>

                                        {onEditGameHistory && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEditGameHistory(history.id)}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* 다른 사용자들의 플레이 기록 */}
            {publicHistories.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-medium text-lg">다른 플레이어들의 기록</h3>
                    <div className="space-y-3">
                        {publicHistories.map((history) => (
                            <Card key={history.id}>
                                <CardContent className="p-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-sm">{history.userNickname}</span>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm">{formatDate(history.playDate)}</span>
                                            </div>
                                            {getSuccessStatusBadge(history.successStatus)}
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                <span>{history.teamSize}명</span>
                                            </div>
                                            {history.clearTime && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{formatPlayTime(history.clearTime)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {history.memo && !history.isSpoiler && (
                                            <p className="text-sm">{history.memo}</p>
                                        )}
                                        {history.isSpoiler && (
                                            <div className="flex items-center gap-2 text-sm text-orange-600">
                                                <Shield className="w-4 h-4" />
                                                <span>스포일러가 포함된 내용입니다</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* 추가 버튼 */}
            {onAddGameHistory && (
                <div className="flex justify-center pt-4">
                    <Button onClick={onAddGameHistory} variant="outline">
                        <Trophy className="w-4 h-4 mr-2" />
                        플레이 기록 추가
                    </Button>
                </div>
            )}
        </div>
    );
};

export default GameHistorySection;