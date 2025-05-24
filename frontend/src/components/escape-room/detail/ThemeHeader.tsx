import React from "react";
import {
    Star,
    Users,
    Clock,
    DollarSign,
    MapPin,
    Globe,
    Calendar,
    Heart,
    Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EscapeRoomThemeDetailType } from "@/lib/types";

interface ThemeHeaderProps {
    theme: EscapeRoomThemeDetailType;
    hasGameHistory?: boolean;
    onAddGameHistory?: () => void;
    liked?: boolean;
    onToggleLike?: () => void;
    onShare?: () => void;
    isLiking?: boolean;
}

const ThemeHeader: React.FC<ThemeHeaderProps> = ({ 
    theme, 
    liked = false, 
    onToggleLike, 
    onShare, 
    isLiking = false 
}) => {
    const formatDifficulty = (difficulty: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${
                    i < difficulty
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                }`}
            />
        ));
    };

    return (
        <div className="space-y-6">
            {/* 제목 및 기본 정보 */}
            <div className="space-y-4">
                <div className="flex items-start justify-center">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900 text-center">
                            {theme.title}
                        </h1>
                    </div>
                </div>
                {/* 썸네일 이미지 */}
                {theme.thumbnail && (
                    <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden bg-gray-100">
                        <img
                            src={theme.thumbnail}
                            alt={theme.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                console.error(
                                    "썸네일 로드 실패:",
                                    theme.thumbnail
                                );
                                e.currentTarget.style.display = "none";
                            }}
                        />
                    </div>
                )}
            </div>
            {/* 예약, 홈페이지 링크 및 좋아요, 공유 버튼 */}
            <div className="flex flex-wrap gap-3">
                    {theme.reservationUrl && (
                        <Button asChild>
                            <a
                                href={theme.reservationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                예약하기
                            </a>
                        </Button>
                    )}
                    {theme.homepageUrl && (
                        <Button variant="outline" asChild>
                            <a
                                href={theme.homepageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Globe className="w-4 h-4 mr-2" />
                                홈페이지
                            </a>
                        </Button>
                    )}
                    
                    {/* 구분선 */}
                    {(theme.reservationUrl || theme.homepageUrl) && <div className="w-px h-9 bg-gray-300" />}
                    
                    {/* 좋아요 버튼 */}
                    {theme.recommendationEnabled !== false && (
                        <Button 
                            variant={liked ? "default" : "outline"}
                            onClick={onToggleLike}
                            disabled={isLiking}
                        >
                            <Heart 
                                className={`w-4 h-4 mr-2 ${liked ? "fill-current" : ""}`} 
                            />
                            {liked ? "좋아요 취소" : "좋아요"}
                        </Button>
                    )}
                    
                    {/* 공유하기 버튼 */}
                    <Button 
                        variant="outline"
                        onClick={onShare}
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        공유하기
                    </Button>
                </div>
        </div>
    );
};

export default ThemeHeader;
