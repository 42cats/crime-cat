import React, { useState } from "react";
import { Heart, MessageSquare, AlertTriangle } from "lucide-react";
import { Comment, CommentRequest } from "@/types/comment";
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

interface CommentItemProps {
    comment: Comment;
    gameThemeId: string;
    hasPlayedGame: boolean;
    onLike: (commentId: string, isLiked: boolean) => Promise<void>;
    onReply: (parentId: string, data: CommentRequest) => Promise<void>;
    onDelete: (commentId: string) => Promise<void>;
    currentUserId?: string;
    onLoginRequired: () => void;
    isAuthenticated: boolean;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    return "방금 전";
};

const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    gameThemeId,
    hasPlayedGame,
    onLike,
    onReply,
    onDelete,
    currentUserId,
    onLoginRequired,
    isAuthenticated,
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");
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
                isSpoiler,
            });
            setReplyContent("");
            setIsSpoiler(false);
            setIsReplying(false);
        } catch (error) {
            console.error("답글 제출 중 오류 발생:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(comment.id);
        } catch (error) {
            console.error("댓글 삭제 중 오류 발생:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (comment.isDeleted) {
        return (
            <div className="border-t border-gray-100 pt-3 pb-2">
                <div className="text-gray-400 text-sm italic">
                    삭제된 댓글입니다.
                </div>

                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 pl-4">
                        <button
                            className="text-xs text-gray-500 mb-2"
                            onClick={() => setShowReplies(!showReplies)}
                        >
                            {showReplies
                                ? "답글 숨기기"
                                : `답글 ${comment.replies.length}개 보기`}
                        </button>

                        {showReplies && (
                            <div className="space-y-3">
                                {comment.replies.map((reply) => (
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
                        <span className="font-medium text-sm">
                            {comment.authorName}
                        </span>
                        <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                        </span>
                    </div>

                    <div className="mt-1 mb-2">
                        {isSpoilerContent && !canViewSpoiler ? (
                            <div className="p-2 bg-amber-50 text-amber-600 rounded text-sm flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                <span>
                                    스포일러 내용입니다. 게임을 플레이한 후
                                    확인하세요.
                                </span>
                            </div>
                        ) : (
                            <div className="text-sm break-words whitespace-pre-wrap">
                                {isSpoilerContent && (
                                    <Badge
                                        variant="outline"
                                        className="mb-1 bg-amber-50 text-amber-600 border-amber-200"
                                    >
                                        스포일러
                                    </Badge>
                                )}
                                <p>{comment.content}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                        <button
                            className={`flex items-center gap-1 text-xs ${
                                isLiked ? "text-red-500" : "text-gray-500"
                            }`}
                            onClick={handleLike}
                        >
                            <Heart
                                className={`h-3.5 w-3.5 ${
                                    isLiked ? "fill-red-500" : ""
                                }`}
                            />
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
                        <form
                            onSubmit={handleReplySubmit}
                            className="mb-3 mt-2"
                        >
                            <Textarea
                                value={replyContent}
                                onChange={(e) =>
                                    setReplyContent(e.target.value)
                                }
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
                                        disabled={
                                            !replyContent.trim() || isSubmitting
                                        }
                                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md disabled:opacity-50"
                                    >
                                        {isSubmitting
                                            ? "게시 중..."
                                            : "답글 게시"}
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
                                {showReplies
                                    ? "답글 숨기기"
                                    : `답글 ${comment.replies.length}개 보기`}
                            </button>

                            {showReplies && (
                                <div className="space-y-3">
                                    {comment.replies.map((reply) => (
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

export default CommentItem;
