import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
    Users,
    Coins,
    Clock,
    Gauge,
    Heart,
    Eye,
} from "lucide-react";
import { Theme } from "@/lib/types";
import { OptimizedImage } from "@/components/ui/optimized-image";
import StarRating from "@/components/ui/star-rating";

interface ThemeCardProps {
    theme: Theme;
    index: number;
}

const formatPlayTime = (min: number, max: number): string => {
    const toHourText = (m: number) => {
        const h = Math.floor(m / 60);
        const mm = m % 60;
        return `${h > 0 ? `${h}시간` : ""}${mm > 0 ? ` ${mm}분` : ""}`.trim();
    };

    return min === max
        ? toHourText(min)
        : `${toHourText(min)} ~ ${toHourText(max)}`;
};

const formatCount = (num: number | undefined): string => {
    if (num === undefined || num === null) return "0";
    return num >= 1000
        ? (num / 1000).toFixed(1).replace(/\.0$/, "") + "k"
        : num.toString();
};

const CrimesceneThemeCard: React.FC<ThemeCardProps> = ({ theme }) => {
    const playerText =
        theme.playersMin === theme.playersMax
            ? `${theme.playersMin || 0}인`
            : `${theme.playersMin || 0}~${theme.playersMax || 0}인`;

    // type이 없을 경우 기본값 설정
    const themeType = theme.type?.toLowerCase() || "crimescene";

    return (
        <Link to={`/themes/${themeType}/${theme.id}`} className="block h-full">
            <Card className="h-80 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] rounded-xl overflow-hidden relative group">
                {/* 배경 이미지 */}
                <div className="absolute inset-0 w-full h-full">
                    <OptimizedImage
                        src={
                            theme?.thumbnail ||
                            "/content/image/default_crime_scene_image.png"
                        }
                        alt={theme.title}
                        fallback="/content/image/default_crime_scene_image.png"
                        placeholder="blur"
                        className="w-full h-full object-cover"
                    />
                    {/* 그라디언트 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                </div>

                {/* 콘텐츠 오버레이 */}
                <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                    {/* 상단 정보 */}
                    <div className="flex justify-between items-start">
                        {/* 타입 뱃지 */}
                        <div className="bg-black/60 text-white text-xs font-medium px-2 py-1 rounded">
                            {theme.type === "CRIMESCENE"
                                ? "크라임씬"
                                : theme.type === "ESCAPE_ROOM"
                                ? "방탈출"
                                : theme.type === "MURDER_MYSTERY"
                                ? "머더미스터리"
                                : "리얼월드"}
                        </div>
                        
                        {/* 조회수 + 추천수 */}
                        <div className="flex gap-2">
                            <div className="flex items-center bg-black/60 text-white rounded-full px-2 py-1 shadow-md">
                                <Eye className="w-3 h-3 mr-1" />
                                <span className="text-xs">
                                    {formatCount(theme.views || 0)}
                                </span>
                            </div>
                            {theme.recommendationEnabled && (
                                <div className="flex items-center bg-black/60 text-white rounded-full px-2 py-1 shadow-md">
                                    <Heart className="w-3 h-3 text-red-500 fill-current mr-1" />
                                    <span className="text-xs">
                                        {formatCount(theme.recommendations || 0)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 하단 정보 */}
                    <div className="space-y-3">
                        {/* 제목과 설명 */}
                        <div>
                            <h2 className="text-lg font-bold text-white line-clamp-1 mb-1">
                                {theme.title || "제목 없음"}
                            </h2>
                            <p className="text-sm text-white/80 line-clamp-2">
                                {theme.summary || "설명이 없습니다."}
                            </p>
                        </div>

                        {/* 게임 정보 */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-white/90">
                            <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{playerText}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Coins className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                    {(theme.price || 0).toLocaleString()}원
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                    {formatPlayTime(
                                        theme.playTimeMin || 0,
                                        theme.playTimeMax || 0
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Gauge className="w-3 h-3 flex-shrink-0" />
                                <StarRating 
                                    rating={theme.difficulty || 0}
                                    size="sm"
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* 태그 */}
                        {theme.tags && theme.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {theme.tags.slice(0, 3).map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm"
                                    >
                                        {tag}
                                    </span>
                                ))}
                                {theme.tags.length > 3 && (
                                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                                        +{theme.tags.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </Link>
    );
};

export default CrimesceneThemeCard;
