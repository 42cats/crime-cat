import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MapPin,
    Clock,
    Users,
    Star,
    DollarSign,
    Eye,
    MessageCircle,
    Trophy,
    Tag,
    Globe,
    Calendar
} from 'lucide-react';
import { EscapeRoomLocation } from '@/lib/types';

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
    thumbnail?: string;
    isActive: boolean;
    allowComments: boolean;
    allowGameHistory: boolean;
    homepageUrl?: string;
    reservationUrl?: string;
    createdAt: string;
    updatedAt: string;
    // 통계
    views?: number;
    commentCount?: number;
    gameHistoryCount?: number;
    averageRating?: number;
}

interface EscapeRoomThemeCardProps {
    theme: EscapeRoomTheme;
    index: number;
}

const EscapeRoomThemeCard: React.FC<EscapeRoomThemeCardProps> = ({ theme }) => {
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

    const formatCount = (num: number): string => {
        return num >= 1000
            ? (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
            : num.toString();
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

    const participantText = theme.minParticipants === theme.maxParticipants
        ? `${theme.minParticipants}명`
        : `${theme.minParticipants}-${theme.maxParticipants}명`;

    const difficultyInfo = getDifficultyLabel(theme.difficulty);

    return (
        <Link
            to={`/themes/escape-room/${theme.id}`}
            className="block h-full"
        >
            <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] rounded-xl overflow-hidden flex flex-col">
                {/* 썸네일 */}
                <div className="relative w-full h-48 overflow-hidden">
                    <img
                        src={theme.thumbnail || '/content/image/default_bar2.png'}
                        alt={theme.title}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                    
                    {/* 타입 뱃지 */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded">
                        방탈출
                    </div>

                    {/* 난이도 뱃지 */}
                    <div className="absolute top-2 right-2">
                        <Badge className={`text-xs ${difficultyInfo.color}`}>
                            {difficultyInfo.label}
                        </Badge>
                    </div>

                    {/* 통계 정보 */}
                    <div className="absolute bottom-2 right-2 flex gap-2">
                        {theme.views !== undefined && (
                            <div className="flex items-center bg-black/60 text-white rounded-full px-2 py-1 shadow-md">
                                <Eye className="w-3 h-3 mr-1" />
                                <span className="text-xs">{formatCount(theme.views)}</span>
                            </div>
                        )}
                        {theme.gameHistoryCount !== undefined && theme.gameHistoryCount > 0 && (
                            <div className="flex items-center bg-black/60 text-white rounded-full px-2 py-1 shadow-md">
                                <Trophy className="w-3 h-3 mr-1 text-yellow-400" />
                                <span className="text-xs">{formatCount(theme.gameHistoryCount)}</span>
                            </div>
                        )}
                    </div>

                    {/* 비활성 상태 표시 */}
                    {!theme.isActive && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="secondary" className="bg-gray-700 text-white">
                                비활성
                            </Badge>
                        </div>
                    )}
                </div>

                {/* 내용 */}
                <CardContent className="p-4 flex-grow flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                        <h2 className="text-lg font-bold line-clamp-1 flex-1">
                            {theme.title}
                        </h2>
                        {theme.averageRating && (
                            <div className="flex items-center gap-1 ml-2">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-xs text-gray-600">
                                    {theme.averageRating.toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-grow">
                        {theme.description}
                    </p>

                    {/* 게임 정보 그리드 */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{participantText}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{formatPrice(theme.price)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{formatDuration(theme.estimatedDuration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="flex">
                                {Array.from({ length: 5 }, (_, index) => (
                                    <Star
                                        key={index}
                                        className={`w-3 h-3 ${
                                            index < theme.difficulty
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 위치 정보 */}
                    {theme.locations.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                                {theme.locations[0].name}
                                {theme.locations.length > 1 && ` 외 ${theme.locations.length - 1}곳`}
                            </span>
                        </div>
                    )}

                    {/* 장르 태그 */}
                    {theme.genreTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {theme.genreTags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                            {theme.genreTags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                    +{theme.genreTags.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* URL 버튼들 */}
                    {(theme.homepageUrl || theme.reservationUrl) && (
                        <div className="flex gap-2 mb-3">
                            {theme.homepageUrl && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.open(theme.homepageUrl, '_blank', 'noopener,noreferrer');
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                                >
                                    <Globe className="w-3 h-3" />
                                    홈페이지
                                </button>
                            )}
                            {theme.reservationUrl && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.open(theme.reservationUrl, '_blank', 'noopener,noreferrer');
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                                >
                                    <Calendar className="w-3 h-3" />
                                    예약
                                </button>
                            )}
                        </div>
                    )}

                    {/* 하단 액션 정보 */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            {theme.allowComments && theme.commentCount !== undefined && (
                                <div className="flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" />
                                    <span>{theme.commentCount}</span>
                                </div>
                            )}
                            {theme.allowGameHistory && theme.gameHistoryCount !== undefined && (
                                <div className="flex items-center gap-1">
                                    <Trophy className="w-3 h-3" />
                                    <span>{theme.gameHistoryCount}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="text-xs text-gray-400">
                            {new Date(theme.createdAt).toLocaleDateString('ko-KR')}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default EscapeRoomThemeCard;