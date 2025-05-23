import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { UserPostDto, userPostService } from "@/api/posts";
import { getProfileDetail, ProfileDetailDto } from "@/api/profile";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import DeleteConfirmDialog from "@/components/sns/common/DeleteConfirmDialog";
import PostEditModal from "@/components/sns/common/PostEditModal";

// 포스트 상세 레이아웃 컴포넌트 임포트
import { VerticalPostLayout } from "@/components/profile/post-detail";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";
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

interface PostDetailProps {
    post?: UserPostDto; // 기존 post 데이터 (있으면 사용, 없으면 postId로 로드)
    postId?: string; // post가 없을 때 로드할 postId
    userId?: string; // 프로필 모드에서 사용자 ID
    onLikeStatusChange?: (
        postId: string,
        liked: boolean,
        likeCount: number
    ) => void;
    onClose?: () => void; // 닫기 콜백 (페이지 모드에선 뒤로가기, 모달 모드에선 모달 닫기)
}

const PostDetail: React.FC<PostDetailProps> = ({
    post: initialPost,
    postId,
    userId,
    onLikeStatusChange,
    onClose,
}) => {
    // 상태 관리
    const [post, setPost] = useState<UserPostDto | null>(initialPost || null);
    const [profile, setProfile] = useState<ProfileDetailDto | null>(null);
    const [isLoading, setIsLoading] = useState(!initialPost && !!postId);
    const [error, setError] = useState<string | null>(null);

    // UI 상태
    const [liked, setLiked] = useState(initialPost?.liked || false);
    const [likeCount, setLikeCount] = useState(initialPost?.likeCount || 0);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    // 프로필 모달 상태
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // 수정/삭제 상태
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // 포스트 데이터 로드 (postId가 있고 초기 post가 없는 경우)
    useEffect(() => {
        const loadPostDetail = async () => {
            if (!postId || initialPost) return;

            setIsLoading(true);
            setError(null);

            try {
                const postData = await userPostService.getUserPostDetail(
                    postId
                );
                setPost(postData);
                setLiked(postData.liked);
                setLikeCount(postData.likeCount);
            } catch (error) {
                console.error("게시물 상세 정보 로드 실패:", error);
                setError("게시물을 불러올 수 없습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        loadPostDetail();
    }, [postId, initialPost]);

    // 프로필 정보 로드
    useEffect(() => {
        if (post && (userId || post.authorId)) {
            const targetUserId = userId || post.authorId;
            getProfileDetail(targetUserId)
                .then((data) => setProfile(data))
                .catch((err) =>
                    console.error("프로필 상세 정보 로드 실패:", err)
                );
        }
    }, [post, userId]);

    // 좋아요 상태 확인
    useEffect(() => {
        const checkLikeStatus = async () => {
            if (post?.postId && isAuthenticated) {
                try {
                    const likeStatus = await userPostService.checkPostLike(
                        post.postId
                    );
                    setLiked(likeStatus);
                } catch (error) {
                    console.error("좋아요 상태 확인 중 오류 발생:", error);
                }
            }
        };

        if (!initialPost) {
            checkLikeStatus();
        }
    }, [post?.postId, isAuthenticated, initialPost]);

    // 공유 핸들러
    const handleShare = async () => {
        if (!post) return;

        try {
            const postUrl = userId
                ? `${window.location.origin}/profile/${userId}/post/${post.postId}`
                : `${window.location.origin}/sns/post/${post.postId}`;
            await navigator.clipboard.writeText(postUrl);
            toast.success("포스트 링크가 복사되었습니다");
        } catch (error) {
            toast.error("링크 복사에 실패했습니다");
        }
    };

    // 좋아요 핸들러
    const handleLike = async () => {
        if (!post) return;

        if (!isAuthenticated) {
            setShowLoginDialog(true);
            return;
        }

        setIsLikeLoading(true);

        // 낙관적 UI 업데이트
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));

        try {
            const result = await userPostService.togglePostLike(post.postId);

            // 결과가 예상과 다르면 수정
            if (result !== newLiked) {
                setLiked(result);
                setLikeCount((prev) => (result ? prev + 1 : prev - 1));
            }

            // 부모 컴포넌트에 좋아요 상태 변경 알림
            if (onLikeStatusChange) {
                onLikeStatusChange(
                    post.postId,
                    result,
                    result ? likeCount + 1 : likeCount - 1
                );
            }
        } catch (error) {
            console.error("좋아요 처리 중 오류 발생:", error);

            // 에러 시 원래 상태로 복원
            setLiked(!newLiked);
            setLikeCount((prev) => (!newLiked ? prev + 1 : prev - 1));

            toast.error("좋아요 처리 중 문제가 발생했습니다");
        } finally {
            setIsLikeLoading(false);
        }
    };

    // 프로필 클릭 핸들러
    const handleProfileClick = (authorId: string) => {
        console.log("프로필 클릭됨:", authorId);
        setSelectedUserId(authorId);
        setIsProfileModalOpen(true);
    };

    // 로그인 필요 핸들러
    const handleLoginRequired = () => {
        setShowLoginDialog(true);
    };

    // 수정 핸들러
    const handleEdit = () => {
        console.log("수정 버튼 클릭됨");
        setShowEditModal(true);
    };

    // 삭제 버튼 클릭 핸들러
    const handleDeleteButtonClick = () => {
        console.log("삭제 버튼 클릭됨");
        setShowDeleteDialog(true);
    };

    // 수정 성공 핸들러
    const handleEditSuccess = () => {
        // 포스트 데이터 다시 로드
        if (postId) {
            userPostService
                .getUserPostDetail(postId)
                .then((updatedPost) => {
                    setPost(updatedPost);
                    setLiked(updatedPost.liked);
                    setLikeCount(updatedPost.likeCount);
                })
                .catch((error) => {
                    console.error("업데이트된 포스트 로드 실패:", error);
                });
        }
    };

    // 삭제 핸들러
    const handleDelete = async () => {
        if (!post) return;

        setIsDeleting(true);
        try {
            await userPostService.deletePost(post.postId);
            toast.success("포스트가 삭제되었습니다.");

            // 모달 닫기
            handleClose();
        } catch (error) {
            console.error("포스트 삭제 실패:", error);
            toast.error("포스트 삭제에 실패했습니다.");
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    // 닫기 핸들러
    const handleClose = () => {
        if (onClose) {
            // 변경된 좋아요 상태 전달
            if (
                onLikeStatusChange &&
                post &&
                (liked !== post.liked || likeCount !== post.likeCount)
            ) {
                onLikeStatusChange(post.postId, liked, likeCount);
            }
            onClose();
        } else {
            // 기본 동작은 뒤로가기
            navigate(-1);
        }
    };

    // 로딩 상태 UI
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // 에러 상태 UI
    if (error || !post) {
        return (
            <div className="text-center p-8">
                <p className="text-lg text-muted-foreground mb-4">
                    {error || "게시물을 찾을 수 없습니다."}
                </p>
                <Button onClick={handleClose}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    돌아가기
                </Button>
            </div>
        );
    }

    // 렌더링
    return (
        <>
            <VerticalPostLayout
                post={post}
                profile={profile}
                liked={liked}
                isLikeLoading={isLikeLoading}
                likeCount={likeCount}
                handleLike={handleLike}
                handleShare={handleShare}
                handleLoginRequired={handleLoginRequired}
                userId={user?.id}
                onProfileClick={handleProfileClick}
                onEdit={handleEdit}
                onDelete={handleDeleteButtonClick}
                isAuthor={user?.id === post.authorId}
            />

            {/* 로그인 필요 다이얼로그 */}
            <AlertDialog
                open={showLoginDialog}
                onOpenChange={setShowLoginDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>로그인이 필요합니다</AlertDialogTitle>
                        <AlertDialogDescription>
                            이 기능을 사용하려면 로그인이 필요합니다. 로그인
                            페이지로 이동하시겠습니까?
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

            {/* 삭제 확인 다이얼로그 */}
            <DeleteConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />

            {/* 수정 모달 */}
            {post && (
                <PostEditModal
                    post={post}
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={handleEditSuccess}
                />
            )}

            {/* 프로필 모달 */}
            <ProfileDetailModal
                userId={selectedUserId || ""}
                open={isProfileModalOpen && !!selectedUserId}
                onOpenChange={(open) => {
                    console.log("프로필 모달 상태 변경:", open);
                    setIsProfileModalOpen(open);
                    if (!open) setSelectedUserId(null);
                }}
            />
        </>
    );
};

export default PostDetail;
