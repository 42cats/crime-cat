import React from 'react';
import { Button } from '@/components/ui/button';

interface GamePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

const GamePagination: React.FC<GamePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false
}) => {
  // 현재 페이지 주변으로 최대 5개의 페이지 번호만 표시
  const getPageNumbers = (): number[] => {
    // 5개만 표시하고 중앙에 현재 페이지가 오도록 조정
    let startPage = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
    if (totalPages <= 5) startPage = 0;
    
    return Array.from(
      { length: Math.min(totalPages, 5) },
      (_, i) => startPage + i
    );
  };

  return (
    <div className="flex flex-wrap justify-center items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 0 || disabled}
        onClick={() => onPageChange(Math.max(currentPage - 1, 0))}
      >
        이전
      </Button>
      
      {getPageNumbers().map(pageNum => (
        <Button
          key={pageNum}
          variant={currentPage === pageNum ? "default" : "outline"}
          size="sm"
          disabled={disabled}
          onClick={() => onPageChange(pageNum)}
          className="min-w-8"
        >
          {pageNum + 1}
        </Button>
      ))}
      
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages - 1 || disabled}
        onClick={() => onPageChange(currentPage + 1)}
      >
        다음
      </Button>
    </div>
  );
};

export default GamePagination;