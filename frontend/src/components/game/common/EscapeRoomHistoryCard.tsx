import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Clock,
    Calendar,
    MapPin,
    Users,
    Star,
    Lightbulb,
    Trophy,
    X,
    AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
    EscapeRoomHistoryDetailResponse,
    SuccessStatus,
} from "@/types/integratedGameHistory";
import { cn } from "@/lib/utils";

interface EscapeRoomHistoryCardProps {
    history: EscapeRoomHistoryDetailResponse;
    onClick?: () => void;
    className?: string;
}

export const EscapeRoomHistoryCard: React.FC<EscapeRoomHistoryCardProps> = ({
    history,
    onClick,
    className,
}) => {
    const getSuccessStatusColor = (status: SuccessStatus) => {
        switch (status) {
            case SuccessStatus.SUCCESS:
                return "bg-green-100 text-green-800 border-green-200";
            case SuccessStatus.FAIL:
                return "bg-red-100 text-red-800 border-red-200";
            case SuccessStatus.PARTIAL:
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getSuccessStatusText = (status: SuccessStatus) => {
        switch (status) {
            case SuccessStatus.SUCCESS:
                return "성공";
            case SuccessStatus.FAIL:
                return "실패";
            case SuccessStatus.PARTIAL:
                return "부분성공";
            default:
                return status;
        }
    };

    const getSuccessIcon = (status: SuccessStatus) => {
        switch (status) {
            case SuccessStatus.SUCCESS:
                return <Trophy className="w-4 h-4" />;
            case SuccessStatus.FAIL:
                return <X className="w-4 h-4" />;
            case SuccessStatus.PARTIAL:
                return <AlertCircle className="w-4 h-4" />;
            default:
                return null;
        }
    };

    // 클리어 타임 진행률 계산 (60분 기준)
    const clearTimeProgress = history.clearTime
        ? Math.min((history.clearTime / 60) * 100, 100)
        : 0;

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
                <div className="relative w-48 h-36 flex-shrink-0">
                    <img
                        src={
                            history.themeThumbnail ||
                            "/content/image/default_image.png"
                        }
                        alt={history.escapeRoomThemeTitle}
                        className="w-full h-full object-cover"
                    />
                    {/* 성공 상태 오버레이 */}
                    <div className="absolute top-2 left-2">
                        <Badge
                            className={cn(
                                "flex items-center gap-1",
                                getSuccessStatusColor(history.successStatus)
                            )}
                        >
                            {getSuccessIcon(history.successStatus)}
                            {getSuccessStatusText(history.successStatus)}
                        </Badge>
                    </div>
                </div>

                {/* 내용 영역 */}
                <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-semibold text-lg mb-1">
                                {history.escapeRoomThemeTitle}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span>{history.storeName}</span>
                                {history.storeRegion && (
                                    <>
                                        <span>·</span>
                                        <span>{history.storeRegion}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        {history.isFirstPlay && (
                            <Badge
                                variant="secondary"
                                className="bg-purple-100 text-purple-800"
                            >
                                첫 플레이
                            </Badge>
                        )}
                    </div>

                    {/* 게임 정보 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        {/* 플레이 날짜 */}
                        <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>
                                {format(
                                    new Date(history.playDate),
                                    "yyyy.MM.dd",
                                    { locale: ko }
                                )}
                            </span>
                        </div>

                        {/* 클리어 시간 */}
                        {history.clearTime && (
                            <div className="flex items-center gap-1.5 text-sm">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span>
                                    {history.formattedClearTime ||
                                        `${history.clearTime}분`}
                                </span>
                            </div>
                        )}

                        {/* 팀 인원 */}
                        {history.teamSize && (
                            <div className="flex items-center gap-1.5 text-sm">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span>{history.teamSize}명</span>
                            </div>
                        )}

                        {/* 힌트 사용 */}
                        {history.hintCount !== undefined && (
                            <div className="flex items-center gap-1.5 text-sm">
                                <Lightbulb className="w-4 h-4 text-gray-500" />
                                <span>힌트 {history.hintCount}개</span>
                            </div>
                        )}
                    </div>

                    {/* 평가 정보 */}
                    <div className="flex items-center gap-4 mb-3">
                        {/* 난이도 평가 */}
                        {history.difficultyRating && (
                            <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-600">
                                    난이도
                                </span>
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                "w-4 h-4",
                                                i < history.difficultyRating!
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 재미 평가 */}
                        {history.funRating && (
                            <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-600">
                                    재미
                                </span>
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                "w-4 h-4",
                                                i < history.funRating!
                                                    ? "fill-blue-400 text-blue-400"
                                                    : "text-gray-300"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 스토리 평가 */}
                        {history.storyRating && (
                            <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-600">
                                    스토리
                                </span>
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                "w-4 h-4",
                                                i < history.storyRating!
                                                    ? "fill-purple-400 text-purple-400"
                                                    : "text-gray-300"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 클리어 타임 진행바 */}
                    {history.clearTime &&
                        history.successStatus === SuccessStatus.SUCCESS && (
                            <div className="mb-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-600">
                                        클리어 타임
                                    </span>
                                    <span className="text-xs text-gray-600">
                                        {history.clearTime}분 / 60분
                                    </span>
                                </div>
                                <Progress
                                    value={clearTimeProgress}
                                    className="h-2"
                                />
                            </div>
                        )}

                    {/* 메모 */}
                    {history.memo && (
                        <p
                            className={cn(
                                "text-sm text-gray-700 line-clamp-2 mb-2",
                                history.isSpoiler &&
                                    "blur-sm hover:blur-none transition-all"
                            )}
                        >
                            {history.memo}
                        </p>
                    )}

                    {/* 태그 */}
                    {history.themeTags && history.themeTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {history.themeTags.slice(0, 5).map((tag, index) => (
                                <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                >
                                    {tag}
                                </Badge>
                            ))}
                            {history.themeTags.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                    +{history.themeTags.length - 5}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* 하단 정보 */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={history.userAvatarUrl} />
                                <AvatarFallback>
                                    {history.userNickname?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-600">
                                {history.userNickname}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500">
                            {format(
                                new Date(history.createdAt),
                                "yyyy.MM.dd HH:mm",
                                { locale: ko }
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
};
