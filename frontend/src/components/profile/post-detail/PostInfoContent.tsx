import React from 'react';
import { UserPostDto } from '@/api/userPost/userPostService';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PostInfoContentProps {
  post: UserPostDto;
}

const PostInfoContent: React.FC<PostInfoContentProps> = ({ post }) => {
  // 날짜 포맷
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    } catch (error) {
      return '날짜 정보 없음';
    }
  };

  return (
    <div className="space-y-4">
      {/* 포스트 내용 */}
      <div>
        <p className="whitespace-pre-line mb-2">{post.content}</p>
        <p className="text-xs text-gray-500">{post.createdAt && formatDate(post.createdAt)}</p>
      </div>
      
      {/* 포스트 통계 정보 */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div>좋아요 {post.likeCount}개</div>
        </div>
      </div>
    </div>
  );
};

export default PostInfoContent;