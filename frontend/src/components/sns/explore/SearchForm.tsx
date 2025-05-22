import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchFormProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
}

const SearchForm: React.FC<SearchFormProps> = ({
  searchQuery,
  onSearchChange,
  onSubmit,
  onClear
}) => {
  return (
    <form onSubmit={onSubmit} className="mb-6">
      <div className="relative">
        <Input
          type="text"
          placeholder="검색 또는 #해시태그 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pr-10"
        />
        {searchQuery ? (
          <button
            type="button"
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          className="absolute right-0 top-0 h-full"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;