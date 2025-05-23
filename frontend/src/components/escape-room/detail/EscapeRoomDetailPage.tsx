import React, { useState } from 'react';
import { MapPin, Clock, Users, Star, DollarSign, MessageCircle, Trophy, Lock, Globe, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EscapeRoomLocation } from '@/lib/types';
import LocationMap from './LocationMap';
import ThemeHeader from './ThemeHeader';
import ThemeInfo from './ThemeInfo';
import CommentTabs from './CommentTabs';
import GameHistorySection from './GameHistorySection';

interface EscapeRoomTheme {
    id: string;
    title: string;
    description: string;
    difficulty: number;
    minParticipants: number;
    maxParticipants: number;
    estimatedDuration: number;
    price: number;
    genreTags: string[];
    locations: EscapeRoomLocation[];
    isActive: boolean;
    allowComments: boolean;
    allowGameHistory: boolean;
    homepageUrl?: string;
    reservationUrl?: string;
    createdAt: string;
    updatedAt: string;
}

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

interface EscapeRoomDetailPageProps {
    theme: EscapeRoomTheme;
    userGameHistory?: UserGameHistory[];
    hasGameHistory: boolean;
    onAddGameHistory?: () => void;
    onEditGameHistory?: (historyId: string) => void;
}

const EscapeRoomDetailPage: React.FC<EscapeRoomDetailPageProps> = ({
    theme,
    userGameHistory = [],
    hasGameHistory = false,
    onAddGameHistory,
    onEditGameHistory
}) => {
    const [activeTab, setActiveTab] = useState<'info' | 'comments' | 'history'>('info');

    const formatPrice = (amount: number): string => {
        if (amount === 0) return '무료';
        return new Intl.NumberFormat('ko-KR').format(amount) + '원';
    };

    const formatDuration = (minutes: number): string => {
        if (minutes < 60) return `${minutes}분`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`;
    };

    const getDifficultyLabel = (difficulty: number): { label: string; color: string } => {
        const labels = {
            1: { label: '매우 쉬움', color: 'bg-green-100 text-green-800' },
            2: { label: '쉬움', color: 'bg-blue-100 text-blue-800' },
            3: { label: '보통', color: 'bg-yellow-100 text-yellow-800' },
            4: { label: '어려움', color: 'bg-orange-100 text-orange-800' },
            5: { label: '매우 어려움', color: 'bg-red-100 text-red-800' }
        };
        return labels[difficulty as keyof typeof labels] || labels[3];
    };

    const difficultyInfo = getDifficultyLabel(theme.difficulty);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* 테마 헤더 */}
            <ThemeHeader 
                theme={theme}
                hasGameHistory={hasGameHistory}
                onAddGameHistory={onAddGameHistory}
            />

            {/* 메인 콘텐츠 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 왼쪽 콘텐츠 (테마 정보) */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                        <TabsList className="w-full">
                            <TabsTrigger value="info" className="flex items-center gap-2">
                                <Star className="w-4 h-4" />
                                테마 정보
                            </TabsTrigger>
                            <TabsTrigger 
                                value="comments" 
                                className="flex items-center gap-2"
                                disabled={!theme.allowComments}
                            >
                                <MessageCircle className="w-4 h-4" />
                                댓글
                                {!theme.allowComments && <Lock className="w-3 h-3" />}
                            </TabsTrigger>
                            <TabsTrigger 
                                value="history" 
                                className="flex items-center gap-2"
                                disabled={!theme.allowGameHistory}
                            >
                                <Trophy className="w-4 h-4" />
                                플레이 기록
                                {!theme.allowGameHistory && <Lock className="w-3 h-3" />}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4">
                            <ThemeInfo theme={theme} />
                        </TabsContent>

                        <TabsContent value="comments">
                            <CommentTabs 
                                themeId={theme.id}
                                hasGameHistory={hasGameHistory}
                                allowComments={theme.allowComments}
                            />
                        </TabsContent>

                        <TabsContent value="history">
                            <GameHistorySection
                                themeId={theme.id}
                                userGameHistory={userGameHistory}
                                hasGameHistory={hasGameHistory}
                                allowGameHistory={theme.allowGameHistory}
                                onAddGameHistory={onAddGameHistory}
                                onEditGameHistory={onEditGameHistory}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* 오른쪽 사이드바 (위치 정보 및 요약) */}
                <div className="space-y-6">
                    {/* 게임 정보 요약 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">게임 정보</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* 난이도 */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">난이도</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: 5 }, (_, index) => (
                                            <Star
                                                key={index}
                                                className={`w-4 h-4 ${
                                                    index < theme.difficulty
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-gray-200'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <Badge variant="outline" className={difficultyInfo.color}>
                                        {difficultyInfo.label}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            {/* 참가 인원 */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">참가 인원</span>
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium">
                                        {theme.minParticipants === theme.maxParticipants 
                                            ? `${theme.minParticipants}명`
                                            : `${theme.minParticipants}-${theme.maxParticipants}명`
                                        }
                                    </span>
                                </div>
                            </div>

                            <Separator />

                            {/* 플레이 시간 */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">플레이 시간</span>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium">
                                        {formatDuration(theme.estimatedDuration)}
                                    </span>
                                </div>
                            </div>

                            <Separator />

                            {/* 가격 */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">1인당 가격</span>
                                <div className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium">
                                        {formatPrice(theme.price)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 장르 태그 */}
                    {theme.genreTags.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">장르</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {theme.genreTags.map((tag, index) => (
                                        <Badge key={index} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 매장 위치 */}
                    {theme.locations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    매장 위치
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {theme.locations.map((location, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="font-medium text-sm">
                                            {location.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {location.roadAddress}
                                        </div>
                                        {location.phone && (
                                            <div className="text-xs text-gray-500">
                                                📞 {location.phone}
                                            </div>
                                        )}
                                        {index < theme.locations.length - 1 && (
                                            <Separator className="mt-3" />
                                        )}
                                    </div>
                                ))}
                                
                                {/* 지도 컴포넌트 */}
                                <LocationMap locations={theme.locations} />
                            </CardContent>
                        </Card>
                    )}

                    {/* URL 버튼들 */}
                    {(theme.homepageUrl || theme.reservationUrl) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ExternalLink className="w-5 h-5" />
                                    바로가기
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {theme.homepageUrl && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => window.open(theme.homepageUrl, '_blank', 'noopener,noreferrer')}
                                    >
                                        <Globe className="w-4 h-4 mr-2" />
                                        홈페이지 방문
                                        <ExternalLink className="w-3 h-3 ml-auto" />
                                    </Button>
                                )}
                                {theme.reservationUrl && (
                                    <Button
                                        className="w-full justify-start bg-green-600 hover:bg-green-700"
                                        onClick={() => window.open(theme.reservationUrl, '_blank', 'noopener,noreferrer')}
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        예약하기
                                        <ExternalLink className="w-3 h-3 ml-auto" />
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* 플레이 기록 버튼 */}
                    {theme.allowGameHistory && onAddGameHistory && (
                        <Button 
                            onClick={onAddGameHistory} 
                            className="w-full"
                            size="lg"
                        >
                            <Trophy className="w-4 h-4 mr-2" />
                            플레이 기록 추가
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EscapeRoomDetailPage;