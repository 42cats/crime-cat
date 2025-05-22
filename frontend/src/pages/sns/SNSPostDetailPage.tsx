import React from 'react';
import { useParams } from 'react-router-dom';
import PostDetailModal from '@/components/common/PostDetailModal';
import SnsBottomNavigation from '@/components/sns/SnsBottomNavigation';

const SNSPostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();

  if (!postId) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground">잘못된 게시물 URL입니다.</p>
      </div>
    );
  }

  return (
    <>
      <PostDetailModal
        postId={postId}
        isOpen={true}
        onClose={() => {}} // 페이지 모드에서는 navigate(-1)로 처리됨
        mode="page"
      />
      <SnsBottomNavigation />
    </>
  );
};

export default SNSPostDetailPage;