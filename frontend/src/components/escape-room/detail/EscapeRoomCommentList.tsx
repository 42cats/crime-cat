import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/useToast";
import { Loader2, MessageCircle, Shield, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CommentForm } from "@/components/comments/CommentForm";
import { escapeRoomCommentService, CommentResponse, EscapeRoomCommentCreateDto, EscapeRoomCommentUpdateDto } from "@/api/comment/escapeRoomCommentService";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import EscapeRoomCommentItem from "./EscapeRoomCommentItem";
import { CommentRequest } from "@/types/comment";

interface EscapeRoomCommentListProps {
    themeId: string;
    hasGameHistory: boolean;
    allowComments: boolean;
}

// 정렬 옵션
type CommentSortType = "LATEST" | "OLDEST" | "LIKES";

const sortTypeLabels: Record<CommentSortType, string> = {
    LATEST: "최신순",
    OLDEST: "오래된순",
    LIKES: "인기순",
};

export function EscapeRoomCommentList({
    themeId,
    hasGameHistory,
    allowComments
}: EscapeRoomCommentListProps) {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [sortType, setSortType] = useState<CommentSortType>("LATEST");
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalComments, setTotalComments] = useState(0);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const loaderRef = useRef<HTMLDivElement>(null);
    const pageSize = 20;

    // 무한 스크롤을 위한 Intersection Observer
    useEffect(() => {
        const options = {
            root: null,
            rootMargin: "20px",
            threshold: 1.0,
        };

        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMore && !isLoading) {
                fetchMoreComments();
            }
        }, options);

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => {
            if (loaderRef.current) {
                observer.unobserve(loaderRef.current);
            }
        };
    }, [hasMore, isLoading, currentPage]);

    // 댓글 정렬
    const sortComments = (comments: CommentResponse[]): CommentResponse[] => {
        const sorted = [...comments];
        
        switch (sortType) {
            case "OLDEST":
                sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
            case "LIKES":
                sorted.sort((a, b) => b.likes - a.likes);
                break;
            case "LATEST":
            default:
                sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
        }
        
        return sorted;
    };

    // 초기 댓글 로드
    const fetchComments = async (page = 0, size = pageSize) => {
        if (!themeId || !allowComments) return;

        setIsLoading(true);
        try {
            const result = await escapeRoomCommentService.getCommentsByTheme(
                themeId,
                page,
                size
            );
            
            // 계층 구조를 평면화하여 모든 댓글 수집
            const allComments = flattenComments(result.content);
            const sortedComments = sortComments(allComments);
            
            setComments(sortedComments);
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

    // 댓글 계층 구조를 평면화
    const flattenComments = (comments: CommentResponse[]): CommentResponse[] => {
        const flattened: CommentResponse[] = [];
        
        comments.forEach(comment => {
            flattened.push(comment);
            if (comment.replies && comment.replies.length > 0) {
                flattened.push(...flattenComments(comment.replies));
            }
        });
        
        return flattened;
    };

    // 추가 댓글 로드 (무한 스크롤)
    const fetchMoreComments = async () => {
        if (!themeId || isLoading || !hasMore || !allowComments) return;

        setIsLoading(true);
        try {
            const nextPage = currentPage + 1;
            const result = await escapeRoomCommentService.getCommentsByTheme(
                themeId,
                nextPage,
                pageSize
            );

            const newComments = flattenComments(result.content);
            const allComments = [...comments, ...newComments];
            const sortedComments = sortComments(allComments);
            
            setComments(sortedComments);
            setHasMore(!result.last);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error("추가 댓글을 불러오는 중 오류가 발생했습니다:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComments(0, pageSize);
    }, [themeId, allowComments]);

    useEffect(() => {
        // 정렬 방식이 변경되면 현재 댓글 재정렬
        const sortedComments = sortComments(comments);
        setComments(sortedComments);
    }, [sortType]);

    const handleSortChange = (value: CommentSortType) => {
        if (value !== sortType) {
            setSortType(value);
        }
    };

    const checkLogin = (): boolean => {
        if (!user) {
            setShowLoginDialog(true);
            return false;
        }
        return true;
    };

    const handleCreateComment = async (data: CommentRequest) => {
        if (!checkLogin()) return;

        try {
            const createDto: EscapeRoomCommentCreateDto = {
                escapeRoomThemeId: themeId,
                content: data.content,
                hasSpoiler: data.isSpoiler || false,
                parentCommentId: data.parentId
            };
            
            await escapeRoomCommentService.createComment(createDto);
            toast({
                title: "댓글 작성 완료",
                description: "댓글이 성공적으로 등록되었습니다.",
            });
            
            // 댓글 새로고침
            setSortType("LATEST");
            fetchComments(0, pageSize);
        } catch (error) {
            console.error("댓글 작성 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "댓글을 작성하는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    const handleReplyComment = async (parentId: string, data: CommentRequest) => {
        if (!checkLogin()) return;

        try {
            const createDto: EscapeRoomCommentCreateDto = {
                escapeRoomThemeId: themeId,
                content: data.content,
                hasSpoiler: data.isSpoiler || false,
                parentCommentId: parentId
            };
            
            await escapeRoomCommentService.createComment(createDto);
            toast({
                title: "답글 작성 완료",
                description: "답글이 성공적으로 등록되었습니다.",
            });
            
            fetchComments(0, pageSize);
        } catch (error) {
            console.error("답글 작성 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "답글을 작성하는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    const handleUpdateComment = async (commentId: string, data: CommentRequest) => {
        if (!checkLogin()) return;

        try {
            const updateDto: EscapeRoomCommentUpdateDto = {
                content: data.content,
                hasSpoiler: data.isSpoiler
            };
            
            await escapeRoomCommentService.updateComment(commentId, updateDto);
            toast({
                title: "댓글 수정 완료",
                description: "댓글이 성공적으로 수정되었습니다.",
            });
            
            fetchComments(0, pageSize);
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
            await escapeRoomCommentService.deleteComment(commentId);
            toast({
                title: "댓글 삭제 완료",
                description: "댓글이 성공적으로 삭제되었습니다.",
            });
            
            fetchComments(0, pageSize);
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
                await escapeRoomCommentService.unlikeComment(commentId);
            } else {
                await escapeRoomCommentService.likeComment(commentId);
            }

            // Optimistic update
            setComments(prevComments => 
                prevComments.map(comment => {
                    if (comment.id === commentId) {
                        return {
                            ...comment,
                            likes: isLiked ? comment.likes - 1 : comment.likes + 1,
                            isLikedByCurrentUser: !isLiked
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
            // 실패 시 다시 로드
            fetchComments(currentPage, pageSize);
        }
    };

    if (!allowComments) {
        return (
            <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">이 테마는 댓글 기능이 비활성화되어 있습니다.</p>
            </div>
        );
    }

    return (
        <div className="mt-10 space-y-6">
            {/* 스포일러 보호 안내 */}
            <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                    <strong>스포일러 보호 시스템:</strong> 스포일러가 포함된 댓글은 해당 테마를 플레이한 사용자만 내용을 볼 수 있습니다.
                    {!hasGameHistory && (
                        <span className="text-orange-600 font-medium">
                            {" "}이 테마를 플레이한 후 스포일러 댓글을 확인하세요.
                        </span>
                    )}
                </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                    댓글{" "}
                    {totalComments > 0 && (
                        <span className="text-sm px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                            {totalComments}
                        </span>
                    )}
                </h2>

                <div className="flex items-center gap-2">
                    {Object.entries(sortTypeLabels).map(([type, label]) => (
                        <button
                            key={type}
                            className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                sortType === type
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => handleSortChange(type as CommentSortType)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 댓글 입력 폼 */}
            <div className="border-t border-border/30 mb-6 pt-4">
                {hasGameHistory && (
                    <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            스포일러가 포함된 댓글을 작성할 때는 반드시 스포일러 체크박스를 선택해주세요.
                        </AlertDescription>
                    </Alert>
                )}
                <CommentForm onSubmit={handleCreateComment} />
            </div>

            {comments.length === 0 && !isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                    <p className="text-sm">
                        아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <EscapeRoomCommentItem
                            key={comment.id}
                            comment={comment}
                            themeId={themeId}
                            hasPlayedGame={hasGameHistory}
                            onReply={handleReplyComment}
                            onUpdate={handleUpdateComment}
                            onDelete={handleDeleteComment}
                            onLike={handleToggleLike}
                            depth={0}
                        />
                    ))}

                    {/* 무한 스크롤 로더 */}
                    <div ref={loaderRef} className="flex justify-center py-4">
                        {isLoading && (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        )}
                        {!isLoading && !hasMore && comments.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                모든 댓글을 불러왔습니다.
                            </p>
                        )}
                    </div>
                </div>
            )}

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