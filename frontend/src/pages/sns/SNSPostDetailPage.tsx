import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ChevronLeft, Heart, Bookmark, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ImageCarousel from '@/components/sns/post/ImageCarousel';
import SaveButton from '@/components/sns/save/SaveButton';
import { PostCommentList } from '@/components/profile/post-comments';
import ProfileDetailModal from '@/components/profile/ProfileDetailModal';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { userPostService, UserPostDto } from '@/api/userPost/userPostService';
import { toast } from 'sonner';

const SNSPostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [post, setPost] = useState<UserPostDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // 게시물 데이터 로드
  useEffect(() => {
    const loadPostDetail = async () => {
      if (!postId) return;
      
      setIsLoading(true);
      try {
        const postData = await userPostService.getUserPostDetail(postId);
        setPost(postData);
        setLiked(postData.liked);
        setLikeCount(postData.likeCount);
      } catch (error) {
        console.error('게시물 상세 정보 로드 실패:', error);
        setError('게시물을 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPostDetail();
  }, [postId]);
  
  // 좋아요 토글
  const handleLikeToggle = async () => {
    if (!postId || !isAuthenticated) return;
    
    // 낙관적 UI 업데이트
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    
    try {
      // API 호출
      const result = await userPostService.togglePostLike(postId);
      
      // 결과가 예상과 다르면 되돌리기
      if (result !== newLiked) {
        setLiked(result);
        setLikeCount(prev => result ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      
      // 에러 시 원래 상태로 복원
      setLiked(!newLiked);
      setLikeCount(prev => !newLiked ? prev + 1 : prev - 1);
      
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    }
  };
  
  // 공유 기능
  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/sns/post/${postId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('게시물 링크가 복사되었습니다.');
    } catch (error) {
      console.error('링크 복사 실패:', error);
      toast.error('링크 복사에 실패했습니다.');
    }
  };

  // 프로필 모달 열기
  const handleProfileClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileModalOpen(true);
  };
  
  // 로그인 필요 시 처리
  const handleLoginRequired = () => {
    toast.error('로그인이 필요합니다.');
    navigate('/login');
  };
  
  // 내용에서 해시태그 찾아 강조 표시
  const renderContent = (content: string) => {
    if (!content) return null;
    
    const parts = [];
    let lastIndex = 0;
    const hashTagRegex = /#[\w\p{L}]+/gu;
    let match;
    
    while ((match = hashTagRegex.exec(content)) !== null) {
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;
      
      // 해시태그 이전 텍스트
      if (matchStart > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, matchStart)
        });
      }
      
      // 해시태그
      parts.push({
        type: 'hashtag',
        content: match[0],
        tag: match[0].substring(1) // # 제외
      });
      
      lastIndex = matchEnd;
    }
    
    // 마지막 텍스트
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }
    
    return (
      <div className="whitespace-pre-line">
        {parts.map((part, index) => {
          if (part.type === 'hashtag') {
            return (
              <button 
                key={index} 
                onClick={() => navigate(`/sns/explore?search=${encodeURIComponent(part.content)}`)}
                className="text-blue-500 hover:underline"
              >
                {part.content}{' '}
              </button>
            );
          }
          return <span key={index}>{part.content}</span>;
        })}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground mb-4">{error || '게시물을 찾을 수 없습니다.'}</p>
        <Button onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          돌아가기
        </Button>
      </div>
    );
  }
  
  const createdDate = post.createdAt ? new Date(post.createdAt) : new Date();
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true, locale: ko });
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* 헤더와 이전 버튼 */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold ml-2">게시물 상세</h1>
      </div>
      
      {/* 게시물 카드 - 세로 레이아웃 */}
      <div className="bg-card border border-border rounded-md overflow-hidden mb-6">
        {/* 작성자 정보 */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <button 
            onClick={() => handleProfileClick(post.authorId)}
            className="flex items-center gap-2 hover:opacity-80"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={post.authorAvatarUrl} alt={post.authorNickname} />
              <AvatarFallback>{post.authorNickname.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{post.authorNickname}</p>
              {post.locationName && (
                <p className="text-xs text-muted-foreground">{post.locationName}</p>
              )}
            </div>
          </button>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
        
        {/* 이미지 영역 */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="bg-black">
            <ImageCarousel images={post.imageUrls} />
          </div>
        )}
        
        {/* 액션 버튼 */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLikeToggle}>
                <Heart 
                  className={`h-6 w-6 ${liked ? 'fill-red-500 text-red-500' : ''}`} 
                />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleShare}>
                <Share2 className="h-6 w-6" />
              </Button>
            </div>
            
            <SaveButton postId={post.postId} />
          </div>
          
          {likeCount > 0 && (
            <p className="text-sm font-medium mb-2">좋아요 {likeCount}개</p>
          )}
          
          {/* 내용 */}
          <div className="text-sm mb-2">
            <span className="font-medium mr-2">{post.authorNickname}</span>
            {renderContent(post.content)}
          </div>
          
          {/* 작성 시간 */}
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        
        {/* 댓글 영역 */}
        <div className="overflow-hidden">
          <PostCommentList 
            postId={post.postId}
            postAuthorId={post.authorId}
            currentUserId={user?.id}
            onLoginRequired={handleLoginRequired}
            onProfileClick={handleProfileClick}
          />
        </div>
      </div>
      
      {/* 프로필 모달 */}
      {selectedUserId && (
        <ProfileDetailModal
          userId={selectedUserId}
          open={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
        />
      )}
    </div>
  );
};

export default SNSPostDetailPage;
