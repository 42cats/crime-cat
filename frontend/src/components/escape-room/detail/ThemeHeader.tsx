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
    Edit,
    Trash2,
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
    canEdit?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    likeCount?: number;
}

const ThemeHeader: React.FC<ThemeHeaderProps> = ({
    theme,
    liked = false,
    onToggleLike,
    onShare,
    isLiking = false,
    canEdit = false,
    onEdit,
    onDelete,
    likeCount,
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
                            src={theme.thumbnail  ?? "/content/image/default_crime_scene_image.png"}
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
            {/* 버튼 그룹 - 중앙 정렬 */}
            <div className="flex flex-col items-center gap-3">
                {/* 첫 번째 줄 - 예약/홈페이지 */}
                {(theme.reservationUrl || theme.homepageUrl) && (
                    <div className="flex gap-3">
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
                    </div>
                )}

                {/* 두 번째 줄 - 좋아요/공유하기 */}
                <div className="flex gap-3">
                    {/* 좋아요 버튼 */}
                    {theme.recommendationEnabled !== false && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleLike}
                            disabled={isLiking}
                            className="flex items-center gap-2"
                        >
                            <Heart
                                className={`w-5 h-5 ${
                                    liked ? "fill-red-500 text-red-500" : ""
                                }`}
                            />
                            좋아요
                            <span className="font-medium">
                                {likeCount !== undefined
                                    ? likeCount
                                    : theme.recommendations || 0}
                            </span>
                        </Button>
                    )}

                    {/* 공유하기 버튼 */}
                    <Button variant="ghost" size="sm" onClick={onShare}>
                        <Share2 className="w-5 h-5" />
                        공유하기
                    </Button>

                    {/* 수정/삭제 버튼 - 작성자만 보임 */}
                    {canEdit && (
                        <>
                            <Button variant="ghost" size="sm" onClick={onEdit}>
                                <Edit className="w-5 h-5" />
                                수정
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onDelete}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="w-5 h-5" />
                                삭제
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThemeHeader;
