import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, AlertTriangle, MessageCircle, Reply, Heart, MoreHorizontal, Edit, Trash2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/useToast';
import { escapeRoomCommentService, EscapeRoomCommentResponseDto } from '@/api/comment/escapeRoomCommentService';

interface SpoilerCommentsProps {
    themeId: string;
    hasGameHistory: boolean;
}

const SpoilerComments: React.FC<SpoilerCommentsProps> = ({ 
    themeId, 
    hasGameHistory 
}) => {
    const [comments, setComments] = useState<EscapeRoomCommentResponseDto[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [spoilerAgreement, setSpoilerAgreement] = useState(false);
    const [showSpoilers, setShowSpoilers] = useState(false);
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [hiddenComments, setHiddenComments] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    useEffect(() => {
        if (hasGameHistory) {
            fetchComments();
        }
    }, [themeId, hasGameHistory]);

    const fetchComments = async () => {
        try {
            setIsLoading(true);
            const response = await escapeRoomCommentService.getCommentsByTheme(themeId, 0, 20, true);
            setComments(response.content.filter(comment => comment.hasSpoiler));
            // 초기에는 모든 스포일러 댓글을 숨김 처리
            setHiddenComments(new Set(response.content.map(c => c.id)));
        } catch (error) {
            console.error('스포일러 댓글 목록 조회 실패:', error);
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
        if (!newComment.trim() || !spoilerAgreement) return;
        
        setIsSubmitting(true);
        try {
            await escapeRoomCommentService.createComment({
                escapeRoomThemeId: themeId,
                content: newComment,
                hasSpoiler: true
            });
            setNewComment('');
            setSpoilerAgreement(false);
            await fetchComments();
            toast({
                title: "댓글 작성 완료",
                description: "스포일러 댓글이 성공적으로 작성되었습니다."
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
                hasSpoiler: true,
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

    const handleLikeComment = async (comment: EscapeRoomCommentResponseDto) => {
        try {
            if (comment.isLiked) {
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
                content: editContent,
                hasSpoiler: true
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

    const toggleCommentVisibility = (commentId: string) => {
        setHiddenComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    const renderComment = (comment: EscapeRoomCommentResponseDto, isReply = false) => {
        const isHidden = hiddenComments.has(comment.id) && !showSpoilers;
        
        return (
            <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : ''}`}>
                <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.userProfileImageUrl} />
                        <AvatarFallback>{comment.userNickname[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.userNickname}</span>
                            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                            <Badge variant="destructive" className="text-xs">스포일러</Badge>
                            {comment.isAuthor && <Badge variant="outline" className="text-xs">내 댓글</Badge>}
                        </div>
                        
                        <div className="relative">
                            {isHidden ? (
                                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                                    <Shield className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 mb-2">스포일러가 포함된 댓글입니다</p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => toggleCommentVisibility(comment.id)}
                                        className="gap-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        내용 보기
                                    </Button>
                                </div>
                            ) : (
                                <>
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
                                        <p className="text-sm text-gray-700 leading-relaxed bg-red-50 border border-red-200 rounded-md p-3">
                                            {comment.content}
                                        </p>
                                    )}
                                    {!showSpoilers && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => toggleCommentVisibility(comment.id)}
                                            className="absolute top-1 right-1 h-auto p-1"
                                        >
                                            <EyeOff className="w-4 h-4" />
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                        
                        {!isHidden && (
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleLikeComment(comment)}
                                    className={`h-auto p-1 gap-1 ${comment.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                                >
                                    <Heart className="w-3 h-3" fill={comment.isLiked ? 'currentColor' : 'none'} />
                                    <span className="text-xs">{comment.likesCount}</span>
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
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-auto p-1">
                                            <MoreHorizontal className="w-3 h-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {comment.isAuthor ? (
                                            <>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setEditingComment(comment.id);
                                                        setEditContent(comment.content);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    수정
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-red-600"
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    삭제
                                                </DropdownMenuItem>
                                            </>
                                        ) : (
                                            <DropdownMenuItem>
                                                <Flag className="w-4 h-4 mr-2" />
                                                신고
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                        
                        {replyingTo === comment.id && (
                            <div className="mt-3 space-y-2">
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        답글도 스포일러로 처리됩니다.
                                    </AlertDescription>
                                </Alert>
                                <Textarea
                                    placeholder="스포일러 답글을 작성해주세요..."
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
                                {comment.replies.map(reply => renderComment(reply, true))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (!hasGameHistory) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <Shield className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                        게임 기록이 필요합니다
                    </h3>
                    <p className="text-sm text-gray-500">
                        스포일러 댓글을 보거나 작성하려면 먼저 게임 기록을 추가해주세요.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* 스포일러 경고 및 전체 보기 옵션 */}
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    이 섹션에는 게임의 스포일러가 포함될 수 있습니다. 
                    게임을 완전히 체험하기 전에는 주의해서 읽어주세요.
                </AlertDescription>
            </Alert>

            <div className="flex items-center gap-2">
                <Checkbox
                    id="show-spoilers"
                    checked={showSpoilers}
                    onCheckedChange={(checked) => setShowSpoilers(checked as boolean)}
                />
                <label htmlFor="show-spoilers" className="text-sm">
                    모든 스포일러 댓글 표시
                </label>
            </div>

            {/* 댓글 작성 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-red-500" />
                            <h3 className="font-medium">스포일러 댓글</h3>
                        </div>
                        
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                이 댓글은 스포일러로 표시되어 다른 사용자들이 선택적으로 볼 수 있습니다.
                            </AlertDescription>
                        </Alert>
                        
                        <Textarea
                            placeholder="게임에 대한 자세한 리뷰나 공략을 작성해주세요..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[100px]"
                        />
                        
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="spoiler-agreement"
                                checked={spoilerAgreement}
                                onCheckedChange={(checked) => setSpoilerAgreement(checked as boolean)}
                            />
                            <label htmlFor="spoiler-agreement" className="text-sm">
                                이 댓글에 스포일러가 포함되어 있음을 확인합니다.
                            </label>
                        </div>
                        
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSubmitComment}
                                disabled={!newComment.trim() || !spoilerAgreement || isSubmitting}
                            >
                                스포일러 댓글 작성
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
                            <Shield className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">아직 스포일러 댓글이 없습니다.</p>
                            <p className="text-sm text-gray-400 mt-1">게임 후기나 공략을 공유해보세요!</p>
                        </CardContent>
                    </Card>
                ) : (
                    comments.map(comment => (
                        <Card key={comment.id}>
                            <CardContent className="pt-4">
                                {renderComment(comment)}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default SpoilerComments;