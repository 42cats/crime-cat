import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "../ui/alert";
import { BoardCommentItem } from "./BoardCommentItem";
import {
    boardCommentService,
    CreateBoardCommentRequest,
    UpdateBoardCommentRequest,
} from "../../api/boards/boardCommentService";
import { useToast } from "@/hooks/useToast";
import { MessageCircle, Plus, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BoardCommentListProps {
    postId: string;
    onProfileClick: (userId: string) => void;
    isAuthenticated?: boolean;
}

export const BoardCommentList: React.FC<BoardCommentListProps> = ({
    postId,
    onProfileClick,
    isAuthenticated = true,
}) => {
    const [newComment, setNewComment] = useState("");
    const [newCommentIsSecret, setNewCommentIsSecret] = useState(false);
    const [isWriting, setIsWriting] = useState(true); // 기본으로 true로 변경
    const [currentPage, setCurrentPage] = useState(0);

    const queryClient = useQueryClient();
    const { toast } = useToast();
    const navigate = useNavigate();

    // 댓글 목록 조회
    const {
        data: commentsData,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["boardComments", postId, currentPage],
        queryFn: () => boardCommentService.getComments(postId, currentPage, 20),
        enabled: !!postId,
    });

    // 댓글 작성 뮤테이션
    const createCommentMutation = useMutation({
        mutationFn: (data: CreateBoardCommentRequest) =>
            boardCommentService.createComment(postId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["boardComments", postId],
            });
            setNewComment("");
            setNewCommentIsSecret(false);
            // setIsWriting(false); // 폼을 계속 열어둠
            toast({
                title: "댓글이 작성되었습니다.",
                variant: "default",
            });
        },
        onError: (error) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            toast({
                title: "댓글 작성에 실패했습니다.",
                description:
                    axiosError.response?.data?.message || "오류가 발생했습니다.",
                variant: "destructive",
            });
        },
    });

    // 댓글 수정 뮤테이션
    const updateCommentMutation = useMutation({
        mutationFn: ({
            commentId,
            data,
        }: {
            commentId: string;
            data: UpdateBoardCommentRequest;
        }) => boardCommentService.updateComment(postId, commentId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["boardComments", postId],
            });
            toast({
                title: "댓글이 수정되었습니다.",
                variant: "default",
            });
        },
        onError: (error) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            toast({
                title: "댓글 수정에 실패했습니다.",
                description:
                    axiosError.response?.data?.message || "오류가 발생했습니다.",
                variant: "destructive",
            });
        },
    });

    // 댓글 삭제 뮤테이션
    const deleteCommentMutation = useMutation({
        mutationFn: (commentId: string) =>
            boardCommentService.deleteComment(postId, commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["boardComments", postId],
            });
            toast({
                title: "댓글이 삭제되었습니다.",
                variant: "default",
            });
        },
        onError: (error) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            toast({
                title: "댓글 삭제에 실패했습니다.",
                description:
                    axiosError.response?.data?.message || "오류가 발생했습니다.",
                variant: "destructive",
            });
        },
    });

    // 댓글 좋아요 뮤테이션
    const toggleLikeMutation = useMutation({
        mutationFn: (commentId: string) =>
            boardCommentService.toggleCommentLike(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["boardComments", postId],
            });
        },
        onError: (error) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            toast({
                title: "좋아요 처리에 실패했습니다.",
                description:
                    axiosError.response?.data?.message || "오류가 발생했습니다.",
                variant: "destructive",
            });
        },
    });

    // 답글 작성 뮤테이션
    const createReplyMutation = useMutation({
        mutationFn: ({
            parentId,
            content,
            isSecret,
        }: {
            parentId: string;
            content: string;
            isSecret: boolean;
        }) =>
            boardCommentService.createReply(postId, parentId, {
                content,
                isSecret,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["boardComments", postId],
            });
            toast({
                title: "답글이 작성되었습니다.",
                variant: "default",
            });
        },
        onError: (error) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            toast({
                title: "답글 작성에 실패했습니다.",
                description:
                    axiosError.response?.data?.message || "오류가 발생했습니다.",
                variant: "destructive",
            });
        },
    });

    const handleSubmitNewComment = () => {
        if (!newComment.trim()) return;

        createCommentMutation.mutate({
            content: newComment,
            isSecret: newCommentIsSecret,
        });
    };

    const handleEditComment = (
        commentId: string,
        data: UpdateBoardCommentRequest
    ) => {
        updateCommentMutation.mutate({ commentId, data });
    };

    const handleDeleteComment = (commentId: string) => {
        deleteCommentMutation.mutate(commentId);
    };

    const handleReply = (
        parentCommentId: string,
        content: string,
        isSecret: boolean
    ) => {
        createReplyMutation.mutate({
            parentId: parentCommentId,
            content,
            isSecret,
        });
    };

    const handleLike = (commentId: string) => {
        toggleLikeMutation.mutate(commentId);
    };

    if (isError) {
        return (
            <Alert className="mb-6">
                <AlertDescription>
                    댓글을 불러오는 중 오류가 발생했습니다:{" "}
                    {error instanceof Error ? error.message : '알 수 없는 오류'}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* 댓글 작성 섹션 */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">
                        댓글 {commentsData?.totalElements || 0}개
                    </h3>
                </div>

                {/* 댓글 작성 폼을 기본으로 표시 */}
                {isAuthenticated ? (
                    <div className="space-y-3">
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="댓글을 입력하세요..."
                            className="min-h-[100px]"
                        />
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={newCommentIsSecret}
                                    onChange={(e) =>
                                        setNewCommentIsSecret(e.target.checked)
                                    }
                                    className="rounded"
                                />
                                <span className="text-sm">비밀 댓글</span>
                            </label>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSubmitNewComment}
                                    disabled={
                                        !newComment.trim() ||
                                        createCommentMutation.isPending
                                    }
                                >
                                    {createCommentMutation.isPending
                                        ? "작성 중..."
                                        : "댓글 작성"}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center gap-3 bg-muted/30 rounded-lg">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                            댓글을 작성하려면 로그인이 필요합니다.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/login")}
                        >
                            로그인하기
                        </Button>
                    </div>
                )}
            </div>

            {/* 댓글 목록 */}
            {isLoading ? (
                <div className="text-center py-8">
                    <div className="text-muted-foreground">댓글을 불러오는 중...</div>
                </div>
            ) : !commentsData?.content?.length ? (
                <div className="text-center py-12">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <div className="text-muted-foreground">
                        첫 번째 댓글을 작성해보세요!
                    </div>
                </div>
            ) : (
                <div className="bg-card rounded-lg border shadow-sm">
                    <div className="divide-y divide-border">
                        {commentsData.content.map((comment) => (
                            <BoardCommentItem
                                key={comment.id}
                                comment={comment}
                                postId={postId}
                                onEdit={handleEditComment}
                                onDelete={handleDeleteComment}
                                onReply={handleReply}
                                onLike={handleLike}
                                onProfileClick={onProfileClick}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 페이지네이션 */}
            {commentsData && commentsData.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setCurrentPage((prev) => Math.max(0, prev - 1))
                        }
                        disabled={commentsData.first}
                    >
                        이전
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                        {currentPage + 1} / {commentsData.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        disabled={commentsData.last}
                    >
                        다음
                    </Button>
                </div>
            )}
        </div>
    );
};
