import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface PostAuthorInfoProps {
    authorNickname: string;
    authorId: string;
    authorAvatarUrl?: string;
    createdAt: string;
    locationName?: string;
    onAuthorClick?: (authorId: string) => void;
    showAvatar?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const PostAuthorInfo: React.FC<PostAuthorInfoProps> = ({
    authorNickname,
    authorId,
    authorAvatarUrl,
    createdAt,
    locationName,
    onAuthorClick,
    showAvatar = true,
    size = "md",
    className = "",
}) => {
    const avatarSize =
        size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-10 h-10";
    const textSize =
        size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";
    const subtextSize = size === "sm" ? "text-xs" : "text-xs";

    const timeAgo = formatDistanceToNow(new Date(createdAt), {
        addSuffix: true,
        locale: ko,
    });

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {showAvatar && (
                <Avatar className={avatarSize}>
                    <AvatarImage
                        src={
                            authorAvatarUrl ||
                            "/content/image/default_profile_image.png"
                        }
                        alt={authorNickname}
                    />
                    <AvatarFallback className={textSize}>
                        {authorNickname.substring(0, 2)}
                    </AvatarFallback>
                </Avatar>
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onAuthorClick?.(authorId)}
                        className={`font-medium hover:underline truncate ${textSize}`}
                    >
                        {authorNickname}
                    </button>
                    <span
                        className={`text-muted-foreground ${subtextSize} shrink-0`}
                    >
                        {timeAgo}
                    </span>
                </div>
                {locationName && (
                    <p
                        className={`text-muted-foreground ${subtextSize} truncate`}
                    >
                        📍 {locationName}
                    </p>
                )}
            </div>
        </div>
    );
};

export default PostAuthorInfo;
