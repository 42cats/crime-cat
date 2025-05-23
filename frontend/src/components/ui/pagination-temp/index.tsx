import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  showControls?: boolean;
  siblingCount?: number;
}

export function Pagination({
  totalPages,
  currentPage,
  onPageChange,
  showControls = true,
  siblingCount = 1,
}: PaginationProps) {
  // 페이지 범위 생성 함수
  const generatePaginationItems = (
    current: number,
    total: number,
    sibling: number
  ) => {
    // 현재 페이지가 범위를 벗어나면 수정
    const safeCurrentPage = Math.min(Math.max(1, current), total);
    
    // 표시할 페이지 아이템을 저장할 배열
    const items: (number | string)[] = [];
    
    // 시작 및 끝 페이지 계산
    const leftSiblingIndex = Math.max(safeCurrentPage - sibling, 1);
    const rightSiblingIndex = Math.min(safeCurrentPage + sibling, total);
    
    // '...' 표시 여부
    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < total - 1;
    
    // 항상 첫 페이지 표시
    items.push(1);
    
    // 왼쪽 '...' 표시
    if (showLeftDots) {
      items.push("leftEllipsis");
    } else if (leftSiblingIndex > 1) {
      // 첫 페이지와 왼쪽 형제 사이의 모든 페이지 추가
      for (let i = 2; i < leftSiblingIndex; i++) {
        items.push(i);
      }
    }
    
    // 형제 페이지 추가
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== total) {
        items.push(i);
      }
    }
    
    // 오른쪽 '...' 표시
    if (showRightDots) {
      items.push("rightEllipsis");
    } else if (rightSiblingIndex < total) {
      // 오른쪽 형제와 마지막 페이지 사이의 모든 페이지 추가
      for (let i = rightSiblingIndex + 1; i < total; i++) {
        items.push(i);
      }
    }
    
    // 항상 마지막 페이지 표시 (총 페이지가 1보다 큰 경우)
    if (total > 1) {
      items.push(total);
    }
    
    return items;
  };
  
  // 페이지 아이템 목록
  const paginationItems = generatePaginationItems(
    currentPage,
    totalPages,
    siblingCount
  );
  
  // 페이지가 1개 이하면 렌더링하지 않음
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-center space-x-1 mt-4">
      {showControls && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">처음으로</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">이전</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </>
      )}
      
      {paginationItems.map((item, index) => {
        // 줄임표 처리
        if (item === "leftEllipsis" || item === "rightEllipsis") {
          return (
            <div
              key={`ellipsis-${index}`}
              className="flex items-center justify-center h-8 w-8"
            >
              <span className="text-sm">...</span>
            </div>
          );
        }
        
        // 페이지 버튼
        const pageNumber = item as number;
        const isActive = pageNumber === currentPage;
        
        return (
          <Button
            key={`page-${pageNumber}`}
            variant={isActive ? "default" : "outline"}
            size="icon"
            className={`h-8 w-8 ${isActive ? "pointer-events-none" : ""}`}
            onClick={() => onPageChange(pageNumber)}
          >
            <span className="text-sm">{pageNumber}</span>
          </Button>
        );
      })}
      
      {showControls && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span className="sr-only">다음</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <span className="sr-only">마지막으로</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
