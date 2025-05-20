import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/useToast";
import { Loader2, MessageSquare } from 'lucide-react';
import { Comment, CommentRequest } from "@/types/comment";
import { commentService } from "@/api/commentService";
import { useAuth } from "@/hooks/useAuth";
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

interface CommentListProps {
    gameThemeId: string;
    currentUserId?: string;
    hasPlayedGame: boolean;
    onLoginRequired: () => void;
}

// 백엔드 CommentController에서 제공하는 정렬 옵션과 동일하게 설정
type CommentSortType = "LATEST" | "OLDEST" | "LIKES";

const CommentList: React.FC<CommentListProps> = (props) => {
    const { gameThemeId, currentUserId, hasPlayedGame, onLoginRequired } = props;
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [sortType, setSortType] = useState<CommentSortType>("LATEST");
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalComments, setTotalComments] = useState(0);
    const pageSize = 10;

    // 무한 스크롤 구현을 위한 observer 대상 ref
    const loadingRef = useRef<HTMLDivElement>(null);
    const commentsContainerRef = useRef<HTMLDivElement>(null);

    // 댓글 로드
    const fetchComments = async (page = 0, sort: CommentSortType = "LATEST", size = pageSize) => {
        if (!gameThemeId) return;
        
        setIsLoading(true);
        try {
            const result = await commentService.getComments(gameThemeId, page, size, sort, isAuthenticated);
            setComments(result.content);
            setHasMore(!result.last);
            setTotalComments(result.totalElements);
            setCurrentPage(page);
        } catch (error) {
            console.error("댓글을 불러오는 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "댓글을 불러오는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 추가 댓글 로드
    const fetchMoreComments = useCallback(async () => {
        if (!gameThemeId || isLoading || !hasMore) return;
        
        setIsLoading(true);
        try {
            const nextPage = currentPage + 1;
            const result = await commentService.getComments(gameThemeId, nextPage, pageSize, sortType, isAuthenticated);
            
            setComments(prevComments => [...prevComments, ...result.content]);
            setHasMore(!result.last);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error("추가 댓글을 불러오는 중 오류가 발생했습니다:", error);
        } finally {
            setIsLoading(false);
        }
    }, [gameThemeId, isLoading, hasMore, currentPage, pageSize, sortType, isAuthenticated]);

    // Intersection Observer 설정
    useEffect(() => {
        // 접점이 보일 때 추가 로딩 시작
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !isLoading && hasMore) {
                    fetchMoreComments();
                }
            },
            { threshold: 0.1 }
        );

        const currentObserverTarget = loadingRef.current;
        if (currentObserverTarget) {
            observer.observe(currentObserverTarget);
        }

        return () => {
            if (currentObserverTarget) {
                observer.unobserve(currentObserverTarget);
            }
        };
    }, [isLoading, hasMore, fetchMoreComments]);

    // 초기 댓글 로드
    useEffect(() => {
        fetchComments(0, sortType, pageSize);
    }, [gameThemeId, sortType, isAuthenticated]);

    // 정렬 방식 변경 핸들러
    const handleSortChange = (value: CommentSortType) => {
        if (value !== sortType) {
            setSortType(value);
            setCurrentPage(0);
            fetchComments(0, value, pageSize);
        }
    };

    // 댓글 생성 핸들러
    const handleCreateComment = async (data: CommentRequest) => {
        if (!currentUserId) {
            onLoginRequired();
            return;
        }

        try {
            await commentService.createComment(gameThemeId, data);
            toast({
                title: "댓글 작성 완료",
                description: "댓글이 성공적으로 등록되었습니다.",
            });
            // 댓글 새로고침 (최신순으로 정렬된 첫 페이지 로드)
            setSortType("LATEST");
            fetchComments(0, "LATEST", pageSize);
        } catch (error) {
            console.error("댓글 작성 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "댓글을 작성하는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    // 답글 생성 핸들러
    const handleReplyComment = async (parentId: string, data: CommentRequest) => {
        if (!currentUserId) {
            onLoginRequired();
            return;
        }

        try {
            await commentService.createComment(gameThemeId, {
                ...data,
                parentId,
            });
            toast({
                title: "답글 작성 완료",
                description: "답글이 성공적으로 등록되었습니다.",
            });
            // 댓글 새로고침 (현재 정렬 상태 유지)
            fetchComments(0, sortType, pageSize);
        } catch (error) {
            console.error("답글 작성 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "답글을 작성하는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    // 댓글 삭제 핸들러
    const handleDeleteComment = async (commentId: string) => {
        if (!currentUserId) {
            onLoginRequired();
            return;
        }

        try {
            await commentService.deleteComment(gameThemeId, commentId);
            toast({
                title: "댓글 삭제 완료",
                description: "댓글이 성공적으로 삭제되었습니다.",
            });
            // 댓글 새로고침 (현재 정렬 상태 유지)
            fetchComments(0, sortType, pageSize);
        } catch (error) {
            console.error("댓글 삭제 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "댓글을 삭제하는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    // 좋아요 토글 핸들러
    const handleToggleLike = async (commentId: string, isLiked: boolean) => {
        if (!currentUserId) {
            onLoginRequired();
            return;
        }

        try {
            if (isLiked) {
                await commentService.unlikeComment(gameThemeId, commentId);
            } else {
                await commentService.likeComment(gameThemeId, commentId);
            }

            // 재귀적 함수를 사용하여 모든 깊이의 댓글 처리
            const updateCommentsLike = (comments: Comment[]): Comment[] => {
                return comments.map(comment => {
                    // 현재 댓글이 대상인 경우
                    if (comment.id === commentId) {
                        return {
                            ...comment,
                            likes: isLiked ? comment.likes - 1 : comment.likes + 1,
                            isLikedByCurrentUser: !isLiked,
                        };
                    }
                    
                    // 댓글에 답글이 있는 경우 재귀적으로 처리
                    if (comment.replies && comment.replies.length > 0) {
                        return {
                            ...comment,
                            replies: updateCommentsLike(comment.replies)
                        };
                    }
                    
                    return comment;
                });
            };

            // 현재 목록에 있는 모든 댓글에 대해 처리
            setComments(prevComments => updateCommentsLike(prevComments));
        } catch (error) {
            console.error("좋아요 처리 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "좋아요 처리 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <h2 className="text-sm font-medium">
                            댓글 {totalComments > 0 && `(${totalComments})`}
                        </h2>
                    </div>
                    <div className="flex space-x-1 text-xs">
                        <button 
                            className={`px-2 py-1 rounded ${sortType === 'LATEST' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
                            onClick={() => handleSortChange('LATEST')}
                        >
                            최신순
                        </button>
                        <button 
                            className={`px-2 py-1 rounded ${sortType === 'OLDEST' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
                            onClick={() => handleSortChange('OLDEST')}
                        >
                            오래된순
                        </button>
                        <button 
                            className={`px-2 py-1 rounded ${sortType === 'LIKES' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
                            onClick={() => handleSortChange('LIKES')}
                        >
                            인기순
                        </button>
                    </div>
                </div>
            
                <CommentForm 
                    onSubmit={handleCreateComment}
                    gameThemeId={gameThemeId}
                    isAuthenticated={isAuthenticated}
                    onLoginRequired={onLoginRequired}
                />
            </div>
            
            <div 
                className="overflow-y-auto px-4 pb-4 flex-grow" 
                ref={commentsContainerRef}
            >
                {isLoading && comments.length === 0 ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
                    </div>
                ) : (
                    <div className="space-y-1">
                        {comments.map(comment => (
                            <CommentItem 
                                key={comment.id}
                                comment={comment}
                                gameThemeId={gameThemeId}
                                hasPlayedGame={hasPlayedGame}
                                onLike={handleToggleLike}
                                onReply={handleReplyComment}
                                onDelete={handleDeleteComment}
                                currentUserId={currentUserId}
                                onLoginRequired={onLoginRequired}
                                isAuthenticated={isAuthenticated}
                            />
                        ))}
                        
                        {/* 무한 스크롤을 위한 로딩 관찰 영역 */}
                        {hasMore && (
                            <div ref={loadingRef} className="py-4 flex justify-center">
                                {isLoading ? (
                                    <span className="flex items-center text-xs text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        댓글 불러오는 중...
                                    </span>
                                ) : (
                                    <div className="h-8"></div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentList;