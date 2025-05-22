import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { userPostService, UserPostDto } from '@/api/userPost/userPostService';
import { Heart, MessageCircle, Share2, ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SnsBottomNavigation from '@/components/sns/SnsBottomNavigation';
import LazyImage from '@/components/sns/common/LazyImage';

const SNSPostDetailPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    
    const [post, setPost] = useState<UserPostDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (postId) {
            loadPostDetail();
        }
    }, [postId]);

    const loadPostDetail = async () => {
        if (!postId) return;
        
        setIsLoading(true);
        try {
            const postData = await userPostService.getUserPostDetail(postId);
            setPost(postData);
        } catch (error) {
            console.error('포스트 로드 실패:', error);
            toast.error('게시물을 불러올 수 없습니다.');
            navigate('/sns/explore');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLikeToggle = async () => {
        if (!isAuthenticated) {
            toast.warning('로그인이 필요합니다.');
            return;
        }

        if (!post || isLikeLoading) return;

        setIsLikeLoading(true);
        try {
            const newLikedState = await userPostService.togglePostLike(post.postId);
            setPost(prev => prev ? {
                ...prev,
                liked: newLikedState,
                likeCount: newLikedState ? prev.likeCount + 1 : prev.likeCount - 1
            } : null);
        } catch (error) {
            console.error('좋아요 토글 실패:', error);
            toast.error('좋아요 처리에 실패했습니다.');
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${post?.authorNickname}님의 게시물`,
                    text: post?.content,
                    url: url,
                });
            } catch (error) {
                // 사용자가 공유를 취소한 경우는 무시
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('공유 실패:', error);
                }
            }
        } else {
            // Web Share API를 지원하지 않는 경우 클립보드에 복사
            try {
                await navigator.clipboard.writeText(url);
                toast.success('링크가 클립보드에 복사되었습니다.');
            } catch (error) {
                console.error('클립보드 복사 실패:', error);
                toast.error('링크 복사에 실패했습니다.');
            }
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <>
                <div className="container mx-auto px-4 py-6 mb-16 md:mb-0 max-w-2xl">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded mb-4"></div>
                        <div className="aspect-square bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                </div>
                <SnsBottomNavigation />
            </>
        );
    }

    if (!post) {
        return (
            <>
                <div className="container mx-auto px-4 py-6 mb-16 md:mb-0 max-w-2xl">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">게시물을 찾을 수 없습니다</h2>
                        <p className="text-muted-foreground mb-4">삭제되었거나 존재하지 않는 게시물입니다.</p>
                        <Button onClick={() => navigate('/sns/explore')}>
                            탐색으로 돌아가기
                        </Button>
                    </div>
                </div>
                <SnsBottomNavigation />
            </>
        );
    }

    return (
        <>
            <div className="container mx-auto px-4 py-6 mb-16 md:mb-0 max-w-2xl">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-semibold">게시물</h1>
                    <div className="w-10"></div> {/* 균형을 위한 스페이서 */}
                </div>

                {/* 작성자 정보 */}
                <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-3">
                        {post.authorNickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <Link 
                            to={`/profile/${post.authorId}`}
                            className="font-semibold hover:underline"
                        >
                            {post.authorNickname}
                        </Link>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(post.createdAt)}
                        </div>
                    </div>
                </div>

                {/* 이미지 캐러셀 */}
                {post.imageUrls && post.imageUrls.length > 0 && (
                    <div className="relative mb-4">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <LazyImage
                                src={post.imageUrls[currentImageIndex]}
                                alt={`${post.authorNickname}의 게시물 이미지 ${currentImageIndex + 1}`}
                                aspectRatio="square"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        
                        {/* 이미지 인디케이터 */}
                        {post.imageUrls.length > 1 && (
                            <div className="flex justify-center mt-2 space-x-2">
                                {post.imageUrls.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`w-2 h-2 rounded-full transition-colors ${
                                            index === currentImageIndex 
                                                ? 'bg-primary' 
                                                : 'bg-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                        
                        {/* 이미지 네비게이션 버튼 */}
                        {post.imageUrls.length > 1 && (
                            <>
                                <button
                                    onClick={() => setCurrentImageIndex(prev => 
                                        prev === 0 ? post.imageUrls.length - 1 : prev - 1
                                    )}
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                                >
                                    ‹
                                </button>
                                <button
                                    onClick={() => setCurrentImageIndex(prev => 
                                        prev === post.imageUrls.length - 1 ? 0 : prev + 1
                                    )}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                                >
                                    ›
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* 액션 버튼들 */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleLikeToggle}
                            disabled={isLikeLoading}
                            className={`flex items-center space-x-1 transition-colors ${
                                post.liked 
                                    ? 'text-red-500' 
                                    : 'text-muted-foreground hover:text-red-500'
                            }`}
                        >
                            <Heart 
                                className={`w-6 h-6 ${post.liked ? 'fill-current' : ''}`} 
                            />
                            <span className="font-medium">{post.likeCount}</span>
                        </button>
                        
                        <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
                            <MessageCircle className="w-6 h-6" />
                            <span className="font-medium">0</span>
                        </button>
                    </div>
                    
                    <button
                        onClick={handleShare}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Share2 className="w-6 h-6" />
                    </button>
                </div>

                {/* 게시물 내용 */}
                <div className="mb-4">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {post.content}
                    </p>
                </div>

                {/* 해시태그 */}
                {post.hashTags && post.hashTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.hashTags.map((tag, index) => (
                            <Link
                                key={index}
                                to={`/sns/explore?search=%23${encodeURIComponent(tag)}`}
                                className="text-primary hover:underline"
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                )}

                {/* 위치 정보 */}
                {post.locationName && (
                    <div className="flex items-center text-muted-foreground mb-4">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{post.locationName}</span>
                    </div>
                )}
            </div>
            <SnsBottomNavigation />
        </>
    );
};

export default SNSPostDetailPage;
