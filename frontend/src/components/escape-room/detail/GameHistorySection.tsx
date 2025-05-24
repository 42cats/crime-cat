import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Calendar, Users, Clock, Star, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UserGameHistory {
    id: string;
    playedAt: string;
    completed: boolean;
    participants: number;
    playTime: number;
    rating: number;
    memo?: string;
    hasSpoiler: boolean;
}

interface GameHistorySectionProps {
    themeId: string;
    userGameHistory: UserGameHistory[];
    hasGameHistory: boolean;
    allowGameHistory: boolean;
    onAddGameHistory?: () => void;
    onEditGameHistory?: (historyId: string) => void;
}

const GameHistorySection: React.FC<GameHistorySectionProps> = ({
    themeId,
    userGameHistory,
    hasGameHistory,
    allowGameHistory,
    onAddGameHistory,
    onEditGameHistory
}) => {
    if (!allowGameHistory) {
        return (
            <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">이 테마는 플레이 기록을 지원하지 않습니다.</p>
            </div>
        );
    }

    if (userGameHistory.length === 0) {
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

    const formatPlayTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}시간 ${mins}분`;
        }
        return `${mins}분`;
    };

    return (
        <div className="space-y-4">
            {/* 플레이 통계 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">나의 플레이 통계</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{userGameHistory.length}</div>
                            <div className="text-sm text-gray-500">총 플레이 횟수</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">
                                {userGameHistory.filter(h => h.completed).length}
                            </div>
                            <div className="text-sm text-gray-500">성공 횟수</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">
                                {userGameHistory.reduce((sum, h) => sum + h.participants, 0) / userGameHistory.length || 0}
                            </div>
                            <div className="text-sm text-gray-500">평균 참가 인원</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">
                                {(userGameHistory.reduce((sum, h) => sum + h.rating, 0) / userGameHistory.length || 0).toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-500">평균 평점</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 플레이 기록 목록 */}
            <div className="space-y-3">
                {userGameHistory.map((history) => (
                    <Card key={history.id}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm">{formatDate(history.playedAt)}</span>
                                        </div>
                                        <Badge variant={history.completed ? "success" : "secondary"}>
                                            {history.completed ? "성공" : "실패"}
                                        </Badge>
                                        {history.hasSpoiler && (
                                            <Badge variant="destructive">스포일러</Badge>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span>{history.participants}명</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatPlayTime(history.playTime)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${
                                                        i < history.rating
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {history.memo && (
                                        <p className={`text-sm ${history.hasSpoiler ? 'blur-sm hover:blur-none transition-all cursor-pointer' : ''}`}>
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