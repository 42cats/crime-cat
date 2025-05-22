import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { UserPostDto, userPostService } from "@/api/sns/post";
import { getProfileDetail, ProfileDetailDto } from "@/api/profile/detail";
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
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import PostActions from "@/components/sns/common/PostActions";
import DeleteConfirmDialog from "@/components/sns/common/DeleteConfirmDialog";

// 포스트 상세 레이아웃 컴포넌트 임포트
import {
    MobilePostLayout,
    DesktopPostLayout,
    VerticalPostLayout,
} from "@/components/profile/post-detail";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";

interface PostDetailModalProps {
    post?: UserPostDto; // 기존 post 데이터 (있으면 사용, 없으면 postId로 로드)
    postId?: string; // post가 없을 때 로드할 postId
    isOpen: boolean;
    onClose: () => void;
    userId?: string; // 프로필 모드에서 사용자 ID
    onLikeStatusChange?: (
        postId: string,
        liked: boolean,
        likeCount: number
    ) => void;
    mode?: "modal" | "page"; // 모달 모드 또는 페이지 모드
}

type ModalTab = "info" | "comments";

const PostDetailModal: React.FC<PostDetailModalProps> = ({
    post: initialPost,
    postId,
    isOpen,
    onClose,
    userId,
    onLikeStatusChange,
    mode = "modal",
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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<ModalTab>("info");

    // 프로필 모달 상태
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    // 수정/삭제 상태
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // 탭 변경 핸들러
    const handleTabChange = (tab: ModalTab) => {
        setActiveTab(tab);
    };

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

        if (isOpen) {
            loadPostDetail();
        }
    }, [postId, initialPost, isOpen]);

    // 프로필 정보 로드
    useEffect(() => {
        if (isOpen && post && (userId || post.authorId)) {
            const targetUserId = userId || post.authorId;
            getProfileDetail(targetUserId)
                .then((data) => setProfile(data))
                .catch((err) =>
                    console.error("프로필 상세 정보 로드 실패:", err)
                );
        }
    }, [isOpen, post, userId]);

    // 좋아요 상태 확인
    useEffect(() => {
        const checkLikeStatus = async () => {
            if (isOpen && post?.postId && isAuthenticated) {
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
    }, [isOpen, post?.postId, isAuthenticated, initialPost]);

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
            if (mode === "page") {
                toast.error("로그인이 필요합니다.");
                navigate("/login");
            } else {
                setShowLoginDialog(true);
            }
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

    // 이미지 네비게이션 핸들러
    const handlePrevImage = () => {
        if (!post?.imageUrls) return;
        setCurrentImageIndex((prev) =>
            prev === 0 ? post.imageUrls.length - 1 : prev - 1
        );
    };

    const handleNextImage = () => {
        if (!post?.imageUrls) return;
        setCurrentImageIndex((prev) =>
            prev === post.imageUrls.length - 1 ? 0 : prev + 1
        );
    };

    // 프로필 클릭 핸들러
    const handleProfileClick = (authorId: string) => {
        setSelectedUserId(authorId);
        setIsProfileModalOpen(true);
    };

    // 로그인 필요 핸들러
    const handleLoginRequired = () => {
        if (mode === "page") {
            toast.error("로그인이 필요합니다.");
            navigate("/login");
        } else {
            setShowLoginDialog(true);
        }
    };

    // 수정 핸들러
    const handleEdit = () => {
        // TODO: 포스트 수정 모달이나 페이지로 이동
        toast.success("수정 기능은 곧 추가될 예정입니다.");
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
            
            // 페이지 모드에서는 이전 페이지로 이동
            if (mode === "page") {
                navigate(-1);
            }
        } catch (error) {
            console.error("포스트 삭제 실패:", error);
            toast.error("포스트 삭제에 실패했습니다.");
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };
    
    // 모달 닫기 핸들러
    const handleClose = () => {
        if (mode === "page") {
            navigate(-1);
        } else {
            // 모달이 닫힐 때 변경된 좋아요 상태 전달
            if (
                onLikeStatusChange &&
                post &&
                (liked !== post.liked || likeCount !== post.likeCount)
            ) {
                onLikeStatusChange(post.postId, liked, likeCount);
            }
            onClose();
        }
    };
    
    // 작성자 권한 확인
    const isAuthor = user?.id === post?.authorId;

    // 로딩 상태
    if (isLoading) {
        return mode === "page" ? (
            <div className="container mx-auto px-4 py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <Dialog
                open={isOpen}
                onOpenChange={(open) => !open && handleClose()}
            >
                <DialogContent className="max-w-4xl w-[95%] md:w-full bg-white rounded-lg p-0 overflow-hidden">
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // 에러 상태
    if (error || !post) {
        const errorContent = (
            <div className="text-center">
                <p className="text-lg text-muted-foreground mb-4">
                    {error || "게시물을 찾을 수 없습니다."}
                </p>
                <Button onClick={handleClose}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    돌아가기
                </Button>
            </div>
        );

        return mode === "page" ? (
            <div className="container mx-auto px-4 py-12">{errorContent}</div>
        ) : (
            <Dialog
                open={isOpen}
                onOpenChange={(open) => !open && handleClose()}
            >
                <DialogContent className="max-w-md">
                    {errorContent}
                </DialogContent>
            </Dialog>
        );
    }

    // 페이지 모드 렌더링
    if (mode === "page") {
        return (
            <>
                <div className="container mx-auto px-4 py-6 max-w-4xl mb-16 md:mb-0">
                    {/* 헤더와 이전 버튼 */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClose}
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <h1 className="text-xl font-bold ml-2">게시물 상세</h1>
                        </div>
                        
                        {/* 작성자 권한이 있을 때 수정/삭제 버튼 */}
                        {isAuthor && (
                            <PostActions
                                postId={post.postId}
                                onEdit={handleEdit}
                                onDelete={() => setShowDeleteDialog(true)}
                            />
                        )}
                    </div>

                    {/* 세로형 레이아웃으로 표시 */}
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
                    />
                </div>

                {/* 프로필 모달 */}
                {selectedUserId && (
                    <ProfileDetailModal
                        userId={selectedUserId}
                        open={isProfileModalOpen}
                        onOpenChange={setIsProfileModalOpen}
                    />
                )}
            </>
        );
    }

    // 모달 모드 렌더링
    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => !open && handleClose()}
            >
                <DialogContent className="max-w-4xl w-[95%] md:w-full bg-white rounded-lg p-0 overflow-hidden">
                    <DialogTitle className="sr-only">
                        포스트 상세 정보
                    </DialogTitle>

                    <div className="h-[85vh] md:h-[80vh] overflow-y-auto relative">
                        {/* 작성자 권한이 있을 때 수정/삭제 버튼 (모달 내부) */}
                        {isAuthor && (
                            <div className="absolute top-4 right-4 z-10">
                                <PostActions
                                    postId={post.postId}
                                    onEdit={handleEdit}
                                    onDelete={() => setShowDeleteDialog(true)}
                                    className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
                                />
                            </div>
                        )}
                        
                        {/* 세로형 레이아웃 사용 */}
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
                        />
                    </div>
                </DialogContent>
            </Dialog>

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
                                window.location.href = "/login";
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
            
            {/* 프로필 모달 */}
            {selectedUserId && (
                <ProfileDetailModal
                    userId={selectedUserId}
                    open={isProfileModalOpen}
                    onOpenChange={setIsProfileModalOpen}
                />
            )}
        </>
    );
};

export default PostDetailModal;
