import React from "react";
import { parsePostContent, truncateText, normalizeText } from "@/utils/postUtils";
import HashtagBadges from "./HashtagBadges";

interface PostContentPreviewProps {
  content: string;
  hashtags?: string[];
  maxTextLength?: number;
  maxHashtags?: number;
  maxLines?: number;
  showHashtags?: boolean;
  variant?: "light" | "dark";
  size?: "sm" | "md";
  compactHashtags?: boolean; // 그리드용 소형 해시태그
  className?: string;
}

const PostContentPreview: React.FC<PostContentPreviewProps> = ({
  content,
  hashtags,
  maxTextLength = 100,
  maxHashtags = 2,
  maxLines = 4,
  showHashtags = true,
  variant = "dark",
  size = "sm",
  compactHashtags = false,
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
  
  const lineClampClass = `line-clamp-${maxLines}`;

  const variantTextClasses = {
    light: "text-gray-800",
    dark: "text-white",
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* 일반 텍스트 */}
      {displayText && (
        <p className={`${textClasses[size]} ${variantTextClasses[variant]} ${lineClampClass} font-medium`}>
          {displayText}
        </p>
      )}
      
      {/* 해시태그 */}
      {showHashtags && displayHashtags.length > 0 && (
        <HashtagBadges
          hashtags={displayHashtags}
          maxDisplay={maxHashtags}
          size={compactHashtags ? "xs" : size}
          variant={variant}
          singleLine={compactHashtags}
          maxWidth={compactHashtags ? "100%" : undefined}
        />
      )}
    </div>
  );
};

export default PostContentPreview;
