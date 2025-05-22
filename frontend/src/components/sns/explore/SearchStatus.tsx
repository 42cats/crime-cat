import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SearchStatusProps {
  isSearching: boolean;
  searchQuery: string;
  onClearSearch: () => void;
}

const SearchStatus: React.FC<SearchStatusProps> = ({
  isSearching,
  searchQuery,
  onClearSearch
}) => {
  if (!isSearching) {
    return null;
  }

  return (
    <div className="mb-6 flex items-center justify-between">
      <p className="text-sm">
        <span className="font-medium">{searchQuery}</span>{" "}
        검색 결과
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSearch}
      >
        <X className="h-4 w-4 mr-1" />
        검색 취소
      </Button>
    </div>
  );
};

export default SearchStatus;