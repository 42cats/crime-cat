import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Comment, CommentRequest } from "@/types/comment";
import { commentService } from "@/api/commentService";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
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
import { useNavigate } from "react-router-dom";

interface CommentListProps {
    gameThemeId: string;
    currentUserId?: string;
    hasPlayedGame: boolean;
}

type SortOption = "latest" | "popular";

export function CommentList({
    gameThemeId,
    currentUserId,
    hasPlayedGame,
}: CommentListProps) {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [comments, setComments] = useState<Comment[]>([]);
    const [sortOption, setSortOption] = useState<SortOption>("latest");
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalComments, setTotalComments] = useState(0);
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    const fetchComments = async (page = 0, sortBy: SortOption = "latest") => {
        if (!gameThemeId) return;

        setIsLoading(true);
        try {
            const result =
                sortBy === "latest"
                    ? await commentService.getComments(gameThemeId, page)
                    : await commentService.getPopularComments(
                          gameThemeId,
                          page
                      );

            const newComments = result.content;

            if (page === 0) {
                setComments(newComments);
            } else {
                setComments((prev) => [...prev, ...newComments]);
            }

            setHasMore(!result.last);
            setTotalComments(result.totalElements);
            setCurrentPage(page);
        } catch (error) {
            console.error("댓글을 불러오는 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "댓글을 불러오는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComments(0, sortOption);
    }, [gameThemeId, sortOption]);

    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            fetchComments(currentPage + 1, sortOption);
        }
    };

    const handleSortChange = (value: SortOption) => {
        if (value !== sortOption) {
            setSortOption(value);
            setCurrentPage(0);
        }
    };

    const checkLogin = (): boolean => {
        if (!currentUserId) {
            setShowLoginDialog(true);
            return false;
        }
        return true;
    };

    const handleCreateComment = async (data: CommentRequest) => {
        if (!checkLogin()) return;

        try {
            await commentService.createComment(gameThemeId, data);
            toast({
                title: "댓글 작성 완료",
                description: "댓글이 성공적으로 등록되었습니다.",
            });
            fetchComments(0, sortOption);
        } catch (error) {
            console.error("댓글 작성 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "댓글을 작성하는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    const handleReplyComment = async (
        parentId: string,
        data: CommentRequest
    ) => {
        if (!checkLogin()) return;

        try {
            await commentService.createComment(gameThemeId, {
                ...data,
                parentId,
            });
            toast({
                title: "답글 작성 완료",
                description: "답글이 성공적으로 등록되었습니다.",
            });
            fetchComments(0, sortOption);
        } catch (error) {
            console.error("답글 작성 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "답글을 작성하는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    const handleUpdateComment = async (
        commentId: string,
        data: CommentRequest
    ) => {
        if (!checkLogin()) return;

        try {
            await commentService.updateComment(gameThemeId, commentId, data);
            toast({
                title: "댓글 수정 완료",
                description: "댓글이 성공적으로 수정되었습니다.",
            });
            fetchComments(0, sortOption);
        } catch (error) {
            console.error("댓글 수정 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "댓글을 수정하는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!checkLogin()) return;

        try {
            await commentService.deleteComment(gameThemeId, commentId);
            toast({
                title: "댓글 삭제 완료",
                description: "댓글이 성공적으로 삭제되었습니다.",
            });
            fetchComments(0, sortOption);
        } catch (error) {
            console.error("댓글 삭제 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "댓글을 삭제하는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    const handleToggleLike = async (commentId: string, isLiked: boolean) => {
        if (!checkLogin()) return;

        try {
            if (isLiked) {
                await commentService.unlikeComment(gameThemeId, commentId);
            } else {
                await commentService.likeComment(gameThemeId, commentId);
            }

            // 좋아요 상태 업데이트
            setComments((prevComments) =>
                prevComments.map((comment) => {
                    if (comment.id === commentId) {
                        return {
                            ...comment,
                            likes: isLiked
                                ? comment.likes - 1
                                : comment.likes + 1,
                            isLikedByCurrentUser: !isLiked,
                        };
                    } else if (comment.replies) {
                        return {
                            ...comment,
                            replies: comment.replies.map((reply) =>
                                reply.id === commentId
                                    ? {
                                          ...reply,
                                          likes: isLiked
                                              ? reply.likes - 1
                                              : reply.likes + 1,
                                          isLikedByCurrentUser: !isLiked,
                                      }
                                    : reply
                            ),
                        };
                    }
                    return comment;
                })
            );
        } catch (error) {
            console.error("좋아요 처리 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "좋아요 처리 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                    댓글 {totalComments > 0 ? `(${totalComments})` : ""}
                </h2>

                <RadioGroup
                    value={sortOption}
                    onValueChange={(value) =>
                        handleSortChange(value as SortOption)
                    }
                    className="flex items-center space-x-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="latest" id="sort-latest" />
                        <Label htmlFor="sort-latest">최신순</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="popular" id="sort-popular" />
                        <Label htmlFor="sort-popular">인기순</Label>
                    </div>
                </RadioGroup>
            </div>

            {comments.length === 0 && !isLoading ? (
                <div className="py-12 text-center text-muted-foreground">
                    아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            gameThemeId={gameThemeId}
                            hasPlayedGame={hasPlayedGame}
                            onReply={handleReplyComment}
                            onUpdate={handleUpdateComment}
                            onDelete={handleDeleteComment}
                            onLike={handleToggleLike}
                        />
                    ))}

                    {hasMore && (
                        <div className="flex justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                disabled={isLoading}
                                className="text-sm"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        <span>로딩 중...</span>
                                    </>
                                ) : (
                                    <span>더 보기</span>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}
            <Separator className="my-6" />

            <div className="mb-6">
                <CommentForm onSubmit={handleCreateComment} />
            </div>

            {/* 로그인 필요 다이얼로그 */}
            <AlertDialog
                open={showLoginDialog}
                onOpenChange={setShowLoginDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>로그인이 필요합니다</AlertDialogTitle>
                        <AlertDialogDescription>
                            댓글 기능은 로그인한 사용자만 이용할 수 있습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>닫기</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowLoginDialog(false);
                                navigate("/login");
                            }}
                        >
                            로그인 하러 가기
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
