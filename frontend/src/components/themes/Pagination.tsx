import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange,
}) => {
  const renderPageButtons = () => {
    const buttons = [];
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    // 항상 최소 5개 페이지 버튼이 보이도록 조정
    if (endPage - startPage < 4) {
      if (startPage === 0) {
        endPage = Math.min(4, totalPages - 1);
      } else if (endPage === totalPages - 1) {
        startPage = Math.max(0, totalPages - 5);
      }
    }

    // 첫 페이지 버튼
    if (startPage > 0) {
      buttons.push(
        <Button
          key="first"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(0)}
        >
          1
        </Button>
      );

      if (startPage > 1) {
        buttons.push(
          <span key="ellipsis1" className="px-2 text-muted-foreground">
            ...
          </span>
        );
      }
    }

    // 페이지 번호 버튼
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(i)}
        >
          {i + 1}
        </Button>
      );
    }

    // 마지막 페이지 버튼
    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        buttons.push(
          <span key="ellipsis2" className="px-2 text-muted-foreground">
            ...
          </span>
        );
      }

      buttons.push(
        <Button
          key="last"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages - 1)}
        >
          {totalPages}
        </Button>
      );
    }

    return buttons;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-1 mt-8">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={!hasPrevious}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {renderPageButtons()}

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={!hasNext}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination;
