import { useState, useCallback } from "react";
import { useToast } from "@/hooks/useToast";

interface UseCommentSystemProps {
    fetchComments: (page: number, sort: string) => Promise<any>;
    createComment: (data: any) => Promise<void>;
    updateComment: (id: string, data: any) => Promise<void>;
    deleteComment: (id: string) => Promise<void>;
    likeComment: (id: string) => Promise<void>;
    unlikeComment: (id: string) => Promise<void>;
}

export const useCommentSystem = ({
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    unlikeComment,
}: UseCommentSystemProps) => {
    const { toast } = useToast();
    const [comments, setComments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalComments, setTotalComments] = useState(0);
    const [sortType, setSortType] = useState("LATEST");

    const loadComments = useCallback(async (page = 0, sort = "LATEST") => {
        setIsLoading(true);
        try {
            const result = await fetchComments(page, sort);
            if (page === 0) {
                setComments(result.content);
            } else {
                setComments(prev => [...prev, ...result.content]);
            }
            setHasMore(!result.last);
            setTotalComments(result.totalElements);
            setCurrentPage(page);
        } catch (error) {
            toast({
                title: "오류",
                description: "댓글을 불러오는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [fetchComments, toast]);

    const handleCreate = useCallback(async (data: any) => {
        try {
            await createComment(data);
            toast({
                title: "댓글 작성 완료",
                description: "댓글이 성공적으로 등록되었습니다.",
            });
            await loadComments(0, sortType);
        } catch (error) {
            toast({
                title: "오류",
                description: "댓글을 작성하는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    }, [createComment, loadComments, sortType, toast]);

    const handleUpdate = useCallback(async (id: string, data: any) => {
        try {
            await updateComment(id, data);
            toast({
                title: "댓글 수정 완료",
                description: "댓글이 성공적으로 수정되었습니다.",
            });
            await loadComments(0, sortType);
        } catch (error) {
            toast({
                title: "오류",
                description: "댓글을 수정하는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    }, [updateComment, loadComments, sortType, toast]);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteComment(id);
            toast({
                title: "댓글 삭제 완료",
                description: "댓글이 성공적으로 삭제되었습니다.",
            });
            await loadComments(0, sortType);
        } catch (error) {
            toast({
                title: "오류",
                description: "댓글을 삭제하는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    }, [deleteComment, loadComments, sortType, toast]);

    const handleToggleLike = useCallback(async (id: string, isLiked: boolean) => {
        try {
            if (isLiked) {
                await unlikeComment(id);
            } else {
                await likeComment(id);
            }
            
            // 옵티미스틱 업데이트
            const updateCommentsLike = (comments: any[]): any[] => {
                return comments.map((comment) => {
                    if (comment.id === id) {
                        return {
                            ...comment,
                            likes: isLiked ? comment.likes - 1 : comment.likes + 1,
                            isLikedByCurrentUser: !isLiked,
                        };
                    }
                    if (comment.replies && comment.replies.length > 0) {
                        return {
                            ...comment,
                            replies: updateCommentsLike(comment.replies),
                        };
                    }
                    return comment;
                });
            };
            
            setComments(prev => updateCommentsLike(prev));
        } catch (error) {
            toast({
                title: "오류",
                description: "좋아요 처리 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    }, [likeComment, unlikeComment, toast]);

    return {
        comments,
        isLoading,
        currentPage,
        hasMore,
        totalComments,
        sortType,
        setSortType,
        loadComments,
        handleCreate,
        handleUpdate,
        handleDelete,
        handleToggleLike,
        loadMoreComments: () => loadComments(currentPage + 1, sortType),
    };
};