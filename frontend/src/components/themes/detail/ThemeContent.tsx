import React from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { ThemeDetailType } from "@/lib/types";

interface ThemeContentProps {
  theme: ThemeDetailType;
}

const ThemeContent: React.FC<ThemeContentProps> = ({ theme }) => {
  return (
    <>
      {/* 설명 섹션 - 간략화 */}
      {theme.summary && (
        <div className="bg-card rounded-lg border p-6 mb-8">
          <span className="text-xl font-bold mb-4 block">개요</span>
          <p className="text-lg text-foreground break-words whitespace-pre-line leading-relaxed">
            {theme.summary}
          </p>
        </div>
      )}

      {/* 내용 섹션 */}
      <div className="bg-card rounded-lg border p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">상세 내용</h2>
        <div className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90">
          <MarkdownRenderer content={theme.content} />
        </div>
      </div>
    </>
  );
};

export default ThemeContent;