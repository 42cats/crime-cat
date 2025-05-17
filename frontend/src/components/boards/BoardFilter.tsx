import React from 'react';
import { BoardPostSortType } from '@/lib/types/board';
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
import { Search, SortAsc, Filter } from 'lucide-react';

interface BoardFilterProps {
  sortType: BoardPostSortType;
  onSortChange: (sort: BoardPostSortType) => void;
  keyword: string;
  onKeywordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
}

const BoardFilter: React.FC<BoardFilterProps> = ({
  sortType,
  onSortChange,
  keyword,
  onKeywordChange,
  onSearch
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const getSortTypeName = (sortType: BoardPostSortType): string => {
    switch (sortType) {
      case BoardPostSortType.LATEST:
        return '최신순';
      case BoardPostSortType.OLDEST:
        return '오래된순';
      case BoardPostSortType.VIEWS:
        return '조회수순';
      case BoardPostSortType.LIKES:
        return '추천순';
      default:
        return '최신순';
    }
  };

  return (
    <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center w-full md:w-auto">
      {/* 검색 조건 선택 */}
      <div className="flex items-center mr-0 md:mr-2 w-full md:w-auto">
        <Select defaultValue="all">
          <SelectTrigger className="w-full md:w-[140px] h-9 text-xs">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="title">제목</SelectItem>
            <SelectItem value="content">내용</SelectItem>
            <SelectItem value="author">작성자</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 검색창 */}
      <div className="relative flex-grow max-w-full md:max-w-sm">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
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
            <DropdownMenuRadioGroup value={sortType} onValueChange={(value) => onSortChange(value as BoardPostSortType)}>
              <DropdownMenuRadioItem value={BoardPostSortType.LATEST} className="text-xs">최신순</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value={BoardPostSortType.OLDEST} className="text-xs">오래된순</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value={BoardPostSortType.VIEWS} className="text-xs">조회수순</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value={BoardPostSortType.LIKES} className="text-xs">추천순</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default BoardFilter;
