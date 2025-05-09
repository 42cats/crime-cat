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
            <div className="py-4 px-2 text-muted-foreground italic">
                삭제된 댓글입니다.
            </div>
        );
    }

    return (
        <div className="py-4 border-b border-gray-100 last:border-0">
            {/* 댓글 내용 */}
            <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage
                        src={comment.authorProfileImage}
                        alt={comment.authorName}
                    />
                    <AvatarFallback>
                        {comment.authorName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium">
                                {comment.authorName}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                                {format(
                                    new Date(comment.createdAt),
                                    "yyyy.MM.dd HH:mm",
                                    { locale: ko }
                                )}
                            </span>
                            {comment.createdAt !== comment.updatedAt && (
                                <span className="text-xs text-muted-foreground ml-2">
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
                                        className="h-8 w-8 p-0"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        <span>수정하기</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setIsDeleteDialogOpen(true);
                                        }}
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
                                className={`mt-1 ${
                                    !canViewSpoiler && !isOwnComment
                                        ? "blur-sm hover:blur-none cursor-pointer transition-all"
                                        : ""
                                }`}
                            >
                                {/* 스포일러 숨김 상황이면 항상 이 블록을 렌더링 */}
                                {!canViewSpoiler && (
                                    <div className="flex items-center mb-1 text-amber-600">
                                        <AlertTriangle className="h-4 w-4 mr-1" />
                                        <span className="text-xs">
                                            {isOwnComment
                                                ? "스포일러로 작성된 내용입니다"
                                                : "스포일러 내용입니다. 게임을 플레이한 후 확인하세요."}
                                        </span>
                                    </div>
                                )}

                                <div className="whitespace-pre-wrap">
                                    {comment.content}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mt-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`text-xs flex items-center gap-1 px-2 py-1 h-auto ${
                                        isLiked ? "text-blue-600" : ""
                                    }`}
                                    onClick={handleLike}
                                >
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                    <span>
                                        {comment.likes > 0 ? comment.likes : ""}
                                    </span>
                                </Button>

                                {/* 답글의 답글까지만 허용 (depth < 2) */}
                                {depth < 2 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs flex items-center gap-1 px-2 py-1 h-auto"
                                        onClick={() => setIsReplying(!isReplying)}
                                    >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        <span>답글</span>
                                    </Button>
                                )}
                            </div>
                        </>
                    )}

                    {/* 답글 작성 폼 */}
                    {isReplying && (
                        <div className="mt-4">
                            <CommentForm
                                onSubmit={handleReplySubmit}
                                parentId={comment.id}
                                onCancel={() => setIsReplying(false)}
                            />
                        </div>
                    )}

                    {/* 답글 목록 */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-gray-100">
                            <div className="flex items-center mb-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs flex items-center gap-1 p-0 h-auto"
                                    onClick={() => setShowReplies(!showReplies)}
                                >
                                    <span>
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            정말로 이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴
                            수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
