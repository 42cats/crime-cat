import React from "react";
import { NavigateFunction } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Edit, Trash, FileText } from "lucide-react";
import { ThemeDetailType } from "@/lib/types";

interface ThemeActionsProps {
    theme: ThemeDetailType;
    liked: boolean;
    user: any;
    navigate: NavigateFunction;
    hasRole: (roles: string[]) => boolean;
    onToggleLike: () => void;
    onShare: () => void;
    onRequestRecord: () => void;
    hasPlayedGame: boolean;
    onDelete: () => void;
}

const ThemeActions: React.FC<ThemeActionsProps> = ({
    theme,
    liked,
    user,
    navigate,
    hasRole,
    onToggleLike,
    onShare,
    onRequestRecord,
    hasPlayedGame,
    onDelete,
}) => {
    return (
        <div className="flex flex-wrap gap-2 mb-6 justify-end">
            {theme.recommendationEnabled && (
                <Button
                    variant="outline"
                    size="sm"
                    className={`group ${liked ? "text-red-500" : ""}`}
                    onClick={onToggleLike}
                >
                    <Heart
                        className={`h-4 w-4 mr-1 ${
                            liked
                                ? "fill-red-500"
                                : "group-hover:fill-red-500/10"
                        }`}
                    />
                    좋아요 {theme.recommendations}
                </Button>
            )}

            <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="h-4 w-4 mr-1" />
                공유하기
            </Button>

            {user?.id && !hasPlayedGame && (
                <Button variant="outline" size="sm" onClick={onRequestRecord}>
                    <FileText className="h-4 w-4 mr-1" />
                    기록 요청
                </Button>
            )}

            {(user?.id === theme.author.id ||
                hasRole(["ADMIN", "MANAGER"])) && (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            navigate(
                                `/themes/${theme.type.toLowerCase()}/edit/${
                                    theme.id
                                }`
                            )
                        }
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        수정
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={onDelete}
                    >
                        <Trash className="h-4 w-4 mr-1" />
                        삭제
                    </Button>
                </>
            )}
        </div>
    );
};

export default ThemeActions;
