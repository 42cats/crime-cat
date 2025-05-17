import React from 'react';
import { Link } from 'react-router-dom';
import { BoardPost, BoardType, PostType } from '@/lib/types/board';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { FileImage, MessageSquare, ThumbsUp, ChevronRight } from 'lucide-react';

interface BoardPostItemProps {
  post: BoardPost;
  boardType: BoardType;
}

const BoardPostItem: React.FC<BoardPostItemProps> = ({ post, boardType }) => {
  const getPostTypeBadge = (postType: PostType) => {
    switch (postType) {
      case PostType.NOTICE:
        return <Badge className="mr-2 bg-blue-500 hover:bg-blue-600">공지</Badge>;
      case PostType.EVENT:
        return <Badge className="mr-2 bg-orange-500 hover:bg-orange-600">이벤트</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // 오늘 날짜인지 확인
      const isToday = date.getDate() === now.getDate() &&
                     date.getMonth() === now.getMonth() &&
                     date.getFullYear() === now.getFullYear();
                     
      if (isToday) {
        // 오늘이면 시간만 표시 (hh:mm)
        return date.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      } else {
        // 오늘이 아니면 YY.MM.DD 형식으로 표시
        return `${date.getFullYear().toString().slice(2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
      }
    } catch (error) {
      return dateString;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <Link
        to={`/community/${boardType.toLowerCase()}/${post.id}`}
        className="block px-4 py-3 w-full"
      >
        <div className="flex items-center">
          {/* 번호 */}
          <div className="flex-shrink-0 w-12 text-center text-muted-foreground text-sm hidden md:block">
            {post.id}
          </div>
          
          {/* 제목 섹션 */}
          <div className="flex items-center flex-grow min-w-0 pr-4">
            {getPostTypeBadge(post.postType)}
            
            <div className="flex items-center overflow-hidden">
              <h3 className="font-medium text-foreground truncate">
                {post.title}
              </h3>
              
              {post.commentCount > 0 && (
                <span className="text-blue-500 ml-2 font-medium">
                  [{post.commentCount}]
                </span>
              )}
              
              {post.hasImage && (
                <FileImage className="h-4 w-4 text-gray-500 ml-2 flex-shrink-0" />
              )}
              
              {post.createdAt && new Date(post.createdAt).getTime() > Date.now() - 1000 * 60 * 60 * 24 && (
                <Badge variant="outline" className="ml-2 border-blue-500 text-blue-500 px-1 py-0 h-5 text-[10px]">
                  NEW
                </Badge>
              )}
            </div>
          </div>

          {/* 작성자 */}
          <div className="flex-shrink-0 w-24 text-center text-sm text-muted-foreground hidden lg:block truncate">
            {post.authorName}
          </div>
          
          {/* 날짜 */}
          <div className="flex-shrink-0 w-20 text-center text-xs text-muted-foreground hidden md:block">
            {formatDate(post.createdAt)}
          </div>
          
          {/* 조회수 */}
          <div className="flex-shrink-0 w-16 text-center text-xs text-muted-foreground hidden md:block">
            {formatNumber(post.viewCount)}
          </div>
          
          {/* 추천수 */}
          <div className="flex-shrink-0 w-16 text-center text-xs text-muted-foreground hidden md:block">
            {formatNumber(post.likeCount)}
          </div>
        </div>
        
        {/* 모바일용 하단 정보 */}
        <div className="flex items-center justify-between mt-1 md:hidden">
          <div className="flex items-center text-xs text-muted-foreground space-x-2">
            <span>{post.authorName}</span>
            <span>·</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
          
          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-3 w-3" />
              <span>{post.commentCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ThumbsUp className="h-3 w-3" />
              <span>{post.likeCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BoardPostItem;
