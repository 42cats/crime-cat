import React, { useState } from 'react';
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

interface Comment {
    id: string;
    content: string;
    author: {
        id: string;
        nickname: string;
        avatar?: string;
    };
    createdAt: string;
    likes: number;
    isLiked: boolean;
    replies?: Comment[];
    isOwn: boolean;
}

interface GeneralCommentsProps {
    themeId: string;
    hasGameHistory: boolean;
}

const GeneralComments: React.FC<GeneralCommentsProps> = ({ 
    themeId, 
    hasGameHistory 
}) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            // TODO: API 호출
            console.log('댓글 작성:', { themeId, content: newComment });
            setNewComment('');
        } catch (error) {
            console.error('댓글 작성 실패:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!replyContent.trim()) return;
        
        setIsSubmitting(true);
        try {
            // TODO: API 호출
            console.log('답글 작성:', { themeId, parentId, content: replyContent });
            setReplyContent('');
            setReplyingTo(null);
        } catch (error) {
            console.error('답글 작성 실패:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLikeComment = async (commentId: string) => {
        try {
            // TODO: API 호출
            console.log('댓글 좋아요:', commentId);
        } catch (error) {
            console.error('좋아요 실패:', error);
        }
    };

    const renderComment = (comment: Comment, isReply = false) => (
        <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : ''}`}>
            <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.author.avatar} />
                    <AvatarFallback>{comment.author.nickname[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.author.nickname}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                        {comment.isOwn && <Badge variant="outline" className="text-xs">내 댓글</Badge>}
                    </div>
                    
                    <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                    
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikeComment(comment.id)}
                            className={`h-auto p-1 gap-1 ${comment.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                        >
                            <Heart className="w-3 h-3" fill={comment.isLiked ? 'currentColor' : 'none'} />
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
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-auto p-1">
                                    <MoreHorizontal className="w-3 h-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {comment.isOwn ? (
                                    <>
                                        <DropdownMenuItem>
                                            <Edit className="w-4 h-4 mr-2" />
                                            수정
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">
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
                            {comment.replies.map(reply => renderComment(reply, true))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

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
                {comments.length === 0 ? (
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
                                {renderComment(comment)}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default GeneralComments;