import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ChevronLeft, Heart, MessageCircle, Bookmark, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ImageCarousel from '@/components/sns/post/ImageCarousel';
import SaveButton from '@/components/sns/save/SaveButton';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { userPostService, UserPostDto } from '@/api/userPost/userPostService';
import { toast } from 'sonner';

const SNSPostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState<UserPostDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
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
  
  // 댓글 제출
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() || !postId || !isAuthenticated) return;
    
    setIsSubmittingComment(true);
    try {
      // TODO: 백엔드 댓글 API 구현 시 연결
      // await userPostCommentService.createComment(postId, comment);
      
      toast.success('댓글이 작성되었습니다.');
      setComment('');
      
      // 댓글 작성 후 게시물 갱신
      const updatedPost = await userPostService.getUserPostDetail(postId);
      setPost(updatedPost);
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      toast.error('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
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
              <Link 
                key={index} 
                to={`/sns/hashtag/${encodeURIComponent(part.tag)}`}
                className="text-blue-500 hover:underline"
              >
                {part.content}{' '}
              </Link>
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
      
      {/* 게시물 카드 */}
      <div className="bg-card border border-border rounded-md overflow-hidden mb-6">
        {/* 데스크톱 레이아웃 (2열) */}
        <div className="hidden md:grid md:grid-cols-2">
          {/* 이미지 영역 */}
          <div className="bg-black aspect-square">
            {post.imageUrls && post.imageUrls.length > 0 ? (
              <ImageCarousel images={post.imageUrls} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted">
                이미지 없음
              </div>
            )}
          </div>
          
          {/* 내용 영역 */}
          <div className="flex flex-col">
            {/* 작성자 정보 */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Link to={`/profile/${post.authorId}`} className="flex items-center gap-2">
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
              </Link>
              
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
            
            {/* 내용과 댓글 */}
            <div className="p-4 flex-grow overflow-y-auto max-h-96">
              {/* 작성자와 본문 */}
              <div className="flex gap-2 mb-4">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={post.authorAvatarUrl} alt={post.authorNickname} />
                  <AvatarFallback>{post.authorNickname.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm">
                    <span className="font-medium mr-2">{post.authorNickname}</span>
                    {renderContent(post.content)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                </div>
              </div>
              
              {/* 댓글 목록 */}
              <div className="mt-6">
                <h3 className="font-medium text-sm mb-3">댓글</h3>
                {post.comments && post.comments.length > 0 ? (
                  <div className="space-y-4">
                    {post.comments.map((comment, index) => (
                      <div key={index} className="flex gap-2">
                        <Avatar className="w-7 h-7 flex-shrink-0">
                          <AvatarFallback>{comment.authorNickname.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm">
                            <span className="font-medium mr-2">{comment.authorNickname}</span>
                            {comment.content}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ko })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    아직 댓글이 없습니다. 첫 댓글을 작성해보세요.
                  </p>
                )}
              </div>
            </div>
            
            {/* 액션 버튼 */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLikeToggle}>
                    <Heart 
                      className={`h-6 w-6 ${liked ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MessageCircle className="h-6 w-6" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Share2 className="h-6 w-6" />
                  </Button>
                </div>
                
                <SaveButton postId={post.postId} />
              </div>
              
              {likeCount > 0 && (
                <p className="text-sm font-medium mb-2">좋아요 {likeCount}개</p>
              )}
              
              {/* 댓글 입력 */}
              {isAuthenticated ? (
                <form onSubmit={handleSubmitComment} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="댓글 추가..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="flex-grow px-3 py-2 bg-background border border-border rounded-md text-sm"
                  />
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={!comment.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : '게시'}
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground mt-3">
                  <Link to="/login" className="text-blue-500 hover:underline">로그인</Link>하여 댓글을 작성하세요.
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* 모바일 레이아웃 (1열) */}
        <div className="md:hidden">
          {/* 작성자 정보 */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Link to={`/profile/${post.authorId}`} className="flex items-center gap-2">
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
            </Link>
            
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
          
          {/* 이미지 영역 */}
          <div className="bg-black aspect-square">
            {post.imageUrls && post.imageUrls.length > 0 ? (
              <ImageCarousel images={post.imageUrls} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted">
                이미지 없음
              </div>
            )}
          </div>
          
          {/* 액션 버튼 */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLikeToggle}>
                  <Heart 
                    className={`h-6 w-6 ${liked ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MessageCircle className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Share2 className="h-6 w-6" />
                </Button>
              </div>
              
              <SaveButton postId={post.postId} />
            </div>
            
            {likeCount > 0 && (
              <p className="text-sm font-medium mb-2">좋아요 {likeCount}개</p>
            )}
            
            {/* 내용 */}
            <div className="text-sm mb-4">
              <span className="font-medium mr-2">{post.authorNickname}</span>
              {renderContent(post.content)}
            </div>
            
            {/* 작성 시간 */}
            <p className="text-xs text-muted-foreground mb-4">{timeAgo}</p>
            
            {/* 댓글 목록 */}
            <div className="mt-4">
              <h3 className="font-medium text-sm mb-3">댓글</h3>
              {post.comments && post.comments.length > 0 ? (
                <div className="space-y-4">
                  {post.comments.map((comment, index) => (
                    <div key={index} className="flex gap-2">
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarFallback>{comment.authorNickname.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm">
                          <span className="font-medium mr-2">{comment.authorNickname}</span>
                          {comment.content}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ko })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  아직 댓글이 없습니다. 첫 댓글을 작성해보세요.
                </p>
              )}
            </div>
            
            {/* 댓글 입력 */}
            {isAuthenticated ? (
              <form onSubmit={handleSubmitComment} className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="댓글 추가..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-grow px-3 py-2 bg-background border border-border rounded-md text-sm"
                />
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={!comment.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : '게시'}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground mt-4">
                <Link to="/login" className="text-blue-500 hover:underline">로그인</Link>하여 댓글을 작성하세요.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SNSPostDetailPage;
