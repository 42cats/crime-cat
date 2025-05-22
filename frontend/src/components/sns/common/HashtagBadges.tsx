import React from "react";

interface HashtagBadgesProps {
  hashtags: string[];
  maxDisplay?: number;
  size?: "sm" | "md";
  variant?: "light" | "dark";
  className?: string;
}

const HashtagBadges: React.FC<HashtagBadgesProps> = ({
  hashtags,
  maxDisplay = 3,
  size = "sm",
  variant = "light",
  className = "",
}) => {
  if (!hashtags || hashtags.length === 0) {
    return null;
  }

  const displayHashtags = hashtags.slice(0, maxDisplay);
  const remainingCount = hashtags.length - maxDisplay;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
  };

  const variantClasses = {
    light: "bg-blue-100 text-blue-700 border-blue-200",
    dark: "bg-blue-900/80 text-blue-100 border-blue-700/50",
  };

  const baseClasses = `inline-flex items-center rounded-full border font-medium ${sizeClasses[size]} ${variantClasses[variant]}`;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayHashtags.map((hashtag, index) => (
        <span key={`${hashtag}-${index}`} className={baseClasses}>
          #{hashtag}
        </span>
      ))}
      
      {remainingCount > 0 && (
        <span className={`${baseClasses} opacity-75`}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

export default HashtagBadges;
