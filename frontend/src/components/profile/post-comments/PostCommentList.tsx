import React, { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/useToast";
import { useLocation } from "react-router-dom";
import { Loader2, MessageSquare } from "lucide-react";
import {
    UserPostCommentDto,
    UserPostCommentRequest,
    userPostCommentService,
} from "@/api/posts/commentService";
import { useAuth } from "@/hooks/useAuth";
import PostCommentForm from "./PostCommentForm";
import PostCommentItem from "./PostCommentItem";

interface PostCommentListProps {
    postId: string;
    postAuthorId: string; // 포스트 작성자 ID (비밀댓글 확인용)
    currentUserId?: string;
    onLoginRequired: () => void;
    onProfileClick?: (userId: string) => void; // 프로필 클릭 콜백 추가
}

// 백엔드에서 제공하는 정렬 옵션
type CommentSortType = "LATEST" | "OLDEST";

const PostCommentList: React.FC<PostCommentListProps> = ({
    postId,
    postAuthorId,
    currentUserId,
    onLoginRequired,
    onProfileClick, // 프로필 클릭 콜백
}) => {
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const [comments, setComments] = useState<UserPostCommentDto[]>([]);
    const [sortType, setSortType] = useState<CommentSortType>("LATEST");
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalComments, setTotalComments] = useState(0);
    const pageSize = 10;

    // 무한 스크롤 구현을 위한 observer 대상 ref
    const loadingRef = useRef<HTMLDivElement>(null);
    const commentsContainerRef = useRef<HTMLDivElement>(null);

    // 댓글 로드
    const fetchComments = async (
        page = 0,
        sort: CommentSortType = "LATEST",
        size = pageSize
    ) => {
        if (!postId) return;

        setIsLoading(true);
        try {
            const result = await userPostCommentService.getComments(
                postId,
                page,
                size,
                sort
            );
            setComments(result.content);
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

    // 추가 댓글 로드
    const fetchMoreComments = useCallback(async () => {
        if (!postId || isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const nextPage = currentPage + 1;
            const result = await userPostCommentService.getComments(
                postId,
                nextPage,
                pageSize,
                sortType
            );

            setComments((prevComments) => [...prevComments, ...result.content]);
            setHasMore(!result.last);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error(
                "추가 댓글을 불러오는 중 오류가 발생했습니다:",
                error
            );
        } finally {
            setIsLoading(false);
        }
    }, [postId, isLoading, hasMore, currentPage, pageSize, sortType]);

    // Intersection Observer 설정
    useEffect(() => {
        // 접점이 보일 때 추가 로딩 시작
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !isLoading && hasMore) {
                    fetchMoreComments();
                }
            },
            { threshold: 0.1 }
        );

        const currentObserverTarget = loadingRef.current;
        if (currentObserverTarget) {
            observer.observe(currentObserverTarget);
        }

        return () => {
            if (currentObserverTarget) {
                observer.unobserve(currentObserverTarget);
            }
        };
    }, [isLoading, hasMore, fetchMoreComments]);

    // 초기 댓글 로드
    useEffect(() => {
        if (postId) {
            fetchComments(0, sortType, pageSize);
        }
    }, [postId, sortType]);

    // 해시 기반 댓글 스크롤 처리
    useEffect(() => {
        const scrollToComment = () => {
            const hash = location.hash;
            if (hash && hash.startsWith('#comment-') && comments.length > 0) {
                const commentId = hash.replace('#comment-', '');
                const commentElement = document.getElementById(`comment-${commentId}`);
                if (commentElement) {
                    setTimeout(() => {
                        commentElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                        // 하이라이트 효과 추가
                        commentElement.classList.add('bg-blue-50', 'border-blue-200');
                        setTimeout(() => {
                            commentElement.classList.remove('bg-blue-50', 'border-blue-200');
                        }, 3000);
                    }, 100);
                }
            }
        };

        scrollToComment();
    }, [location.hash, comments]);

    // 정렬 방식 변경 핸들러
    const handleSortChange = (value: CommentSortType) => {
        if (value !== sortType) {
            setSortType(value);
            setCurrentPage(0);
            fetchComments(0, value, pageSize);
        }
    };

    // 댓글 생성 핸들러
    const handleCreateComment = async (data: UserPostCommentRequest) => {
        if (!currentUserId) {
            onLoginRequired();
            return;
        }

        try {
            await userPostCommentService.createComment(postId, data);
            toast({
                title: "댓글 작성 완료",
                description: "댓글이 성공적으로 등록되었습니다.",
            });
            // 댓글 새로고침 (최신순으로 정렬된 첫 페이지 로드)
            setSortType("LATEST");
            fetchComments(0, "LATEST", pageSize);
        } catch (error) {
            console.error("댓글 작성 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "댓글을 작성하는 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    // 답글 생성 핸들러
    const handleReplyComment = async (
        parentId: string,
        data: UserPostCommentRequest
    ) => {
        if (!currentUserId) {
            onLoginRequired();
            return;
        }

        // 대댓글인지 확인 - 해당 댓글이 이미 부모를 가지고 있는지 확인
        const parentComment =
            comments.find((c) => c.id === parentId) ||
            comments
                .flatMap((c) => c.replies || [])
                .find((r) => r.id === parentId);

        // 대댓글인 경우 (이미 답글인 댓글에 답글을 달으려는 경우)
        if (parentComment && parentComment.parentId) {
            toast({
                title: "안내",
                description: "대댓글에는 답글을 달 수 없습니다.",
                variant: "default",
            });
            return;
        }

        try {
            await userPostCommentService.createComment(postId, {
                ...data,
                parentId,
            });
            toast({
                title: "답글 작성 완료",
                description: "답글이 성공적으로 등록되었습니다.",
            });
            // 댓글 새로고침 (현재 정렬 상태 유지)
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

    // 댓글 수정 핸들러
    const handleUpdateComment = async (
        commentId: string,
        data: UserPostCommentRequest
    ) => {
        if (!currentUserId) {
            onLoginRequired();
            return;
        }

        try {
            await userPostCommentService.updateComment(commentId, data);
            toast({
                title: "댓글 수정 완료",
                description: "댓글이 성공적으로 수정되었습니다.",
            });
            // 댓글 새로고침 (현재 정렬 상태 유지)
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

    // 댓글 삭제 핸들러
    const handleDeleteComment = async (commentId: string) => {
        if (!currentUserId) {
            onLoginRequired();
            return;
        }

        try {
            await userPostCommentService.deleteComment(commentId);
            toast({
                title: "댓글 삭제 완료",
                description: "댓글이 성공적으로 삭제되었습니다.",
            });
            // 댓글 새로고침 (현재 정렬 상태 유지)
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

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <h2 className="text-sm font-medium">
                            댓글 {totalComments > 0 && `(${totalComments})`}
                        </h2>
                    </div>
                    <div className="flex space-x-1 text-xs">
                        <button
                            className={`px-2 py-1 rounded ${
                                sortType === "LATEST"
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-500"
                            }`}
                            onClick={() => handleSortChange("LATEST")}
                        >
                            최신순
                        </button>
                        <button
                            className={`px-2 py-1 rounded ${
                                sortType === "OLDEST"
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-500"
                            }`}
                            onClick={() => handleSortChange("OLDEST")}
                        >
                            오래된순
                        </button>
                    </div>
                </div>

                <PostCommentForm
                    onSubmit={handleCreateComment}
                    postId={postId}
                    isAuthenticated={isAuthenticated}
                    onLoginRequired={onLoginRequired}
                />
            </div>

            <div
                className="overflow-y-auto px-4 pb-4 flex-grow"
                ref={commentsContainerRef}
            >
                {isLoading && comments.length === 0 ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
                    </div>
                ) : (
                    <div className="space-y-1">
                        {comments.map((comment) => (
                            <PostCommentItem
                                key={comment.id}
                                comment={comment}
                                postId={postId}
                                postAuthorId={postAuthorId}
                                onReply={handleReplyComment}
                                onDelete={handleDeleteComment}
                                onUpdate={handleUpdateComment}
                                currentUserId={currentUserId}
                                onLoginRequired={onLoginRequired}
                                isAuthenticated={isAuthenticated}
                                isReply={false} /* 최상위 댓글임을 명시 */
                                onProfileClick={onProfileClick} // 프로필 클릭 콜백 전달
                            />
                        ))}

                        {/* 무한 스크롤을 위한 로딩 관찰 영역 */}
                        {hasMore && (
                            <div
                                ref={loadingRef}
                                className="py-4 flex justify-center"
                            >
                                {isLoading ? (
                                    <span className="flex items-center text-xs text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        댓글 불러오는 중...
                                    </span>
                                ) : (
                                    <div className="h-8"></div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostCommentList;
