import React from "react";
import { Badge } from "@/components/ui/badge";
import { CommentList } from "@/components/comments";
import { ThemeDetailType } from "@/lib/types";

interface ThemeCommentsProps {
  theme: ThemeDetailType;
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
    <div className="bg-card rounded-lg border p-6" ref={commentsRef}>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        댓글
        <Badge variant="outline" className="ml-2">
          {theme.comments?.length || 0}
        </Badge>
      </h2>
      <CommentList
        gameThemeId={gameThemeId}
        currentUserId={currentUserId}
        hasPlayedGame={hasPlayedGame}
      />
    </div>
  );
};

export default ThemeComments;