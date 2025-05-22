import React from "react";

interface HashtagBadgesProps {
  hashtags: string[];
  maxDisplay?: number;
  size?: "xs" | "sm" | "md";
  variant?: "light" | "dark";
  singleLine?: boolean;
  maxWidth?: string;
  className?: string;
}

const HashtagBadges: React.FC<HashtagBadgesProps> = ({
  hashtags,
  maxDisplay = 3,
  size = "sm",
  variant = "light",
  singleLine = false,
  maxWidth,
  className = "",
}) => {
  if (!hashtags || hashtags.length === 0) {
    return null;
  }

  const displayHashtags = hashtags.slice(0, maxDisplay);
  const remainingCount = hashtags.length - maxDisplay;

  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 leading-tight",
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
  };

  const variantClasses = {
    light: "bg-blue-100 text-blue-700 border-blue-200",
    dark: "bg-blue-900/80 text-blue-100 border-blue-700/50",
  };

  const baseClasses = `inline-flex items-center rounded-full border font-medium ${sizeClasses[size]} ${variantClasses[variant]}`;

  const containerClasses = singleLine 
    ? "flex items-center gap-1 overflow-hidden" 
    : "flex flex-wrap gap-1";
    
  const containerStyle = maxWidth ? { maxWidth } : {};

  return (
    <div 
      className={`${containerClasses} ${className}`}
      style={containerStyle}
    >
      {displayHashtags.map((hashtag, index) => (
        <span 
          key={`${hashtag}-${index}`} 
          className={`${baseClasses} ${singleLine ? 'flex-shrink-0' : ''}`}
          title={`#${hashtag}`} // 툴팁으로 전체 해시태그 표시
        >
          #{hashtag}
        </span>
      ))}
      
      {remainingCount > 0 && (
        <span 
          className={`${baseClasses} opacity-75 ${singleLine ? 'flex-shrink-0' : ''}`}
          title={`${remainingCount}개의 추가 해시태그`}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

export default HashtagBadges;
