import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, DollarSign, Star, Calendar, Activity, Zap, Ghost } from 'lucide-react';
import { EscapeRoomThemeDetailType } from '@/lib/types';

interface ThemeInfoProps {
    theme: EscapeRoomThemeDetailType;
}

const ThemeInfo: React.FC<ThemeInfoProps> = ({ theme }) => {
    const formatStarRating = (rating: number = 0) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${
                    i < Math.floor(rating / 2) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
            />
        ));
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        게임 정보
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-gray-600">참가 인원</div>
                            <div className="font-medium">{theme.playersMin}~{theme.playersMax}인</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">소요 시간</div>
                            <div className="font-medium">{theme.playTimeMax}분</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">이용 가격</div>
                            <div className="font-medium">{theme.price.toLocaleString()}원</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">난이도</div>
                            <div className="flex items-center gap-1">
                                {formatStarRating(theme.difficulty * 2)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 방탈출 전용 정보 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        체험 정보
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        {theme.horrorLevel !== undefined && theme.horrorLevel !== null && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Ghost className="w-4 h-4" />
                                    <span className="text-sm text-gray-600">공포도</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {formatStarRating(theme.horrorLevel)}
                                </div>
                            </div>
                        )}
                        
                        {theme.deviceRatio !== undefined && theme.deviceRatio !== null && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-sm text-gray-600">장치비중</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {formatStarRating(theme.deviceRatio)}
                                </div>
                            </div>
                        )}
                        
                        {theme.activityLevel !== undefined && theme.activityLevel !== null && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    <span className="text-sm text-gray-600">활동도</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {formatStarRating(theme.activityLevel)}
                                </div>
                            </div>
                        )}

                        {theme.openDate && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm text-gray-600">오픈일</span>
                                </div>
                                <div className="text-sm font-medium">
                                    {formatDate(theme.openDate)}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ThemeInfo;