import React from "react";
import { Badge } from "@/components/ui/badge";
import { CommentList } from "@/components/comments";
import { CrimesceneThemeDetailType } from "@/lib/types";

interface ThemeCommentsProps {
    theme: CrimesceneThemeDetailType;
    gameThemeId: string;
    currentUserId?: string;
    hasPlayedGame: boolean;
    commentsRef: React.RefObject<HTMLDivElement>;
}

const ThemeComments: React.FC<ThemeCommentsProps> = ({
    theme,
    gameThemeId,
    currentUserId,
    hasPlayedGame,
    commentsRef,
}) => {
    if (!theme.commentEnabled) {
        return null;
    }
    return (
        <div className="bg-card rounded-lg border p-4" ref={commentsRef}>
            <CommentList
                gameThemeId={gameThemeId}
                currentUserId={currentUserId}
                hasPlayedGame={hasPlayedGame}
            />
        </div>
    );
};

export default ThemeComments;
