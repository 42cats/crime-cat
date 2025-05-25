import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Calendar,
    Users,
    Trophy,
    X,
    Home,
    Book,
    Edit,
    User,
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import {
    UserGameHistoryDto,
    UserGameHistoryToUserDto,
} from "@/types/integratedGameHistory";
import { cn } from "@/lib/utils";

interface CrimeSceneHistoryCardProps {
    history: UserGameHistoryToUserDto;
    onClick?: () => void;
    onEdit?: () => void;
    className?: string;
    isEditable?: boolean;
}

export const CrimeSceneHistoryCard: React.FC<CrimeSceneHistoryCardProps> = ({
    history,
    onClick,
    onEdit,
    className,
    isEditable = false,
}) => {
    const formatDate = (
        dateString: string | undefined | null,
        formatString: string = "yyyy.MM.dd"
    ) => {
        if (!dateString) return "날짜 없음";
        try {
            const date =
                typeof dateString === "string"
                    ? parseISO(dateString)
                    : new Date(dateString);
            return isValid(date)
                ? format(date, formatString, { locale: ko })
                : "날짜 없음";
        } catch {
            return "날짜 없음";
        }
    };
    const getWinStatusColor = (isWin: boolean) => {
        return isWin
            ? "bg-green-100 text-green-800 border-green-200"
            : "bg-red-100 text-red-800 border-red-200";
    };

    const getWinStatusText = (isWin: boolean) => {
        return isWin ? "승리" : "패배";
    };

    const getWinIcon = (isWin: boolean) => {
        return isWin ? (
            <Trophy className="w-4 h-4" />
        ) : (
            <X className="w-4 h-4" />
        );
    };

    return (
        <Card
            className={cn(
                "hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden",
                className
            )}
            onClick={onClick}
        >
            <div className="flex">
                {/* 썸네일 영역 */}
                <div className="relative w-48 h-36 flex-shrink-0 overflow-hidden">
                    {history.themeThumbnail ? (
                        <img
                            src={history.themeThumbnail}
                            alt={history.themeName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                            <Home className="w-16 h-16 text-purple-400" />
                        </div>
                    )}
                    {/* 승리 상태 오버레이 */}
                    <div className="absolute top-2 left-2">
                        <Badge
                            className={cn(
                                "flex items-center gap-1",
                                getWinStatusColor(history.isWin)
                            )}
                        >
                            {getWinIcon(history.isWin)}
                            {getWinStatusText(history.isWin)}
                        </Badge>
                    </div>
                </div>

                {/* 내용 영역 */}
                <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">
                                {history.themeName || "크라임씬 테마"}
                            </h3>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="w-4 h-4" />
                                    <span>
                                        {history.guildName || "길드 정보 없음"}
                                    </span>
                                </div>
                                {history.characterName && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <User className="w-4 h-4" />
                                        <span>
                                            캐릭터: {history.characterName}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isEditable && onEdit && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit();
                                    }}
                                    className="h-8 w-8 p-0"
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* 게임 정보 */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        {/* 플레이 날짜 */}
                        <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>
                                {formatDate(
                                    history.createdAt || history.createdAt
                                )}
                            </span>
                        </div>

                        {/* 기록 날짜 */}
                        <div className="flex items-center gap-1.5 text-sm">
                            <Book className="w-4 h-4 text-gray-500" />
                            <span>기록일: {formatDate(history.createdAt)}</span>
                        </div>
                    </div>

                    {/* 하단 정보 */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                            <span className="text-xl text-gray-600">
                                {history.memo}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
