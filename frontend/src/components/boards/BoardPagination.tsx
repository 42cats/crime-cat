import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface BoardPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const BoardPagination: React.FC<BoardPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // 페이지 번호 배열 생성 (최대 5개)
  const getPageNumbers = () => {
    const pageNumbers: number[] = [];
    const maxPagesToShow = 5;
    
    // 시작 페이지와 끝 페이지 계산
    let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);
    
    // 시작 페이지 재조정 (끝 페이지가 최대치보다 작을 경우)
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  if (totalPages <= 1) return null;

  return (
    <Pagination className="flex justify-center">
      <PaginationContent className="flex flex-wrap">
        {/* 이전 페이지 버튼 */}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 0) onPageChange(currentPage - 1);
            }}
            className={`text-xs ${currentPage === 0 ? 'pointer-events-none opacity-50' : ''}`}
          />
        </PaginationItem>
        
        {/* 첫 페이지로 가기 (현재 페이지가 3보다 클 때만) */}
        {currentPage > 2 && (
          <>
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(0);
                }}
                className="text-xs h-9 w-9"
              >
                1
              </PaginationLink>
            </PaginationItem>
            
            {currentPage > 3 && (
              <PaginationItem>
                <PaginationEllipsis className="h-9" />
              </PaginationItem>
            )}
          </>
        )}
        
        {/* 페이지 번호 */}
        {getPageNumbers().map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(pageNumber);
              }}
              isActive={currentPage === pageNumber}
              className="text-xs h-9 w-9"
            >
              {pageNumber + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        
        {/* 마지막 페이지로 가기 (현재 페이지가 마지막 페이지에서 3페이지 이상 떨어져 있을 때만) */}
        {currentPage < totalPages - 3 && (
          <>
            {currentPage < totalPages - 4 && (
              <PaginationItem>
                <PaginationEllipsis className="h-9" />
              </PaginationItem>
            )}
            
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(totalPages - 1);
                }}
                className="text-xs h-9 w-9"
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}
        
        {/* 다음 페이지 버튼 */}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages - 1) onPageChange(currentPage + 1);
            }}
            className={`text-xs ${currentPage === totalPages - 1 ? 'pointer-events-none opacity-50' : ''}`}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default BoardPagination;
