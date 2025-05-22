import React from "react";
import { parsePostContent, truncateText, normalizeText } from "@/utils/postUtils";
import HashtagBadges from "./HashtagBadges";

interface PostContentPreviewProps {
  content: string;
  hashtags?: string[];
  maxTextLength?: number;
  maxHashtags?: number;
  showHashtags?: boolean;
  variant?: "light" | "dark";
  size?: "sm" | "md";
  className?: string;
}

const PostContentPreview: React.FC<PostContentPreviewProps> = ({
  content,
  hashtags,
  maxTextLength = 80,
  maxHashtags = 3,
  showHashtags = true,
  variant = "dark",
  size = "sm",
  className = "",
}) => {
  const { plainText, hashtags: parsedHashtags } = parsePostContent(content, hashtags);
  
  // 텍스트 정리 및 자르기
  const normalizedText = normalizeText(plainText);
  const displayText = truncateText(normalizedText, maxTextLength);
  
  // 표시할 해시태그 결정
  const displayHashtags = hashtags || parsedHashtags;

  const textClasses = {
    sm: "text-xs leading-relaxed",
    md: "text-sm leading-relaxed",
  };

  const variantTextClasses = {
    light: "text-gray-800",
    dark: "text-white",
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 일반 텍스트 */}
      {displayText && (
        <p className={`${textClasses[size]} ${variantTextClasses[variant]} line-clamp-3 font-medium`}>
          {displayText}
        </p>
      )}
      
      {/* 해시태그 */}
      {showHashtags && displayHashtags.length > 0 && (
        <HashtagBadges
          hashtags={displayHashtags}
          maxDisplay={maxHashtags}
          size={size}
          variant={variant}
        />
      )}
    </div>
  );
};

export default PostContentPreview;
