import React, { useState } from "react";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UTCToKST } from "@/lib/dateFormat";
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

// 스포일러 알림 블록 컴포넌트
const SpoilerWarning = ({ isOwnComment }: { isOwnComment: boolean }) => (
    <div className="flex items-center mb-2 text-amber-500 dark:text-amber-400 p-1 rounded-md bg-amber-50 dark:bg-amber-900/20">
        <AlertTriangle className="h-4 w-4 mr-1" />
        <span className="text-xs">
            {isOwnComment
                ? "스포일러로 작성된 내용입니다"
                : "스포일러 내용입니다. 게임을 플레이한 후 확인하세요."}
        </span>
    </div>
);

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
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const isDeleted = comment.isDeleted;
    const isSpoiler = comment.isSpoiler;
    const canViewSpoiler = hasPlayedGame || !isSpoiler;
    const isLiked = comment.isLikedByCurrentUser;
    const isOwnComment = comment.isOwnComment;

    // 스포일러 처리 관련 함수
    const handleSpoilerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // 마우스 클릭시에도 블러가 해제되도록 추가 (터치 스크린용)
        const target = e.currentTarget;
        target.classList.remove("blur-[12px]");
        target.classList.add("blur-none");
        // 경고문구 숨기기
        const warningEl = target.nextElementSibling;
        if (warningEl) {
            warningEl.classList.add("opacity-0");
        }
    };

    const handleLike = async () => {
        await onLike(comment.id, isLiked);

        // depth 2 이상에서도 좋아요가 즉시 반영되도록 직접 업데이트
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
            <div className="py-3 border-b border-border/50 last:border-0 transition-colors duration-200">
                <div className="flex gap-3">
                    <Avatar
                        className="h-8 w-8 rounded-full border bg-muted/20 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                        onClick={() => setIsProfileModalOpen(true)}
                    >
                        <AvatarImage
                            src={
                                comment.authorProfileImage ||
                                "/content/image/default_profile_image.png"
                            }
                            alt={comment.authorName}
                        />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {comment.authorName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="font-medium text-foreground text-sm cursor-pointer hover:text-primary transition-colors"
                                        onClick={() =>
                                            setIsProfileModalOpen(true)
                                        }
                                    >
                                        {comment.authorName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        <UTCToKST date={comment.createdAt} />
                                    </span>
                                </div>

                                <div className="whitespace-pre-wrap break-words text-muted-foreground text-sm mt-2 mb-2 italic">
                                    삭제된 댓글입니다.
                                </div>
                            </div>
                        </div>

                        {/* 삭제된 댓글은 온곤 삭제되지만 답글은 유지 */}
                        {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-2 ml-0 md:ml-4">
                                <div className="flex items-center mb-1">
                                    <button
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() =>
                                            setShowReplies(!showReplies)
                                        }
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
        );
    }

    return (
        <div className="py-3 border-b border-border/50 last:border-0 transition-colors duration-200">
            {/* 댓글 내용 */}
            <div className="flex gap-3">
                <Avatar
                    className="h-8 w-8 rounded-full border bg-muted/20 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                    onClick={() => setIsProfileModalOpen(true)}
                >
                    <AvatarImage
                        src={
                            comment.authorProfileImage ||
                            "/content/image/default_profile_image.png"
                        }
                        alt={comment.authorName}
                    />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {comment.authorName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span
                                    className="font-medium text-foreground text-sm cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => setIsProfileModalOpen(true)}
                                >
                                    {comment.authorName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    <UTCToKST date={comment.createdAt} />
                                </span>
                            </div>

                            {/* 댓글 내용 (스포일러 처리) */}
                            {!isEditing ? (
                                <div className="whitespace-pre-wrap break-words text-foreground text-sm mt-2 mb-2">
                                    {/* 스포일러가 아니거나 게임을 플레이한 경우 - 그냥 내용 표시 */}
                                    {!isSpoiler || hasPlayedGame ? (
                                        <>
                                            {/* 게임을 플레이했더라도 스포일러면 경고 표시 */}
                                            {isSpoiler && hasPlayedGame && (
                                                <SpoilerWarning
                                                    isOwnComment={isOwnComment}
                                                />
                                            )}
                                            <div>{comment.content}</div>
                                        </>
                                    ) : (
                                        /* 스포일러인 경우 */
                                        <>
                                            {/* 내가 쓴 스포일러 - 블러 없이 표시하고 경고 문구만 */}
                                            {isOwnComment ? (
                                                <>
                                                    <SpoilerWarning
                                                        isOwnComment={true}
                                                    />
                                                    <div>{comment.content}</div>
                                                </>
                                            ) : (
                                                /* 다른 사람의 스포일러 - 블러 처리 및 경고 문구 */
                                                <div className="relative cursor-pointer group">
                                                    <div
                                                        className="blur-[12px] select-none group-hover:blur-none transition-all duration-200 p-2"
                                                        onClick={
                                                            handleSpoilerClick
                                                        }
                                                    >
                                                        {comment.content}
                                                    </div>
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity duration-200 text-amber-500 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-900/30 backdrop-blur-sm p-2 rounded">
                                                        <AlertTriangle className="h-4 w-4 mr-1" />
                                                        <span>
                                                            스포일러 내용입니다.
                                                            게임을 플레이한 후
                                                            확인하세요.
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-2 mb-2">
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

                            <div className="flex items-center gap-4">
                                <button
                                    className={`text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors ${
                                        isLiked
                                            ? "text-blue-500 dark:text-blue-400"
                                            : ""
                                    }`}
                                    onClick={handleLike}
                                >
                                    <ThumbsUp
                                        className={`h-3.5 w-3.5 ${
                                            isLiked
                                                ? "fill-blue-500 dark:fill-blue-400"
                                                : ""
                                        }`}
                                    />
                                    <span>
                                        좋아요{" "}
                                        {comment.likes > 0 && (
                                            <span className="ml-0.5 font-medium">
                                                ({comment.likes})
                                            </span>
                                        )}
                                    </span>
                                </button>

                                {/* 답글의 답글까지만 허용 (depth < 2) */}
                                {depth < 2 && (
                                    <button
                                        className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() =>
                                            setIsReplying(!isReplying)
                                        }
                                    >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        <span>
                                            답글{isReplying ? " 취소" : ""}
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {comment.isOwnComment && (
                            <div className="flex gap-2 text-xs text-muted-foreground whitespace-nowrap ml-2">
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

            {/* 프로필 상세 모달 */}
            <ProfileDetailModal
                userId={comment.authorId}
                open={isProfileModalOpen}
                onOpenChange={setIsProfileModalOpen}
            />
        </div>
    );
}
