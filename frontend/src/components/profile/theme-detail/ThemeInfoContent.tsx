import React from 'react';
import { Badge } from "@/components/ui/badge";
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface ThemeInfoContentProps {
  themeDetail: any;
  themeDetailLoading: boolean;
  fallbackTheme?: any;
  formatPlayTime: (min: number, max: number) => string;
}

const ThemeInfoContent: React.FC<ThemeInfoContentProps> = ({
  themeDetail,
  themeDetailLoading,
  fallbackTheme,
  formatPlayTime
}) => {
  if (themeDetailLoading) {
    return (
      <div className="flex justify-center py-4">
        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!themeDetail && !fallbackTheme) {
    return <div>정보를 불러올 수 없습니다.</div>;
  }

  // 상세 정보 또는 기본 정보 사용
  const theme = themeDetail || fallbackTheme;

  return (
    <div className="space-y-4 pb-12">
      <h3 className="text-xl font-bold mb-4">
        {themeDetail?.title || fallbackTheme?.themeTitle}
      </h3>
      
      {themeDetail?.summary && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-500">설명</h4>
          <p className="text-sm whitespace-pre-line">{themeDetail.summary}</p>
        </div>
      )}
        
      {themeDetail?.type && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-500">카테고리</h4>
          <Badge variant="secondary">{themeDetail.type}</Badge>
        </div>
      )}
      
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-500">가격</h4>
        <p>{(themeDetail?.price || fallbackTheme?.themePrice)?.toLocaleString()}원</p>
      </div>
      
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-500">인원</h4>
        <p>
          {themeDetail ? (
            themeDetail.playersMin === themeDetail.playersMax 
              ? `${themeDetail.playersMin}인` 
              : `${themeDetail.playersMin}~${themeDetail.playersMax}인`
          ) : (
            fallbackTheme?.themeMinPlayer === fallbackTheme?.themeMaxPlayer 
              ? `${fallbackTheme?.themeMinPlayer}인` 
              : `${fallbackTheme?.themeMinPlayer}~${fallbackTheme?.themeMaxPlayer}인`
          )}
        </p>
      </div>
      
      {themeDetail?.playTimeMin && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-500">플레이 시간</h4>
          <p>
            {formatPlayTime(themeDetail.playTimeMin, themeDetail.playTimeMax)}
          </p>
        </div>
      )}
      
      {themeDetail?.tags?.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-500">태그</h4>
          <div className="flex flex-wrap gap-2 mt-1">
            {themeDetail.tags.map((tag: string, idx: number) => (
              <Badge key={idx} variant="outline">#{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* 콘텐츠를 태그 아래로 배치 */}
      {themeDetail?.content && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-500">콘텐츠</h4>
          <div className="text-sm border p-3 rounded-md">
            <MarkdownRenderer 
              content={themeDetail.content} 
              className="prose-sm max-w-none overflow-hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeInfoContent;