import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageSquare } from "lucide-react";
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

// 백엔드 CommentController에서 제공하는 정렬 옵션과 동일하게 설정
type CommentSortType = "LATEST" | "OLDEST" | "LIKES";

// 정렬 옵션 라벨 표시를 위한 맵핑
const sortTypeLabels: Record<CommentSortType, string> = {
    LATEST: "최신순",
    OLDEST: "오래된순",
    LIKES: "인기순"
};

export function CommentList({
    gameThemeId,
    currentUserId,
    hasPlayedGame,
}: CommentListProps) {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [comments, setComments] = useState<Comment[]>([]);
    const [sortType, setSortType] = useState<CommentSortType>("LATEST");
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalComments, setTotalComments] = useState(0);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    // 페이지네이션을 위한 상태 추가
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const fetchComments = async (page = 0, sort: CommentSortType = "LATEST", size = pageSize) => {
        if (!gameThemeId) return;

        setIsLoading(true);
        try {
            const result = await commentService.getComments(gameThemeId, page, size, sort);
            const newComments = result.content;

            // 항상 현재 페이지의 댓글만 표시 (이전 무한 스크롤 방식에서 페이지네이션 방식으로 변경)
            setComments(newComments);
            
            setHasMore(!result.last);
            setTotalComments(result.totalElements);
            setCurrentPage(page);
            setTotalPages(result.totalPages);
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
        fetchComments(0, sortType, pageSize);
    }, [gameThemeId, sortType, pageSize]);

    // 페이지 변경 핸들러
    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages && !isLoading) {
            fetchComments(newPage, sortType, pageSize);
        }
    };
    
    // 페이지 크기 변경 핸들러
    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        fetchComments(0, sortType, newSize);
    };

    const handleSortChange = (value: CommentSortType) => {
        if (value !== sortType) {
            setSortType(value);
            setCurrentPage(0);
            fetchComments(0, value, pageSize);
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
            fetchComments(0, sortType, pageSize);
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
            fetchComments(0, sortType, pageSize);
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
            fetchComments(0, sortType, pageSize);
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
            fetchComments(0, sortType, pageSize);
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

            // 재귀적 함수를 사용하여 모든 깊이의 댓글 처리
            const updateCommentsLike = (comments: Comment[]): Comment[] => {
                return comments.map(comment => {
                    // 현재 댓글이 대상인 경우
                    if (comment.id === commentId) {
                        return {
                            ...comment,
                            likes: isLiked ? comment.likes - 1 : comment.likes + 1,
                            isLikedByCurrentUser: !isLiked,
                        };
                    }
                    
                    // 댓글에 답글이 있는 경우 재귀적으로 처리
                    if (comment.replies && comment.replies.length > 0) {
                        return {
                            ...comment,
                            replies: updateCommentsLike(comment.replies)
                        };
                    }
                    
                    return comment;
                });
            };

            // 현재 목록에 있는 모든 댓글에 대해 처리
            setComments(prevComments => updateCommentsLike(prevComments));
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
        <div className="mt-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                    댓글 {totalComments > 0 && (
                        <span className="text-sm px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                            {totalComments}
                        </span>
                    )}
                </h2>

                <div className="flex items-center gap-2">
                    {Object.entries(sortTypeLabels).map(([type, label]) => (
                        <button
                            key={type}
                            className={`px-2 py-1 text-xs rounded-md transition-colors ${sortType === type ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => handleSortChange(type as CommentSortType)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {comments.length === 0 && !isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                    <p className="text-sm">아직 댓글이 없습니다. 첫 댓글을 작성해보세요!</p>
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
                            depth={0} // 최상위 댓글의 깊이는 0
                        />
                    ))}

                    {/* 페이지네이션 컴포넌트 */}
                    {comments.length > 0 && totalPages > 1 && (
                        <div className="flex justify-center items-center mt-4 gap-2">
                            <button
                                className={`px-2 py-1 text-xs ${currentPage === 0 ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-foreground transition-colors'}`}
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 0 || isLoading}
                            >
                                이전
                            </button>
                            
                            {/* 페이지 번호 */}
                            <div className="flex items-center">
                                {Array.from({ length: totalPages })
                                    .map((_, index) => {
                                        // 현재 페이지 주변 페이지만 표시
                                        if (
                                            index === 0 ||
                                            index === totalPages - 1 ||
                                            (index >= currentPage - 1 && index <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={index}
                                                    className={`w-7 h-7 mx-0.5 text-xs ${currentPage === index ? "bg-primary/10 text-primary rounded-full" : "text-muted-foreground hover:text-foreground"}`}
                                                    onClick={() => handlePageChange(index)}
                                                    disabled={isLoading}
                                                >
                                                    {index + 1}
                                                </button>
                                            );
                                        } else if (
                                            (index === currentPage - 2 && currentPage > 2) ||
                                            (index === currentPage + 2 && currentPage < totalPages - 3)
                                        ) {
                                            // 생략 부호 표시
                                            return <span key={index} className="text-muted-foreground mx-0.5">...</span>;
                                        }
                                        return null;
                                    })
                                    .filter(Boolean)}
                            </div>
                            
                            <button
                                className={`px-2 py-1 text-xs ${currentPage === totalPages - 1 ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-foreground transition-colors'}`}
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages - 1 || isLoading}
                            >
                                다음
                            </button>
                            
                            {/* 페이지 크기 선택 */}
                            <select
                                className="ml-2 px-1 py-0.5 text-xs border border-border rounded text-muted-foreground"
                                value={pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                disabled={isLoading}
                            >
                                <option value="5">5개</option>
                                <option value="10">10개</option>
                                <option value="20">20개</option>
                                <option value="50">50개</option>
                            </select>
                        </div>
                    )}
                </div>
            )}
            <div className="border-t border-border/30 mt-4 pt-4">
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
                        <AlertDialogCancel>취소</AlertDialogCancel>
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