import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/useToast";
import { Loader2, MessageSquare } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { UnifiedCommentItem } from "./UnifiedCommentItem";
import { useCommentSystem } from "@/hooks/useCommentSystem";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
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

export interface CommentSystemConfig {
    // 기본 설정
    entityType: 'theme' | 'escape-room' | 'post' | 'board';
    entityId: string;
    
    // 기능 플래그
    features?: {
        spoiler?: boolean;           // 스포일러 기능 사용 여부
        gameHistoryRequired?: boolean; // 게임 플레이 여부에 따른 스포일러 표시
        nestedReplies?: boolean;     // 중첩 답글 허용 여부
        maxDepth?: number;           // 최대 답글 깊이
        sorting?: boolean;           // 정렬 기능 사용 여부
        infiniteScroll?: boolean;    // 무한 스크롤 사용 여부
    };
    
    // API 함수들
    api: {
        fetchComments: (page: number, sort: string) => Promise<any>;
        createComment: (data: any) => Promise<void>;
        updateComment: (id: string, data: any) => Promise<void>;
        deleteComment: (id: string) => Promise<void>;
        likeComment: (id: string) => Promise<void>;
        unlikeComment: (id: string) => Promise<void>;
    };
    
    // 사용자 정보
    userInfo?: {
        hasPlayedGame?: boolean;  // 방탈출 전용
        permissions?: string[];   // 특수 권한
    };
}

const sortTypeLabels: Record<string, string> = {
    LATEST: "최신순",
    OLDEST: "오래된순",
    LIKES: "인기순",
};

export const UnifiedCommentSystem: React.FC<CommentSystemConfig> = ({
    entityType,
    entityId,
    features = {
        spoiler: false,
        gameHistoryRequired: false,
        nestedReplies: true,
        maxDepth: 2,
        sorting: true,
        infiniteScroll: true,
    },
    api,
    userInfo = {},
}) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const loaderRef = useRef<HTMLDivElement>(null);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    
    const {
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
        loadMoreComments,
    } = useCommentSystem(api);

    // 무한 스크롤 설정
    useEffect(() => {
        if (!features.infiniteScroll) return;

        const options = {
            root: null,
            rootMargin: "20px",
            threshold: 1.0,
        };

        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMore && !isLoading) {
                loadMoreComments();
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
    }, [hasMore, isLoading, currentPage, features.infiniteScroll, loadMoreComments]);

    // 초기 로드
    useEffect(() => {
        loadComments(0, sortType);
    }, [entityId, sortType]);

    const checkLogin = (): boolean => {
        if (!user?.id) {
            setShowLoginDialog(true);
            return false;
        }
        return true;
    };

    const handleCreateWrapper = async (data: any) => {
        if (!checkLogin()) return;
        await handleCreate(data);
    };

    const handleReplyWrapper = async (parentId: string, data: any) => {
        if (!checkLogin()) return;
        await handleCreate({ ...data, parentId });
    };

    const handleUpdateWrapper = async (id: string, data: any) => {
        if (!checkLogin()) return;
        await handleUpdate(id, data);
    };

    const handleDeleteWrapper = async (id: string) => {
        if (!checkLogin()) return;
        await handleDelete(id);
    };

    const handleLikeWrapper = async (id: string, isLiked: boolean) => {
        if (!checkLogin()) return;
        await handleToggleLike(id, isLiked);
    };

    return (
        <div className="mt-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                    댓글{" "}
                    {totalComments > 0 && (
                        <span className="text-sm px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                            {totalComments}
                        </span>
                    )}
                </h2>

                {features.sorting && (
                    <div className="flex items-center gap-2">
                        {Object.entries(sortTypeLabels).map(([type, label]) => (
                            <button
                                key={type}
                                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                    sortType === type
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                                onClick={() => {
                                    setSortType(type);
                                    loadComments(0, type);
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 댓글 입력 폼 */}
            <div className="border-t border-border/30 mb-6 pt-4">
                <CommentForm 
                    onSubmit={handleCreateWrapper}
                    showSpoilerToggle={features.spoiler}
                />
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
                        <UnifiedCommentItem
                            key={comment.id}
                            comment={comment}
                            onReply={handleReplyWrapper}
                            onUpdate={handleUpdateWrapper}
                            onDelete={handleDeleteWrapper}
                            onLike={handleLikeWrapper}
                            depth={0}
                            config={{
                                showSpoilerWarning: features.spoiler,
                                hasPlayedGame: userInfo.hasPlayedGame || false,
                                maxDepth: features.maxDepth || 2,
                            }}
                        />
                    ))}

                    {/* 무한 스크롤 로더 */}
                    {features.infiniteScroll && (
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
                    )}
                </div>
            )}

            {/* 로그인 필요 다이얼로그 */}
            <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>로그인이 필요합니다</AlertDialogTitle>
                        <AlertDialogDescription>
                            댓글 기능은 로그인한 사용자만 이용할 수 있습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => navigate("/login")}>
                            로그인 하러 가기
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};