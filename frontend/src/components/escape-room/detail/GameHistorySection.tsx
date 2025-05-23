import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Plus, Calendar, Clock, Users, Star } from 'lucide-react';
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
    userGameHistory?: UserGameHistory[];
    hasGameHistory: boolean;
    onAddGameHistory?: () => void;
}

const GameHistorySection: React.FC<GameHistorySectionProps> = ({ 
    userGameHistory = [], 
    hasGameHistory,
    onAddGameHistory 
}) => {
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
        return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
    };

    const formatRating = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${
                    i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
            />
        ));
    };

    if (!hasGameHistory) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        게임 기록
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">아직 이 테마의 플레이 기록이 없습니다.</p>
                        {onAddGameHistory && (
                            <Button onClick={onAddGameHistory} className="gap-2">
                                <Plus className="w-4 h-4" />
                                첫 기록 추가하기
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    내 게임 기록 ({userGameHistory.length})
                </CardTitle>
                {onAddGameHistory && (
                    <Button variant="outline" size="sm" onClick={onAddGameHistory} className="gap-2">
                        <Plus className="w-4 h-4" />
                        기록 추가
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {userGameHistory.length === 0 ? (
                    <div className="text-center py-8">
                        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">아직 플레이 기록이 없습니다.</p>
                        {onAddGameHistory && (
                            <Button onClick={onAddGameHistory} className="gap-2">
                                <Plus className="w-4 h-4" />
                                첫 기록 추가하기
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {userGameHistory.map((history) => (
                            <div key={history.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={history.completed ? "default" : "destructive"}>
                                                {history.completed ? "성공" : "실패"}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(history.playedAt)}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                {history.participants}명
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {formatPlayTime(history.playTime)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">평점:</span>
                                            <div className="flex items-center gap-1">
                                                {formatRating(history.rating)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {history.memo && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                        <p className="text-sm text-gray-700">{history.memo}</p>
                                        {history.hasSpoiler && (
                                            <Badge variant="outline" className="mt-2 text-xs">
                                                스포일러 포함
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default GameHistorySection;