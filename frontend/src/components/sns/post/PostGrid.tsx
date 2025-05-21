import React, { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserPostGalleryDto } from '@/api/userPost/userPostService';
import LazyImage from '../common/LazyImage';
import { Heart, MessageCircle, Image } from 'lucide-react';

interface PostGridProps {
  posts: UserPostGalleryDto[];
  lastPostRef?: (node: HTMLElement | null) => void; // 무한 스크롤을 위한 IntersectionObserver ref
}

const PostGrid: React.FC<PostGridProps> = ({ posts, lastPostRef }) => {
  // 빈 그리드 렌더링 (데이터 없는 경우)
  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Image className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">게시물이 없습니다</p>
        <p className="text-sm">새로운 게시물을 작성해보세요</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 sm:gap-2">
      {posts.map((post, index) => {
        // 마지막 항목에 대한 ref 설정 (무한 스크롤)
        const isLastItem = index === posts.length - 1;
        
        return (
          <div 
            key={post.postId}
            ref={isLastItem && lastPostRef ? lastPostRef : null} 
            className="relative aspect-square group"
          >
            <Link to={`/sns/post/${post.postId}`}>
              {post.thumbnailUrl ? (
                // 이미지가 있는 경우
                <LazyImage 
                  src={post.thumbnailUrl} 
                  alt={`${post.authorNickname}의 게시물`}
                  aspectRatio="square"
                  className="rounded-sm"
                />
              ) : (
                // 이미지가 없는 경우 텍스트 표시
                <div className="w-full h-full bg-gray-100 rounded-sm p-3 flex flex-col justify-between">
                  <div className="text-sm text-gray-800 line-clamp-4 leading-relaxed">
                    {post.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    by {post.authorNickname}
                  </div>
                </div>
              )}
              
              {/* 오버레이 (호버 시 표시) */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white">
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <Heart className="w-5 h-5 mr-2" />
                    <span>{post.likeCount}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    <span>0</span> {/* 댓글 수가 없으므로 임시로 0 */}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default PostGrid;
