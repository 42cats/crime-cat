import React, { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    MessageSquare,
    ThumbsUp,
    AlertTriangle,
    Pencil,
    Trash2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Comment, CommentRequest } from "@/types/comment";
import { CommentForm } from "./CommentForm";

interface CommentItemProps {
    comment: Comment;
    gameThemeId: string;
    hasPlayedGame: boolean;
    onReply: (commentId: string, data: CommentRequest) => Promise<void>;
    onUpdate: (commentId: string, data: CommentRequest) => Promise<void>;
    onDelete: (commentId: string) => Promise<void>;
    onLike: (commentId: string, isLiked: boolean) => Promise<void>;
    depth?: number; // 댓글 깊이 추적을 위한 프로퍼티
}

export function CommentItem({
    comment,
    gameThemeId,
    hasPlayedGame,
    onReply,
    onUpdate,
    onDelete,
    onLike,
    depth = 0, // 기본값으로 0 설정 (최상위 댓글)
}: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const isDeleted = comment.isDeleted;
    const isSpoiler = comment.isSpoiler;
    const canViewSpoiler = hasPlayedGame || !isSpoiler;
    const isLiked = comment.isLikedByCurrentUser;
    const isOwnComment = comment.isOwnComment;

    const handleLike = async () => {
        await onLike(comment.id, isLiked);
        
        // depth 2 이상에서도 좌아요가 즉시 반영되도록 직접 업데이트
        if (depth >= 2) {
            // 로컬 상태 업데이트
            comment.likes = isLiked ? comment.likes - 1 : comment.likes + 1;
            comment.isLikedByCurrentUser = !isLiked;
        }
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

    if (isDeleted) {
        return (
            <div className="py-3 px-3 text-muted-foreground text-sm">
                삭제된 댓글입니다.
            </div>
        );
    }

    return (
        <div className="py-3 border-b border-border/50 last:border-0 transition-colors duration-200">
            {/* 댓글 내용 */}
            <div className="flex gap-3">
                <Avatar className="h-8 w-8 rounded-full border bg-muted/20 shrink-0">
                    <AvatarImage
                        src={comment.authorProfileImage}
                        alt={comment.authorName}
                    />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {comment.authorName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground text-sm">
                                    {comment.authorName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {format(
                                        new Date(comment.createdAt),
                                        "yyyy-MM-dd HH:mm",
                                        { locale: ko }
                                    )}
                                </span>
                            </div>
                            
                            <div className="whitespace-pre-wrap break-words text-foreground text-sm mt-1">
                                {comment.content}
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2">
                                <button
                                    className={`text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors ${isLiked ? "text-blue-500 dark:text-blue-400" : ""}`}
                                    onClick={handleLike}
                                >
                                    <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-blue-500 dark:fill-blue-400" : ""}`} />
                                    <span>좋아요</span>
                                </button>

                                {/* 답글의 답글까지만 허용 (depth < 2) */}
                                {depth < 2 && (
                                    <button
                                        className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setIsReplying(!isReplying)}
                                    >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        <span>답글{isReplying ? " 취소" : ""}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {comment.isOwnComment && (
                            <div className="flex gap-2 text-xs text-muted-foreground">
                                <button 
                                    className="hover:text-foreground transition-colors"
                                    onClick={() => setIsEditing(true)}
                                >
                                    수정
                                </button>
                                <button 
                                    className="hover:text-destructive transition-colors"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                >
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <CommentForm
                            onSubmit={handleUpdateSubmit}
                            initialData={{
                                content: comment.content,
                                isSpoiler: comment.isSpoiler,
                            }}
                            isEditing
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : null}

                    {/* 답글 작성 폼 */}
                    {isReplying && (
                        <div className="mt-2 ml-0 md:ml-4 p-2">
                            <CommentForm
                                onSubmit={handleReplySubmit}
                                parentId={comment.id}
                                onCancel={() => setIsReplying(false)}
                            />
                        </div>
                    )}

                    {/* 답글 목록 */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2 ml-0 md:ml-4">
                            <div className="flex items-center mb-1">
                                <button
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setShowReplies(!showReplies)}
                                >
                                    {showReplies
                                        ? "답글 숨기기"
                                        : `답글 ${comment.replies.length}개 보기`}
                                </button>
                            </div>

                            {showReplies && (
                                <div className="space-y-4">
                                    {comment.replies.map((reply) => (
                                        <CommentItem
                                            key={reply.id}
                                            comment={reply}
                                            gameThemeId={gameThemeId}
                                            hasPlayedGame={hasPlayedGame}
                                            onReply={onReply}
                                            onUpdate={onUpdate}
                                            onDelete={onDelete}
                                            onLike={onLike}
                                            depth={depth + 1} // 현재 depth에 1을 더한 값을 자식 댓글에게 전달
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 삭제 확인 다이얼로그 */}
            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
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
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}