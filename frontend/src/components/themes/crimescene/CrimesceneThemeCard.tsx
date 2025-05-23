import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
    Users,
    Tag,
    Coins,
    Clock,
    Heart,
    Eye,
    MessageSquare,
    Star,
} from "lucide-react";
import { Theme } from "@/lib/types";

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

const formatCount = (num: number): string => {
    return num >= 1000
        ? (num / 1000).toFixed(1).replace(/\.0$/, "") + "k"
        : num.toString();
};

const CrimesceneThemeCard: React.FC<ThemeCardProps> = ({ theme }) => {
    const playerText =
        theme.playersMin === theme.playersMax
            ? `${theme.playersMin}인`
            : `${theme.playersMin}~${theme.playersMax}인`;

    return (
        <Link
            to={`/themes/${theme.type.toLowerCase()}/${theme.id}`}
            className="block h-full"
        >
            <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] rounded-xl overflow-hidden flex flex-col">
                {/* 썸네일 */}
                <div className="relative w-full h-48 overflow-hidden">
                    {" "}
                    {/* 고정 높이, 좌우 잘림 허용 */}
                    <img
                        src={
                            theme?.thumbnail ||
                            "/content/image/default_bar2.png"
                        }
                        alt={theme.title}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                    {/* 타입 뱃지 */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded">
                        {theme.type === "CRIMESCENE"
                            ? "크라임씬"
                            : theme.type === "ESCAPE_ROOM"
                            ? "방탈출"
                            : theme.type === "MURDER_MYSTERY"
                            ? "머더미스터리"
                            : "리얼월드"}
                    </div>
                    {/* 조회수 + 추천수 */}
                    <div className="absolute bottom-2 right-2 flex gap-2">
                        <div className="flex items-center bg-black/60 text-white rounded-full px-2 py-1 shadow-md">
                            <Eye className="w-3 h-3 mr-1" />
                            <span className="text-xs">
                                {formatCount(theme.views)}
                            </span>
                        </div>
                        {theme.recommendationEnabled && (
                            <div className="flex items-center bg-black/60 text-white rounded-full px-2 py-1 shadow-md">
                                <Heart className="w-3 h-3 text-red-500 fill-current mr-1" />
                                <span className="text-xs">
                                    {formatCount(theme.recommendations)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 내용 */}
                <CardContent className="p-4 flex-grow flex flex-col">
                    <h2 className="text-lg font-bold line-clamp-1">
                        {theme.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-2 flex-grow">
                        {theme.summary}
                    </p>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mt-auto text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{playerText}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Coins className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                                {theme.price.toLocaleString()}원
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                                {formatPlayTime(
                                    theme.playTimeMin,
                                    theme.playTimeMax
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-3 h-3 ${
                                            star <= theme.difficulty
                                                ? "text-yellow-500 fill-current"
                                                : "text-gray-300"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {theme.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {theme.tags.slice(0, 3).map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs bg-secondary px-2 py-0.5 rounded-full"
                                >
                                    {tag}
                                </span>
                            ))}
                            {theme.tags.length > 3 && (
                                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                                    +{theme.tags.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
};

export default CrimesceneThemeCard;
