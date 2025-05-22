import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingAndEmptyStatesProps {
  isLoading: boolean;
  hasMore: boolean;
  posts: Array<any>;
  isSearching: boolean;
}

const LoadingAndEmptyStates: React.FC<LoadingAndEmptyStatesProps> = ({
  isLoading,
  hasMore,
  posts,
  isSearching
}) => {
  // 로딩 표시 (게시물이 있을 때)
  if (isLoading && posts.length > 0) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 더 이상 결과가 없음
  if (!isLoading && !hasMore && posts.length > 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        더 이상 표시할 게시물이 없습니다.
      </div>
    );
  }

  // 검색 결과 없음
  if (!isLoading && isSearching && posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg mb-2">검색 결과가 없습니다.</p>
        <p className="text-sm">다른 검색어를 입력해보세요.</p>
      </div>
    );
  }

  return null;
};

export default LoadingAndEmptyStates;