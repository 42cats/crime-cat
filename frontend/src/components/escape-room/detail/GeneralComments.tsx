import React, { useState, useEffect } from 'react';
import { MessageCircle, Reply, Heart, MoreHorizontal, Edit, Trash2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/useToast';
import { escapeRoomCommentService, CommentResponse } from '@/api/comment/escapeRoomCommentService';
import ProfileDetailModal from '@/components/profile/ProfileDetailModal';

interface GeneralCommentsProps {
    themeId: string;
    hasGameHistory: boolean;
}

interface CommentItemProps {
    comment: CommentResponse;
    isReply?: boolean;
    onLike: (comment: CommentResponse) => void;
    onReply: (commentId: string) => void;
    onEdit: (commentId: string, content: string) => void;
    onDelete: (commentId: string) => void;
    replyingTo: string | null;
    replyContent: string;
    setReplyContent: (content: string) => void;
    setReplyingTo: (id: string | null) => void;
    isSubmitting: boolean;
    handleSubmitReply: (parentId: string) => void;
    editingComment: string | null;
    editContent: string;
    setEditContent: (content: string) => void;
    setEditingComment: (id: string | null) => void;
    handleEditComment: (commentId: string) => void;
    formatDate: (date: string) => string;
}

const GeneralComments: React.FC<GeneralCommentsProps> = ({ 
    themeId, 
    hasGameHistory 
}) => {
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        fetchComments();
    }, [themeId]);

    const fetchComments = async () => {
        try {
            setIsLoading(true);
            const response = await escapeRoomCommentService.getCommentsByTheme(themeId, 0, 20, false);
            setComments(response.content.filter(comment => !comment.isSpoiler));
        } catch (error) {
            console.error('댓글 목록 조회 실패:', error);
            toast({
                title: "댓글 로딩 실패",
                description: "댓글을 불러오는데 실패했습니다.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}일 전`;
        if (hours > 0) return `${hours}시간 전`;
        return '방금 전';
    };

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;
        
        setIsSubmitting(true);
        try {
            await escapeRoomCommentService.createComment({
                escapeRoomThemeId: themeId,
                content: newComment,
                hasSpoiler: false
            });
            setNewComment('');
            await fetchComments();
            toast({
                title: "댓글 작성 완료",
                description: "댓글이 성공적으로 작성되었습니다."
            });
        } catch (error) {
            console.error('댓글 작성 실패:', error);
            toast({
                title: "댓글 작성 실패",
                description: "댓글 작성에 실패했습니다.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!replyContent.trim()) return;
        
        setIsSubmitting(true);
        try {
            await escapeRoomCommentService.createComment({
                escapeRoomThemeId: themeId,
                content: replyContent,
                hasSpoiler: false,
                parentCommentId: parentId
            });
            setReplyContent('');
            setReplyingTo(null);
            await fetchComments();
            toast({
                title: "답글 작성 완료",
                description: "답글이 성공적으로 작성되었습니다."
            });
        } catch (error) {
            console.error('답글 작성 실패:', error);
            toast({
                title: "답글 작성 실패",
                description: "답글 작성에 실패했습니다.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLikeComment = async (comment: CommentResponse) => {
        try {
            if (comment.isLikedByCurrentUser) {
                await escapeRoomCommentService.unlikeComment(comment.id);
            } else {
                await escapeRoomCommentService.likeComment(comment.id);
            }
            await fetchComments();
        } catch (error) {
            console.error('좋아요 실패:', error);
            toast({
                title: "좋아요 실패",
                description: "좋아요 처리에 실패했습니다.",
                variant: "destructive"
            });
        }
    };

    const handleEditComment = async (commentId: string) => {
        if (!editContent.trim()) return;
        
        try {
            await escapeRoomCommentService.updateComment(commentId, {
                content: editContent
            });
            setEditingComment(null);
            setEditContent('');
            await fetchComments();
            toast({
                title: "댓글 수정 완료",
                description: "댓글이 성공적으로 수정되었습니다."
            });
        } catch (error) {
            console.error('댓글 수정 실패:', error);
            toast({
                title: "댓글 수정 실패",
                description: "댓글 수정에 실패했습니다.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;
        
        try {
            await escapeRoomCommentService.deleteComment(commentId);
            await fetchComments();
            toast({
                title: "댓글 삭제 완료",
                description: "댓글이 성공적으로 삭제되었습니다."
            });
        } catch (error) {
            console.error('댓글 삭제 실패:', error);
            toast({
                title: "댓글 삭제 실패",
                description: "댓글 삭제에 실패했습니다.",
                variant: "destructive"
            });
        }
    };

    const CommentItem: React.FC<CommentItemProps> = ({
        comment,
        isReply = false,
        onLike,
        onReply,
        onEdit,
        onDelete,
        replyingTo,
        replyContent,
        setReplyContent,
        setReplyingTo,
        isSubmitting,
        handleSubmitReply,
        editingComment,
        editContent,
        setEditContent,
        setEditingComment,
        handleEditComment,
        formatDate
    }) => {
        const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
        
        return (
            <div className={`${isReply ? 'ml-12 mt-3' : ''}`}>
                <div className="flex gap-3">
                    <Avatar 
                        className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                        onClick={() => setIsProfileModalOpen(true)}
                    >
                        <AvatarImage src={comment.authorProfileImage} />
                        <AvatarFallback>{comment.authorName && comment.authorName[0]}</AvatarFallback>
                    </Avatar>
                
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <span 
                            className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                            onClick={() => setIsProfileModalOpen(true)}
                        >
                            {comment.authorName}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                        {comment.isOwnComment && <Badge variant="outline" className="text-xs">내 댓글</Badge>}
                    </div>
                    
                    {editingComment === comment.id ? (
                        <div className="space-y-2">
                            <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[80px]"
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleEditComment(comment.id)}
                                    disabled={!editContent.trim()}
                                >
                                    수정 완료
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setEditingComment(null);
                                        setEditContent('');
                                    }}
                                >
                                    취소
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                    )}
                    
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikeComment(comment)}
                            className={`h-auto p-1 gap-1 ${comment.isLikedByCurrentUser ? 'text-red-500' : 'text-gray-500'}`}
                        >
                            <Heart className="w-3 h-3" fill={comment.isLikedByCurrentUser ? 'currentColor' : 'none'} />
                            <span className="text-xs">{comment.likes}</span>
                        </Button>
                        
                        {!isReply && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyingTo(comment.id)}
                                className="h-auto p-1 gap-1 text-gray-500"
                            >
                                <Reply className="w-3 h-3" />
                                <span className="text-xs">답글</span>
                            </Button>
                        )}
                        
                        {comment.isOwnComment && (
                            <div className="flex gap-2 text-xs text-muted-foreground ml-auto">
                                <button
                                    className="hover:text-foreground transition-colors"
                                    onClick={() => {
                                        setEditingComment(comment.id);
                                        setEditContent(comment.content);
                                    }}
                                >
                                    수정
                                </button>
                                <button
                                    className="hover:text-destructive transition-colors"
                                    onClick={() => handleDeleteComment(comment.id)}
                                >
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {replyingTo === comment.id && (
                        <div className="mt-3 space-y-2">
                            <Textarea
                                placeholder="답글을 작성해주세요..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="min-h-[80px]"
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleSubmitReply(comment.id)}
                                    disabled={!replyContent.trim() || isSubmitting}
                                >
                                    답글 작성
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent('');
                                    }}
                                >
                                    취소
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3">
                            {comment.replies.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    isReply={true}
                                    onLike={onLike}
                                    onReply={onReply}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    replyingTo={replyingTo}
                                    replyContent={replyContent}
                                    setReplyContent={setReplyContent}
                                    setReplyingTo={setReplyingTo}
                                    isSubmitting={isSubmitting}
                                    handleSubmitReply={handleSubmitReply}
                                    editingComment={editingComment}
                                    editContent={editContent}
                                    setEditContent={setEditContent}
                                    setEditingComment={setEditingComment}
                                    handleEditComment={handleEditComment}
                                    formatDate={formatDate}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* 프로필 상세 모달 */}
            <ProfileDetailModal
                userId={comment.authorId}
                open={isProfileModalOpen}
                onOpenChange={setIsProfileModalOpen}
            />
        </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* 댓글 작성 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            <h3 className="font-medium">일반 댓글</h3>
                        </div>
                        
                        <Textarea
                            placeholder="이 테마에 대한 의견을 남겨주세요. (스포일러 없이)"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[100px]"
                        />
                        
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                                스포일러가 포함된 내용은 스포일러 댓글 탭을 이용해주세요.
                            </p>
                            <Button
                                onClick={handleSubmitComment}
                                disabled={!newComment.trim() || isSubmitting}
                            >
                                댓글 작성
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 댓글 목록 */}
            <div className="space-y-4">
                {isLoading ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <p className="text-gray-500">댓글을 불러오는 중...</p>
                        </CardContent>
                    </Card>
                ) : comments.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">아직 댓글이 없습니다.</p>
                            <p className="text-sm text-gray-400 mt-1">첫 번째 댓글을 작성해보세요!</p>
                        </CardContent>
                    </Card>
                ) : (
                    comments.map(comment => (
                        <Card key={comment.id}>
                            <CardContent className="pt-4">
                                <CommentItem
                                    comment={comment}
                                    onLike={handleLikeComment}
                                    onReply={setReplyingTo}
                                    onEdit={(id, content) => {
                                        setEditingComment(id);
                                        setEditContent(content);
                                    }}
                                    onDelete={handleDeleteComment}
                                    replyingTo={replyingTo}
                                    replyContent={replyContent}
                                    setReplyContent={setReplyContent}
                                    setReplyingTo={setReplyingTo}
                                    isSubmitting={isSubmitting}
                                    handleSubmitReply={handleSubmitReply}
                                    editingComment={editingComment}
                                    editContent={editContent}
                                    setEditContent={setEditContent}
                                    setEditingComment={setEditingComment}
                                    handleEditComment={handleEditComment}
                                    formatDate={formatDate}
                                />
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default GeneralComments;