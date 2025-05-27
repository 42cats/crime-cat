import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Clock,
    Coins,
    Users,
    Star,
    DollarSign,
    Eye,
    MessageCircle,
    Trophy,
    Tag,
    Gauge,
    Globe,
    Calendar,
    Heart,
} from "lucide-react";
import { EscapeRoomTheme as EscapeRoomThemeType } from "@/lib/types";

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
            <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] rounded-xl overflow-hidden flex flex-col">
                {/* 썸네일 */}
                <div className="relative w-full h-48 overflow-hidden">
                    <img
                        src={
                            theme.thumbnail || "/content/image/default_escape_room_image.png"
                        }
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

                    {/* 비활성 상태 표시 */}
                    {theme.isOperating === false && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge
                                variant="secondary"
                                className="bg-gray-700 text-white"
                            >
                                운영종료
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
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-grow">
                        {theme.summary}
                    </p>
                    {/* 게임 정보 그리드 */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{participantText}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Coins className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                                {formatPrice(theme.price)}
                            </span>
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
                        {/* 난이도 별 표시 */}
                        <div className="flex items-center gap-1 ml-2">
                            <Gauge className="w-3 h-3 flex-shrink-0" />
                            {Array.from({ length: 5 }, (_, index) => (
                                <Star
                                    key={index}
                                    className={`w-3 h-3 ${
                                        index < Math.floor(theme.difficulty / 2)
                                            ? "text-yellow-400 fill-current"
                                            : "text-gray-300"
                                    }`}
                                />
                            ))}
                        </div>
                        {/* {theme.openDate && (
                            <div className="flex items-center gap-1">
                                <div className="text-sm">오픈</div>
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                    {new Date(
                                        theme.openDate
                                    ).toLocaleDateString("ko-KR")}
                                </span>
                            </div>
                        )} */}
                    </div>

                    {/* 위치 정보 */}
                    {theme.locations && theme.locations.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
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
                        <div className="flex flex-wrap gap-1 mb-3">
                            {theme.tags.slice(0, 3).map((tag, idx) => (
                                <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                </Badge>
                            ))}
                            {theme.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                    +{theme.tags.length - 3}
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
                                        window.open(
                                            theme.homepageUrl,
                                            "_blank",
                                            "noopener,noreferrer"
                                        );
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
                                        window.open(
                                            theme.reservationUrl,
                                            "_blank",
                                            "noopener,noreferrer"
                                        );
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                                >
                                    <Calendar className="w-3 h-3" />
                                    예약
                                </button>
                            )}
                        </div>
                    )}

                    {/* 하단 정보 */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{formatCount(theme.views || 0)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                <span>
                                    {formatCount(theme.recommendations || 0)}
                                </span>
                            </div>
                            {theme.playCount && theme.playCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <Trophy className="w-3 h-3" />
                                    <span>{formatCount(theme.playCount)}</span>
                                </div>
                            )}
                        </div>

                        {theme.createdAt && (
                            <div className="text-xs text-gray-400">
                                {new Date(theme.createdAt).toLocaleDateString(
                                    "ko-KR"
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default EscapeRoomThemeCard;
