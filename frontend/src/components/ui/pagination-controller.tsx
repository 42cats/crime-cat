import * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export interface PaginationControllerProps {
  totalPages: number;
  currentPage: number; // 1-based (페이지 번호는 1부터 시작)
  onPageChange: (page: number) => void;
}

/**
 * PaginationController - 페이지네이션 로직을 처리하는 컴포넌트
 * 
 * 총 페이지 수, 현재 페이지, 페이지 변경 콜백을 받아서
 * 실제 페이지네이션 UI를 렌더링합니다.
 * 
 * @param totalPages 총 페이지 수
 * @param currentPage 현재 페이지 (1부터 시작)
 * @param onPageChange 페이지 변경 콜백 함수
 */
export function PaginationController({
  totalPages,
  currentPage,
  onPageChange,
}: PaginationControllerProps) {
  // 페이지가 1개 이하면 페이지네이션을 표시하지 않음
  if (totalPages <= 1) {
    return null;
  }

  // 표시할 페이지 번호 생성 (최대 5개)
  const getPageNumbers = () => {
    // 페이지가 5개 이하면 모든 페이지 표시
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // 페이지가 5개 초과인 경우, 현재 페이지 주변과 처음/끝 페이지 표시
    const pageNumbers = [];
    
    // 항상 첫 페이지는 표시
    pageNumbers.push(1);
    
    // 현재 페이지가 3 이상이면 왼쪽 줄임표 표시를 위한 null 추가
    if (currentPage > 3) {
      pageNumbers.push(null); // 왼쪽 줄임표 표시용
    }
    
    // 현재 페이지 주변 페이지 (현재, 앞뒤 한 페이지씩)
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pageNumbers.push(i);
    }
    
    // 현재 페이지가 끝에서 2번째 이전이면 오른쪽 줄임표 표시를 위한 null 추가
    if (currentPage < totalPages - 2) {
      pageNumbers.push(null); // 오른쪽 줄임표 표시용
    }
    
    // 항상 마지막 페이지는 표시
    pageNumbers.push(totalPages);
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Pagination>
      <PaginationContent>
        {/* 이전 페이지 버튼 - 첫 페이지가 아닌 경우에만 표시 */}
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              href="#" // href는 필수이지만 실제로는 onClick 이벤트를 사용합니다
            />
          </PaginationItem>
        )}

        {/* 페이지 번호 */}
        {pageNumbers.map((pageNumber, index) => {
          // null은 줄임표로 표시
          if (pageNumber === null) {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href="#" // href는 필수이지만 실제로는 onClick 이벤트를 사용합니다
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(pageNumber);
                }}
                isActive={pageNumber === currentPage}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {/* 다음 페이지 버튼 - 마지막 페이지가 아닌 경우에만 표시 */}
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              href="#" // href는 필수이지만 실제로는 onClick 이벤트를 사용합니다
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
