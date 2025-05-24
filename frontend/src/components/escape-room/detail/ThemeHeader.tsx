import React from 'react';
import { Star, Users, Clock, DollarSign, MapPin, Globe, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
    locations: any[];
    isActive: boolean;
    allowComments: boolean;
    allowGameHistory: boolean;
    homepageUrl?: string;
    reservationUrl?: string;
    createdAt: string;
    updatedAt: string;
    thumbnail?: string;
}

interface ThemeHeaderProps {
    theme: EscapeRoomTheme;
    hasGameHistory?: boolean;
    onAddGameHistory?: () => void;
}

const ThemeHeader: React.FC<ThemeHeaderProps> = ({ theme }) => {
    const formatDifficulty = (difficulty: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${
                    i < difficulty ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
            />
        ));
    };

    return (
        <div className="space-y-6">
            {/* 썸네일 이미지 */}
            {theme.thumbnail && (
                <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden bg-gray-100">
                    <img 
                        src={theme.thumbnail} 
                        alt={theme.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            console.error('썸네일 로드 실패:', theme.thumbnail);
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>
            )}

            {/* 제목 및 기본 정보 */}
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900">{theme.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{theme.minParticipants}~{theme.maxParticipants}인</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{theme.estimatedDuration}분</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                <span>{theme.price.toLocaleString()}원</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{theme.locations.length}개 지점</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-600">난이도:</span>
                            <div className="flex items-center gap-1">
                                {formatDifficulty(theme.difficulty)}
                            </div>
                        </div>
                        <Badge variant={theme.isActive ? "default" : "secondary"}>
                            {theme.isActive ? "운영중" : "운영중단"}
                        </Badge>
                    </div>
                </div>

                {/* 장르 태그 */}
                {theme.genreTags && theme.genreTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {theme.genreTags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* 예약 및 홈페이지 링크 */}
            {(theme.reservationUrl || theme.homepageUrl) && (
                <div className="flex gap-3">
                    {theme.reservationUrl && (
                        <Button asChild>
                            <a href={theme.reservationUrl} target="_blank" rel="noopener noreferrer">
                                <Calendar className="w-4 h-4 mr-2" />
                                예약하기
                            </a>
                        </Button>
                    )}
                    {theme.homepageUrl && (
                        <Button variant="outline" asChild>
                            <a href={theme.homepageUrl} target="_blank" rel="noopener noreferrer">
                                <Globe className="w-4 h-4 mr-2" />
                                홈페이지
                            </a>
                        </Button>
                    )}
                </div>
            )}

            {/* 설명 */}
            <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">{theme.description}</p>
            </div>
        </div>
    );
};

export default ThemeHeader;