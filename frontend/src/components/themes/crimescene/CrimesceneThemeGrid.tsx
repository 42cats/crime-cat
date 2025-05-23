import React from "react";
import { Theme } from "@/lib/types";
import CrimesceneThemeCard from "./CrimesceneThemeCard";
import { Skeleton } from "@/components/ui/skeleton";

interface ThemeGridProps {
  themes: Theme[];
  isLoading: boolean;
  pageSize: number;
}

const CrimesceneThemeGrid: React.FC<ThemeGridProps> = ({ themes, isLoading, pageSize }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: pageSize }).map((_, i) => (
          <Skeleton key={i} className="h-[380px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <p className="text-muted-foreground mb-2">아직 게시글이 없습니다.</p>
        <p className="text-sm text-muted-foreground/70">
          가장 먼저 글을 작성해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {themes.map((theme, i) => (
        <CrimesceneThemeCard key={theme.id} theme={theme} index={i} />
      ))}
    </div>
  );
};

export default CrimesceneThemeGrid;
