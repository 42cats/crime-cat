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
            <div className="py-4 px-3 text-muted-foreground italic bg-muted/10 rounded-md text-sm my-2 flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-muted-foreground/70" />
                삭제된 댓글입니다.
            </div>
        );
    }

    return (
        <div className="py-4 border-b border-border last:border-0 transition-colors duration-200">
            {/* 댓글 내용 */}
            <div className="flex gap-3">
                <Avatar className="h-10 w-10 border bg-muted/20 shrink-0">
                    <AvatarImage
                        src={comment.authorProfileImage}
                        alt={comment.authorName}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                        {comment.authorName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">
                                {comment.authorName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {format(
                                    new Date(comment.createdAt),
                                    "yyyy.MM.dd HH:mm",
                                    { locale: ko }
                                )}
                            </span>
                            {comment.createdAt !== comment.updatedAt && (
                                <span className="text-xs text-muted-foreground italic">
                                    (수정됨)
                                </span>
                            )}
                        </div>

                        {comment.isOwnComment && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">더보기</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center cursor-pointer"
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        <span>수정하기</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setIsDeleteDialogOpen(true);
                                        }}
                                        className="flex items-center text-destructive cursor-pointer focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>삭제하기</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                    ) : (
                        <>
                            <div
                                className={`mt-2 rounded-md ${
                                    !canViewSpoiler && !isOwnComment
                                        ? "blur-sm hover:blur-none transition-all duration-300 cursor-pointer"
                                        : ""
                                }`}
                            >
                                {/* 스포일러 숨김 상황이면 항상 이 블록을 렌더링 */}
                                {!canViewSpoiler && (
                                    <div className="flex items-center mb-2 text-amber-500 dark:text-amber-400 p-1 rounded-md bg-amber-50 dark:bg-amber-900/20">
                                        <AlertTriangle className="h-4 w-4 mr-1" />
                                        <span className="text-xs">
                                            {isOwnComment
                                                ? "스포일러로 작성된 내용입니다"
                                                : "스포일러 내용입니다. 게임을 플레이한 후 확인하세요."}
                                        </span>
                                    </div>
                                )}

                                <div className="whitespace-pre-wrap break-words text-foreground p-2 rounded-md">
                                    {comment.content}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mt-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`text-xs flex items-center gap-1 px-2 py-1 h-auto rounded-full transition-colors ${isLiked ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30" : "hover:bg-muted"}`}
                                    onClick={handleLike}
                                >
                                    <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-blue-600 dark:fill-blue-500" : ""}`} />
                                    <span>
                                        {comment.likes > 0 ? comment.likes : ""}
                                    </span>
                                </Button>

                                {/* 답글의 답글까지만 허용 (depth < 2) */}
                                {depth < 2 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`text-xs flex items-center gap-1 px-2 py-1 h-auto rounded-full hover:bg-muted transition-colors ${isReplying ? "bg-muted" : ""}`}
                                        onClick={() => setIsReplying(!isReplying)}
                                    >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        <span>답글 {isReplying ? "취소" : ""}</span>
                                    </Button>
                                )}
                            </div>
                        </>
                    )}

                    {/* 답글 작성 폼 */}
                    {isReplying && (
                        <div className="mt-4 ml-0 md:ml-4 p-3 border border-border rounded-lg bg-muted/10">
                            <CommentForm
                                onSubmit={handleReplySubmit}
                                parentId={comment.id}
                                onCancel={() => setIsReplying(false)}
                            />
                        </div>
                    )}

                    {/* 답글 목록 */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 pl-2 md:pl-4 border-l-2 border-border/50 dark:border-border/30">
                            <div className="flex items-center mb-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs flex items-center gap-1 p-0 h-auto hover:bg-transparent hover:underline"
                                    onClick={() => setShowReplies(!showReplies)}
                                >
                                    <span className="text-muted-foreground">
                                        {showReplies
                                            ? "답글 숨기기"
                                            : `답글 ${comment.replies.length}개 보기`}
                                    </span>
                                </Button>
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
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">댓글 삭제</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            정말로 이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-border hover:bg-muted">취소</AlertDialogCancel>
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
