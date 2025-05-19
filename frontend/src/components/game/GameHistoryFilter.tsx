import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SortAsc } from 'lucide-react';

interface GameHistoryFilterProps {
  sortType: string;
  onSortChange: (sort: any) => void;
  keyword: string;
  onKeywordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  searchField: string;
  onSearchFieldChange: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const GameHistoryFilter: React.FC<GameHistoryFilterProps> = ({
  sortType,
  onSortChange,
  keyword,
  onKeywordChange,
  onSearch,
  searchField,
  onSearchFieldChange,
  inputRef
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const getSortTypeName = (sortType: string): string => {
    switch (sortType) {
      case 'LATEST':
        return '최신순';
      case 'OLDEST':
        return '오래된순';
      case 'GUILDNAME':
        return '길드 가나다순';
      default:
        return '최신순';
    }
  };

  return (
    <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center w-full mb-4">
      {/* 검색 조건 선택 */}
      <div className="flex items-center mr-0 md:mr-2 w-full md:w-auto">
        <Select 
          value={searchField} 
          onValueChange={onSearchFieldChange}
        >
          <SelectTrigger className="w-full md:w-[140px] h-9 text-xs">
            <SelectValue placeholder="검색 조건" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="guildName">길드 이름</SelectItem>
            <SelectItem value="characterName">캐릭터 이름</SelectItem>
            <SelectItem value="themeName">테마 이름</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 검색창 */}
      <div className="relative flex-grow max-w-full md:max-w-sm">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="검색어를 입력하세요"
            className="pl-8 pr-20 h-9 text-sm"
            value={keyword}
            onChange={onKeywordChange}
            onKeyDown={handleKeyDown}
          />
          <Button 
            type="button" 
            size="sm" 
            onClick={onSearch}
            className="absolute right-0 h-9 text-xs px-3 rounded-l-none"
          >
            검색
          </Button>
        </div>
      </div>

      {/* 정렬 드롭다운 */}
      <div className="md:ml-auto flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 flex items-center gap-1 text-xs ml-0 md:ml-2">
              <SortAsc className="h-3.5 w-3.5" />
              <span>{getSortTypeName(sortType)}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuRadioGroup value={sortType} onValueChange={onSortChange}>
              <DropdownMenuRadioItem value="LATEST" className="text-xs">최신순</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="OLDEST" className="text-xs">오래된순</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="GUILDNAME" className="text-xs">길드 가나다순</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default GameHistoryFilter;