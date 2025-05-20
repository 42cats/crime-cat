import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Users, Tag, Coins, Clock, Heart, Eye, MessageSquare } from "lucide-react";
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

const ThemeCard: React.FC<ThemeCardProps> = ({ theme }) => {
    const playerText =
        theme.playersMin === theme.playersMax
            ? `${theme.playersMin}인`
            : `${theme.playersMin}~${theme.playersMax}인`;

    return (
        <Link to={`/themes/${theme.type.toLowerCase()}/${theme.id}`}>
            <Card className="hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden">
                {/* 썸네일 */}
                <div className="relative w-full h-48">
                    <img
                        src={`${
                            theme?.thumbnail ||
                            "/content/image/default_bar2.png"
                        }`}
                        alt={theme.title}
                        className="w-full h-full object-cover"
                    />

                {/* 조회수 + 추천수 */}
                <div className="absolute bottom-2 right-2 flex gap-2">
                    <div className="flex items-center bg-black/60 text-white rounded-full px-2 py-1 shadow-md">
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="text-xs">{formatCount(theme.views)}</span>
                    </div>
                    {theme.recommendationEnabled && (
                        <div className="flex items-center bg-black/60 text-white rounded-full px-2 py-1 shadow-md">
                            <Heart className="w-4 h-4 text-red-500 fill-current mr-1" />
                            <span className="text-xs">{formatCount(theme.recommendations)}</span>
                        </div>
                    )}
                    </div>
              </div>

                {/* 내용 */}
                <CardContent className="p-4 space-y-2">
                    <h2 className="text-xl font-bold">{theme.title}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {theme.summary}
                    </p>

                    <div className="flex flex-wrap gap-2 text-sm mt-2 text-muted-foreground">
                        {theme.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Tag className="w-4 h-4" />
                                {theme.tags.join(", ")}
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {playerText}
                        </div>
                        <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4" />
                            {theme.price.toLocaleString()}원
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatPlayTime(
                                theme.playTimeMin,
                                theme.playTimeMax
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default ThemeCard;
