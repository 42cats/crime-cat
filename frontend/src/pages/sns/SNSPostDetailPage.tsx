import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PostDetailPage from '@/components/common/post-detail/PostDetailPage';
import SnsBottomNavigation from '@/components/sns/SnsBottomNavigation';
import { UserPostDto, userPostService } from '@/api/posts';
import { Loader2 } from 'lucide-react';

const SNSPostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<UserPostDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    const loadPostData = async () => {
      if (!postId) return;
      
      setIsLoading(true);
      try {
        console.log('SNSPostDetailPage: 포스트 데이터 로드 시작', postId);
        const postData = await userPostService.getUserPostDetail(postId);
        console.log('SNSPostDetailPage: 포스트 데이터 로드 성공', postData);
        setPost(postData);
      } catch (error) {
        console.error('SNSPostDetailPage: 포스트 데이터 로드 실패', error);
        setError('게시물을 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPostData();
  }, [postId]);

  if (!postId) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground">잘못된 게시물 URL입니다.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <>
      <PostDetailPage
        post={post || undefined}
        postId={postId}
        onLikeStatusChange={(postId, liked, likeCount) => {
          // 좋아요 상태 변경 시 처리 (필요한 경우)
          if (post) {
            setPost({
              ...post,
              liked,
              likeCount
            });
          }
        }}
      />
      <SnsBottomNavigation />
    </>
  );
};

export default SNSPostDetailPage;