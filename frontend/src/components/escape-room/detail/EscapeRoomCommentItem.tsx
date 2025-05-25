import React, { useState } from "react";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
    MessageSquare,
    ThumbsUp,
    AlertTriangle,
    Shield,
    Eye,
    EyeOff,
    Trash2,
    Edit2
} from "lucide-react";
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
import { CommentRequest } from "@/types/comment";
import { CommentForm } from "@/components/comments/CommentForm";
import { CommentResponse } from "@/api/comment/escapeRoomCommentService";

interface EscapeRoomCommentItemProps {
    comment: CommentResponse;
    themeId: string;
    hasPlayedGame: boolean;
    onReply: (commentId: string, data: CommentRequest) => Promise<void>;
    onUpdate: (commentId: string, data: CommentRequest) => Promise<void>;
    onDelete: (commentId: string) => Promise<void>;
    onLike: (commentId: string, isLiked: boolean) => Promise<void>;
    depth?: number;
}

const EscapeRoomCommentItem: React.FC<EscapeRoomCommentItemProps> = ({
    comment,
    themeId,
    hasPlayedGame,
    onReply,
    onUpdate,
    onDelete,
    onLike,
    depth = 0
}) => {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [showSpoiler, setShowSpoiler] = useState(false);

    const isDeleted = comment.isDeleted;
    const isSpoiler = comment.isSpoiler;
    const canViewSpoiler = hasPlayedGame || comment.isOwnComment || !isSpoiler;
    const isLiked = comment.isLikedByCurrentUser;
    const isOwnComment = comment.isOwnComment;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return format(date, 'yyyy년 MM월 dd일', { locale: ko });
        } else if (days > 0) {
            return `${days}일 전`;
        } else if (hours > 0) {
            return `${hours}시간 전`;
        } else {
            return '방금 전';
        }
    };

    const handleLike = async () => {
        await onLike(comment.id, isLiked);
    };

    const handleReplySubmit = async (data: CommentRequest) => {
        await onReply(comment.id, data);
        setIsReplying(false);
    };

    const handleUpdateSubmit = async (data: CommentRequest) => {
        await onUpdate(comment.id, data);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        await onDelete(comment.id);
        setIsDeleteDialogOpen(false);
    };

    // 삭제된 댓글 처리
    if (isDeleted) {
        return (
            <div className="py-3 border-b border-border/50 last:border-0 transition-colors duration-200">
                <div className="flex gap-3">
                    <Avatar className="h-8 w-8 rounded-full border bg-muted/20 shrink-0">
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground">?</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-muted-foreground text-sm italic">
                            삭제된 댓글입니다.
                        </div>
                        
                        {/* 답글이 있는 경우 표시 */}
                        {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 space-y-3">
                                {comment.replies.map((reply) => (
                                    <EscapeRoomCommentItem
                                        key={reply.id}
                                        comment={reply}
                                        themeId={themeId}
                                        hasPlayedGame={hasPlayedGame}
                                        onReply={onReply}
                                        onUpdate={onUpdate}
                                        onDelete={onDelete}
                                        onLike={onLike}
                                        depth={depth + 1}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-3 border-b border-border/50 last:border-0 transition-colors duration-200">
            <div className="flex gap-3">
                <Avatar 
                    className="h-8 w-8 rounded-full border bg-muted/20 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all" 
                    onClick={() => setIsProfileModalOpen(true)}
                >
                    <AvatarImage src={comment.authorProfileImage} alt={comment.authorName} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {comment.authorName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span 
                                    className="font-medium text-foreground text-sm cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => setIsProfileModalOpen(true)}
                                >
                                    {comment.authorName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatDate(comment.createdAt)}
                                </span>
                                {isSpoiler && (
                                    <Badge variant="destructive" className="text-xs">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        스포일러
                                    </Badge>
                                )}
                                {comment.isGameHistoryComment && (
                                    <Badge variant="outline" className="text-xs">
                                        게임 기록
                                    </Badge>
                                )}
                            </div>

                            {/* 댓글 내용 */}
                            {!isEditing ? (
                                <div className="mt-2">
                                    {isSpoiler && !canViewSpoiler ? (
                                        <div className="relative">
                                            {showSpoiler ? (
                                                <div>
                                                    <p className="text-sm text-foreground whitespace-pre-wrap break-words bg-orange-50 border border-orange-200 rounded-md p-3">
                                                        {comment.content}
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowSpoiler(false)}
                                                        className="absolute top-1 right-1 h-auto p-1"
                                                    >
                                                        <EyeOff className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div 
                                                    className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                                                    onClick={() => setShowSpoiler(true)}
                                                >
                                                    <Shield className="w-4 h-4 text-orange-600" />
                                                    <span className="text-sm text-gray-600">
                                                        스포일러가 포함된 댓글입니다. 클릭하여 표시
                                                    </span>
                                                    <Eye className="w-4 h-4 text-gray-500 ml-auto" />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className={`text-sm text-foreground whitespace-pre-wrap break-words ${
                                            isSpoiler ? 'bg-orange-50 border border-orange-200 rounded-md p-3' : ''
                                        }`}>
                                            {comment.content}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <CommentForm
                                        onSubmit={handleUpdateSubmit}
                                        initialData={{
                                            content: comment.content,
                                            isSpoiler: comment.isSpoiler,
                                        }}
                                        isEditing
                                        onCancel={() => setIsEditing(false)}
                                    />
                                </div>
                            )}

                            {/* 액션 버튼들 */}
                            <div className="flex items-center gap-4 mt-2">
                                <button
                                    className={`text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors ${
                                        isLiked ? "text-blue-500 dark:text-blue-400" : ""
                                    }`}
                                    onClick={handleLike}
                                >
                                    <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
                                    <span>
                                        좋아요 {comment.likes > 0 && <span className="ml-0.5 font-medium">({comment.likes})</span>}
                                    </span>
                                </button>

                                {depth < 2 && (
                                    <button
                                        className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setIsReplying(!isReplying)}
                                    >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        <span>답글{isReplying ? " 취소" : ""}</span>
                                    </button>
                                )}

                                {isOwnComment && (
                                    <>
                                        <button
                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <Edit2 className="h-3.5 w-3.5 inline mr-1" />
                                            수정
                                        </button>
                                        <button
                                            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                                            onClick={() => setIsDeleteDialogOpen(true)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 inline mr-1" />
                                            삭제
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* 답글 작성 폼 */}
                            {isReplying && (
                                <div className="mt-3 ml-4 p-2">
                                    <CommentForm
                                        onSubmit={handleReplySubmit}
                                        parentId={comment.id}
                                        onCancel={() => setIsReplying(false)}
                                    />
                                </div>
                            )}

                            {/* 답글 목록 */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-3 ml-4">
                                    {depth === 0 && (
                                        <button
                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
                                            onClick={() => setShowReplies(!showReplies)}
                                        >
                                            {showReplies ? "답글 숨기기" : `답글 ${comment.replies.length}개 보기`}
                                        </button>
                                    )}

                                    {showReplies && (
                                        <div className="space-y-3">
                                            {comment.replies.map((reply) => (
                                                <EscapeRoomCommentItem
                                                    key={reply.id}
                                                    comment={reply}
                                                    themeId={themeId}
                                                    hasPlayedGame={hasPlayedGame}
                                                    onReply={onReply}
                                                    onUpdate={onUpdate}
                                                    onDelete={onDelete}
                                                    onLike={onLike}
                                                    depth={depth + 1}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 삭제 확인 다이얼로그 */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            정말로 이 댓글을 삭제하시겠습니까?
                            {comment.isGameHistoryComment && (
                                <span className="block mt-2 text-orange-600">
                                    게임 기록과 연결된 댓글은 완전히 삭제됩니다.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 프로필 모달 */}
            <ProfileDetailModal
                userId={comment.authorId}
                open={isProfileModalOpen}
                onOpenChange={setIsProfileModalOpen}
            />
        </div>
    );
};

export default EscapeRoomCommentItem;