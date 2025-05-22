import React from 'react';
import { Button } from '@/components/ui/button';

interface PopularHashtagsProps {
  hashtags: Array<{
    id: string;
    name: string;
    useCount?: number;
  }>;
  onHashtagClick: (tag: string) => void;
  isVisible: boolean;
}

const PopularHashtags: React.FC<PopularHashtagsProps> = ({
  hashtags,
  onHashtagClick,
  isVisible
}) => {
  if (!isVisible || hashtags.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-muted-foreground mb-2">
        인기 해시태그
      </h2>
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag) => (
          <Button
            key={tag.id}
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => onHashtagClick(tag.name)}
          >
            #{tag.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PopularHashtags;