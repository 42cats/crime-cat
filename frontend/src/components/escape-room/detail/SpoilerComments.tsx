import React, { useState } from 'react';
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
    isHidden: boolean;
}

interface SpoilerCommentsProps {
    themeId: string;
    hasGameHistory: boolean;
}

const SpoilerComments: React.FC<SpoilerCommentsProps> = ({ 
    themeId, 
    hasGameHistory 
}) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [spoilerAgreement, setSpoilerAgreement] = useState(false);
    const [showSpoilers, setShowSpoilers] = useState(false);

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
            // TODO: API 호출
            console.log('스포일러 댓글 작성:', { themeId, content: newComment });
            setNewComment('');
            setSpoilerAgreement(false);
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
            console.log('스포일러 답글 작성:', { themeId, parentId, content: replyContent });
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

    const toggleCommentVisibility = (commentId: string) => {
        setComments(prev => prev.map(comment => 
            comment.id === commentId 
                ? { ...comment, isHidden: !comment.isHidden }
                : comment
        ));
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
                        <Badge variant="destructive" className="text-xs">스포일러</Badge>
                        {comment.isOwn && <Badge variant="outline" className="text-xs">내 댓글</Badge>}
                    </div>
                    
                    <div className="relative">
                        {comment.isHidden && !showSpoilers ? (
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
                                <p className="text-sm text-gray-700 leading-relaxed bg-red-50 border border-red-200 rounded-md p-3">
                                    {comment.content}
                                </p>
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
                    
                    {(!comment.isHidden || showSpoilers) && (
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
                    onCheckedChange={setShowSpoilers}
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
                                onCheckedChange={setSpoilerAgreement}
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
                {comments.length === 0 ? (
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