import React from 'react';
import { ChevronLeft, ChevronRight, User, Calendar } from 'lucide-react';

interface NavigationCardProps {
  type: 'previous' | 'next';
  post?: {
    id: string;
    subject: string;
    authorName: string;
    createdAt: string;
    views?: number;
    likes?: number;
    comments?: number;
  };
  onClick: () => void;
  disabled?: boolean;
}

/**
 * 카카오 스타일 네비게이션 카드 컴포넌트
 * - 이전/다음글 미리보기
 * - 카드형 레이아웃
 * - 호버 애니메이션
 */
export const NavigationCard: React.FC<NavigationCardProps> = ({
  type,
  post,
  onClick,
  disabled = false,
}) => {
  if (!post) {
    return (
      <div className="h-20 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center">
        <span className="text-sm text-gray-400">
          {type === 'previous' ? '이전글 없음' : '다음글 없음'}
        </span>
      </div>
    );
  }

  const isNext = type === 'next';
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full h-20 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
        rounded-xl hover:border-yellow-400 dark:hover:border-yellow-400 hover:shadow-md 
        disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 
        group relative overflow-hidden
        ${isNext ? 'text-right' : 'text-left'}
      `}
    >
      {/* 배경 그라데이션 효과 */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="relative flex items-center justify-center h-full gap-3">
        {/* 방향 아이콘 */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center group-hover:bg-yellow-500 transition-colors duration-200`}>
          {isNext ? (
            <ChevronRight className="w-4 h-4 text-gray-800" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-800" />
          )}
        </div>

        {/* 게시글 정보 */}
        <div className="flex-1 min-w-0 text-center">
          {/* 제목 */}
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-200">
            {post.subject}
          </h4>
          
          {/* 메타데이터 */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{post.authorName}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 타입 라벨 */}
      <div className={`absolute top-2 ${isNext ? 'right-2' : 'left-2'}`}>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
          {isNext ? '다음글' : '이전글'}
        </span>
      </div>
    </button>
  );
};