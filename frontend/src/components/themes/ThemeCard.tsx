import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { User, Users, Tag, Coins, Clock, Heart } from "lucide-react"; // Heart 추가
import { Theme } from "@/lib/types";

interface ThemeCardProps {
    theme: {
        id: string;
        title: string;
        description: string;
        thumbnail: string;
        tags: string[];
        makers: string[];
        players: string; // 인원수 문자열 형태
        price: number;
        time: number;
        recommendations: number; // <-- 추천 수
    };
    index: number;
}

const formatPlayTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}시간 ${mins}분`;
    if (hours > 0) return `${hours}시간`;
    return `${mins}분`;
};

const ThemeCard: React.FC<ThemeCardProps> = ({ theme }) => {
    return (
        <Link to={`/themes/${theme.id}`}>
            <Card className="hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden">
                {/* 이미지를 relative 컨테이너로 감싼 뒤, 오버레이 배치 */}
                <div className="relative w-full h-48">
                    <img
                        src={encodeURI(theme.thumbnail)}
                        alt={theme.title}
                        className="w-full h-full object-cover"
                    />
                    {/* 오른쪽 하단 오버레이 (하트 + 추천수) */}
                    <div className="absolute bottom-2 right-2 flex items-center bg-black/50 text-white rounded-full px-2 py-1">
                        <Heart className="w-4 h-4 text-red-500 fill-current mr-1" />
                        <span className="text-sm">{theme.recommendations}</span>
                    </div>
                </div>

                <CardContent className="p-4 space-y-2">
                    <h2 className="text-xl font-bold">{theme.title}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {theme.description}
                    </p>

                    <div className="flex flex-wrap gap-2 text-sm mt-2">
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Tag className="w-4 h-4" />
                            {theme.tags.join(", ")}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <User className="w-4 h-4" />
                            {theme.makers.join(", ")}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {theme.players}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Coins className="w-4 h-4" />₩
                            {theme.price.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {formatPlayTime(theme.time)}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default ThemeCard;
