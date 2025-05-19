import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/useToast";
import { Loader2, Heart, MessageSquare, AlertTriangle } from 'lucide-react';
import { Comment, CommentRequest } from "@/types/comment";
import { commentService } from "@/api/commentService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { UTCToKST } from "@/lib/dateFormat";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";

interface ModalCommentListProps {
    gameThemeId: string;
    currentUserId?: string;
    hasPlayedGame: boolean;
    onLoginRequired: () => void;
}

// 백엔드 CommentController에서 제공하는 정렬 옵션과 동일하게 설정
type CommentSortType = "LATEST" | "OLDEST" | "LIKES";

// 게시 폼 컴포넌트
const CommentForm = ({ 
    onSubmit, 
    gameThemeId, 
    isAuthenticated 
}: { 
    onSubmit: (data: CommentRequest) => Promise<void>, 
    gameThemeId: string,
    isAuthenticated: boolean 
}) => {
    const [content, setContent] = useState('');
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            // 외부에서 로그인 필요 콜백 호출
            onLoginRequired();
            return;
        }
        
        if (!content.trim()) return;
        
        setIsSubmitting(true);
        
        try {
            const commentData: CommentRequest = {
                content: content.trim(),
                isSpoiler
            };
            
            await onSubmit(commentData);
            setContent('');
            setIsSpoiler(false);
        } catch (error) {
            console.error('댓글 제출 중 오류 발생:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 space-y-2">
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isAuthenticated ? "댓글을 작성하세요..." : "로그인 후 댓글을 작성할 수 있습니다"}
                className="min-h-16 p-2 text-sm resize-none border-border"
                disabled={!isAuthenticated || isSubmitting}
            />
            
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="spoiler-mode"
                        checked={isSpoiler}
                        onCheckedChange={setIsSpoiler}
                        disabled={!isAuthenticated}
                    />
                    <label 
                        htmlFor="spoiler-mode" 
                        className={`text-xs cursor-pointer ${!isAuthenticated ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}
                    >
                        스포일러
                    </label>
                </div>
                
                <button 
                    type="submit" 
                    disabled={!content.trim() || isSubmitting || !isAuthenticated}
                    className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-md disabled:opacity-50"
                >
                    {isSubmitting ? "게시 중..." : "댓글 게시"}
                </button>
            </div>
        </form>
    );
};

// 댓글 아이템 컴포넌트 
const CommentItem = ({ 
    comment, 
    gameThemeId, 
    hasPlayedGame, 
    onLike,
    onReply,
    onDelete,
    currentUserId,
    onLoginRequired,
    isAuthenticated
}: { 
    comment: Comment,
    gameThemeId: string,
    hasPlayedGame: boolean,
    onLike: (commentId: string, isLiked: boolean) => Promise<void>,
    onReply: (parentId: string, data: CommentRequest) => Promise<void>,
    onDelete: (commentId: string) => Promise<void>,
    currentUserId?: string,
    onLoginRequired: () => void,
    isAuthenticated: boolean
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isLiked = comment.isLikedByCurrentUser;
    const isSpoilerContent = comment.isSpoiler;
    const isOwnComment = currentUserId === comment.authorId;
    const canViewSpoiler = hasPlayedGame || !isSpoilerContent || isOwnComment;

    const handleLike = async () => {
        if (!isAuthenticated) {
            onLoginRequired();
            return;
        }
        await onLike(comment.id, isLiked);
    };

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        
        setIsSubmitting(true);
        try {
            await onReply(comment.id, {
                content: replyContent.trim(),
                isSpoiler
            });
            setReplyContent('');
            setIsSpoiler(false);
            setIsReplying(false);
        } catch (error) {
            console.error('답글 제출 중 오류 발생:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(comment.id);
        } catch (error) {
            console.error('댓글 삭제 중 오류 발생:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (comment.isDeleted) {
        return (
            <div className="border-t border-gray-100 pt-3 pb-2">
                <div className="text-gray-400 text-sm italic">삭제된 댓글입니다.</div>
                
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 pl-4">
                        <button 
                            className="text-xs text-gray-500 mb-2"
                            onClick={() => setShowReplies(!showReplies)}
                        >
                            {showReplies ? '답글 숨기기' : `답글 ${comment.replies.length}개 보기`}
                        </button>
                        
                        {showReplies && (
                            <div className="space-y-3">
                                {comment.replies.map(reply => (
                                    <CommentItem 
                                        key={reply.id}
                                        comment={reply}
                                        gameThemeId={gameThemeId}
                                        hasPlayedGame={hasPlayedGame}
                                        onLike={onLike}
                                        onReply={onReply}
                                        onDelete={onDelete}
                                        currentUserId={currentUserId}
                                        onLoginRequired={onLoginRequired}
                                        isAuthenticated={isAuthenticated}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="border-t border-gray-100 pt-3 pb-1">
            <div className="flex gap-2">
                <Avatar className="h-8 w-8 rounded-full border shrink-0">
                    <AvatarImage
                        src={comment.authorProfileImage}
                        alt={comment.authorName}
                    />
                    <AvatarFallback className="text-xs">
                        {comment.authorName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.authorName}</span>
                        <span className="text-xs text-gray-500">
                            <UTCToKST date={comment.createdAt} />
                        </span>
                    </div>
                    
                    <div className="mt-1 mb-2">
                        {isSpoilerContent && !canViewSpoiler ? (
                            <div className="p-2 bg-amber-50 text-amber-600 rounded text-sm flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                <span>스포일러 내용입니다. 게임을 플레이한 후 확인하세요.</span>
                            </div>
                        ) : (
                            <div className="text-sm break-words whitespace-pre-wrap">
                                {isSpoilerContent && (
                                    <Badge variant="outline" className="mb-1 bg-amber-50 text-amber-600 border-amber-200">
                                        스포일러
                                    </Badge>
                                )}
                                <p>{comment.content}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-2">
                        <button 
                            className={`flex items-center gap-1 text-xs ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
                            onClick={handleLike}
                        >
                            <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-red-500' : ''}`} />
                            {comment.likes > 0 && <span>{comment.likes}</span>}
                        </button>
                        
                        <button 
                            className="flex items-center gap-1 text-xs text-gray-500"
                            onClick={() => {
                                if (!isAuthenticated) {
                                    onLoginRequired();
                                    return;
                                }
                                setIsReplying(!isReplying);
                            }}
                        >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>답글</span>
                        </button>
                        
                        {isOwnComment && (
                            <button 
                                className="text-xs text-gray-500 hover:text-red-500"
                                onClick={() => setIsDeleting(true)}
                            >
                                삭제
                            </button>
                        )}
                    </div>
                    
                    {isReplying && (
                        <form onSubmit={handleReplySubmit} className="mb-3 mt-2">
                            <Textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="답글을 작성하세요..."
                                className="min-h-16 p-2 text-sm resize-none border-gray-200 rounded-md"
                            />
                            
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id={`spoiler-reply-${comment.id}`}
                                        checked={isSpoiler}
                                        onCheckedChange={setIsSpoiler}
                                    />
                                    <label 
                                        htmlFor={`spoiler-reply-${comment.id}`}
                                        className="text-xs text-gray-500 cursor-pointer"
                                    >
                                        스포일러
                                    </label>
                                </div>
                                
                                <div className="flex space-x-2">
                                    <button 
                                        type="button"
                                        onClick={() => setIsReplying(false)}
                                        className="text-xs px-3 py-1.5 text-gray-500"
                                    >
                                        취소
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={!replyContent.trim() || isSubmitting}
                                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md disabled:opacity-50"
                                    >
                                        {isSubmitting ? "게시 중..." : "답글 게시"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                    
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2 pl-4">
                            <button 
                                className="text-xs text-gray-500 mb-2"
                                onClick={() => setShowReplies(!showReplies)}
                            >
                                {showReplies ? '답글 숨기기' : `답글 ${comment.replies.length}개 보기`}
                            </button>
                            
                            {showReplies && (
                                <div className="space-y-3">
                                    {comment.replies.map(reply => (
                                        <CommentItem 
                                            key={reply.id}
                                            comment={reply}
                                            gameThemeId={gameThemeId}
                                            hasPlayedGame={hasPlayedGame}
                                            onLike={onLike}
                                            onReply={onReply}
                                            onDelete={onDelete}
                                            currentUserId={currentUserId}
                                            onLoginRequired={onLoginRequired}
                                            isAuthenticated={isAuthenticated}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            정말로 이 댓글을 삭제하시겠습니까?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 text-white hover:bg-red-600"
                        >
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export function ModalCommentList({
    gameThemeId,
    currentUserId,
    hasPlayedGame,
    onLoginRequired
}: ModalCommentListProps) {
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [sortType, setSortType] = useState<CommentSortType>("LATEST");
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalComments, setTotalComments] = useState(0);
    const pageSize = 10;

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
    const fetchMoreComments = async () => {
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
    };

    useEffect(() => {
        fetchComments(0, sortType, pageSize);
    }, [gameThemeId, sortType, isAuthenticated]);

    const handleSortChange = (value: CommentSortType) => {
        if (value !== sortType) {
            setSortType(value);
            setCurrentPage(0);
            fetchComments(0, value, pageSize);
        }
    };

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

    const handleReplyComment = async (
        parentId: string,
        data: CommentRequest
    ) => {
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
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-2">
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
            />
            
            <div className="flex-1 overflow-y-auto mt-4">
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
                        
                        {hasMore && (
                            <div className="flex justify-center py-4">
                                <button
                                    onClick={fetchMoreComments}
                                    disabled={isLoading}
                                    className="text-xs px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center">
                                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                            로딩 중...
                                        </span>
                                    ) : (
                                        "더 보기"
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}