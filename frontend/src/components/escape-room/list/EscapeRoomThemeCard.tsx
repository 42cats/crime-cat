import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Clock,
    Coins,
    Users,
    Eye,
    Trophy,
    Tag,
    Gauge,
    Globe,
    Calendar,
    Heart,
} from "lucide-react";
import { EscapeRoomTheme as EscapeRoomThemeType } from "@/lib/types";
import StarRating from "@/components/ui/star-rating";

interface EscapeRoomThemeCardProps {
    theme: EscapeRoomThemeType;
    index: number;
}

const EscapeRoomThemeCard: React.FC<EscapeRoomThemeCardProps> = ({ theme }) => {
    const formatPrice = (amount: number): string => {
        if (amount === 0) return "무료";
        return new Intl.NumberFormat("ko-KR").format(amount) + "원";
    };

    const formatDuration = (
        minTime: number | undefined,
        maxTime: number | undefined
    ): string => {
        // undefined 또는 NaN 체크
        if (!minTime || !maxTime || isNaN(minTime) || isNaN(maxTime)) {
            return "시간 정보 없음";
        }

        if (minTime === maxTime) {
            if (minTime < 60) return `${minTime}분`;
            const hours = Math.floor(minTime / 60);
            const remainingMinutes = minTime % 60;
            return remainingMinutes > 0
                ? `${hours}시간 ${remainingMinutes}분`
                : `${hours}시간`;
        }
        return `${minTime}-${maxTime}분`;
    };

    const formatCount = (num: number): string => {
        return num >= 1000
            ? (num / 1000).toFixed(1).replace(/\.0$/, "") + "k"
            : num.toString();
    };

    const getDifficultyLabel = (
        difficulty: number
    ): { label: string; color: string } => {
        if (difficulty <= 2)
            return { label: "매우 쉬움", color: "bg-green-100 text-green-800" };
        if (difficulty <= 4)
            return { label: "쉬움", color: "bg-blue-100 text-blue-800" };
        if (difficulty <= 6)
            return { label: "보통", color: "bg-yellow-100 text-yellow-800" };
        if (difficulty <= 8)
            return { label: "어려움", color: "bg-orange-100 text-orange-800" };
        return { label: "매우 어려움", color: "bg-red-100 text-red-800" };
    };

    const participantText = (() => {
        if (
            !theme.playersMin ||
            !theme.playersMax ||
            isNaN(theme.playersMin) ||
            isNaN(theme.playersMax)
        ) {
            return "인원 정보 없음";
        }
        return theme.playersMin === theme.playersMax
            ? `${theme.playersMin}명`
            : `${theme.playersMin}-${theme.playersMax}명`;
    })();

    const difficultyInfo = getDifficultyLabel(theme.difficulty);

    return (
        <Link to={`/themes/escape-room/${theme.id}`} className="block h-full">
            <Card className="h-80 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] rounded-xl overflow-hidden relative group bg-transparent border-0">
                {/* 배경 이미지 */}
                <div className="absolute inset-0 w-full h-full">
                    <img
                        src={
                            theme.thumbnail ||
                            "/content/image/default_escape_room_image.png"
                        }
                        alt={theme.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                                "/content/image/default_escape_room_image.png";
                        }}
                    />
                    {/* 그라디언트 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                </div>

                {/* 콘텐츠 오버레이 */}
                <div className="relative z-10 p-3 h-full flex flex-col">
                    {/* 상단 정보 */}
                    <div className="flex justify-between items-start">
                        {/* 타입 뱃지와 난이도 */}
                        <div className="flex gap-2">
                            <div className="bg-black/60 text-white text-xs font-medium px-2 py-1 rounded">
                                방탈출
                            </div>
                            <Badge
                                className={`text-xs ${difficultyInfo.color}`}
                            >
                                {difficultyInfo.label}
                            </Badge>
                        </div>

                        {/* 통계 정보 */}
                        <div className="flex gap-2">
                            {theme.views !== undefined && (
                                <div className="flex items-center bg-black/60 text-white rounded-full px-2 py-1 shadow-md">
                                    <Eye className="w-3 h-3 mr-1" />
                                    <span className="text-xs">
                                        {formatCount(theme.views)}
                                    </span>
                                </div>
                            )}
                            {theme.recommendations !== undefined && (
                                <div className="flex items-center bg-black/60 text-white rounded-full px-2 py-1 shadow-md">
                                    <Heart className="w-3 h-3 mr-1 text-red-400" />
                                    <span className="text-xs">
                                        {formatCount(theme.recommendations)}
                                    </span>
                                </div>
                            )}
                            {theme.playCount !== undefined &&
                                theme.playCount > 0 && (
                                    <div className="flex items-center bg-black/60 text-white rounded-full px-2 py-1 shadow-md">
                                        <Trophy className="w-3 h-3 mr-1 text-yellow-400" />
                                        <span className="text-xs">
                                            {formatCount(theme.playCount)}
                                        </span>
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* 하단 정보 */}
                    <div className="mt-auto space-y-2">
                        {/* 제목과 설명 */}
                        <div>
                            <h2 className="text-lg font-bold text-white line-clamp-1 mb-1">
                                {theme.title}
                            </h2>
                            <p className="text-sm text-white/80 line-clamp-2">
                                {theme.summary}
                            </p>
                        </div>

                        {/* 게임 정보 */}
                        <div className="space-y-1.5 text-xs text-white/90">
                            <div className="grid grid-cols-2 gap-x-3">
                                <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">
                                        {participantText}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Coins className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">
                                        {formatPrice(theme.price)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                    {formatDuration(
                                        theme.playTimeMin,
                                        theme.playTimeMax
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Gauge className="w-3 h-3 flex-shrink-0" />
                                <StarRating
                                    rating={theme.difficulty}
                                    size="sm"
                                    readOnly
                                    isOneToTen={true}
                                />
                            </div>
                        </div>

                        {/* 위치 정보 */}
                        {theme.locations && theme.locations.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-white/90">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                    {theme.locations[0].storeName}
                                    {theme.locations.length > 1 &&
                                        ` 외 ${theme.locations.length - 1}곳`}
                                </span>
                            </div>
                        )}

                        {/* 태그 */}
                        {theme.tags && theme.tags.length > 0 && (
                            <div className="flex gap-1 overflow-hidden">
                                {theme.tags.slice(0, 3).map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap flex-shrink-0 flex items-center gap-1"
                                    >
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                    </span>
                                ))}
                                {theme.tags.length > 3 && (
                                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap flex-shrink-0">
                                        +{theme.tags.length - 3}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* URL 버튼들 */}
                        {(theme.homepageUrl || theme.reservationUrl) && (
                            <div className="flex gap-2">
                                {theme.homepageUrl && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            window.open(
                                                theme.homepageUrl,
                                                "_blank",
                                                "noopener,noreferrer"
                                            );
                                        }}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/80 text-white rounded-full hover:bg-blue-600/80 transition-colors backdrop-blur-sm"
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
                                            window.open(
                                                theme.reservationUrl,
                                                "_blank",
                                                "noopener,noreferrer"
                                            );
                                        }}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500/80 text-white rounded-full hover:bg-green-600/80 transition-colors backdrop-blur-sm"
                                    >
                                        <Calendar className="w-3 h-3" />
                                        예약
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 비활성 상태 표시 */}
                {theme.isOperating === false && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                        <Badge
                            variant="secondary"
                            className="bg-gray-700 text-white"
                        >
                            운영종료
                        </Badge>
                    </div>
                )}
            </Card>
        </Link>
    );
};

export default EscapeRoomThemeCard;
