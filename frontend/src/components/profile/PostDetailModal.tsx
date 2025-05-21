import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { UserPostDto, userPostService } from "@/api/userPost/userPostService";
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
// 포스트 상세 레이아웃 컴포넌트 임포트
import { MobilePostLayout, DesktopPostLayout } from "./post-detail";

interface PostDetailModalProps {
    post: UserPostDto;
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

type ModalTab = "info" | "comments";

const PostDetailModal: React.FC<PostDetailModalProps> = ({
    post,
    isOpen,
    onClose,
    userId,
}) => {
    // 프로필 정보
    const [profile, setProfile] = useState<ProfileDetailDto | null>(null);

    // UI 상태
    const [liked, setLiked] = useState(post.liked);
    const [likeCount, setLikeCount] = useState(post.likeCount);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<ModalTab>("info");
    
    // 탭 변경 핸들러 - 로그인 없이도 탭 이동 가능하게 수정
    const handleTabChange = (tab: ModalTab) => {
        setActiveTab(tab);
    };

    const { user, isAuthenticated } = useAuth();

    // 프로필 정보 로드
    useEffect(() => {
        if (isOpen && userId) {
            getProfileDetail(userId)
                .then((data) => setProfile(data))
                .catch((err) =>
                    console.error("프로필 상세 정보 로드 실패:", err)
                );
        }
    }, [isOpen, userId]);

    // 좋아요 상태 확인
    useEffect(() => {
        const checkLikeStatus = async () => {
            if (isOpen && post.postId && isAuthenticated) {
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

        checkLikeStatus();
    }, [isOpen, post.postId, isAuthenticated]);

    const handleShare = async () => {
        try {
            const postUrl = `${window.location.origin}/profile/${userId}/post/${post.postId}`;
            await navigator.clipboard.writeText(postUrl);
            toast.success("포스트 링크가 복사되었습니다");
        } catch (error) {
            toast.error("링크 복사에 실패했습니다");
        }
    };

    const handleLike = async () => {
        if (!isAuthenticated) {
            setShowLoginDialog(true);
            return;
        }

        setIsLikeLoading(true);
        try {
            const nowLiked = await userPostService.togglePostLike(post.postId);
            setLiked(nowLiked);
            setLikeCount((prev) =>
                nowLiked ? prev + 1 : Math.max(0, prev - 1)
            );
        } catch (error) {
            console.error("좋아요 처리 중 오류 발생:", error);
            toast.error("좋아요 처리 중 문제가 발생했습니다");
        } finally {
            setIsLikeLoading(false);
        }
    };

    // 이미지 네비게이션 핸들러
    const handlePrevImage = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? post.imageUrls.length - 1 : prev - 1
        );
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) =>
            prev === post.imageUrls.length - 1 ? 0 : prev + 1
        );
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }).format(date);
        } catch (error) {
            return "날짜 정보 없음";
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-4xl w-[95%] md:w-full bg-white rounded-lg p-0 overflow-hidden">
                    <DialogTitle className="sr-only">
                        포스트 상세 정보
                    </DialogTitle>

                    <div className="h-[85vh] md:h-[80vh] overflow-y-auto md:overflow-hidden">
                        {/* 모바일 레이아웃 (작은 화면) */}
                        <div className="block md:hidden">
                            <MobilePostLayout
                            post={post}
                            profile={profile}
                            activeTab={activeTab}
                            setActiveTab={handleTabChange}
                            liked={liked}
                            isLikeLoading={isLikeLoading}
                            currentImageIndex={currentImageIndex}
                            handlePrevImage={handlePrevImage}
                            handleNextImage={handleNextImage}
                            handleLike={handleLike}
                            handleShare={handleShare}
                            handleLoginRequired={() => setShowLoginDialog(true)}
                            userId={user?.id}
                            />
                        </div>

                        {/* 데스크탑 레이아웃 (큰 화면) */}
                        <div className="hidden md:flex h-full">
                            <DesktopPostLayout
                                post={post}
                                profile={profile}
                                activeTab={activeTab}
                                setActiveTab={handleTabChange}
                                liked={liked}
                                isLikeLoading={isLikeLoading}
                                currentImageIndex={currentImageIndex}
                                handlePrevImage={handlePrevImage}
                                handleNextImage={handleNextImage}
                                handleLike={handleLike}
                                handleShare={handleShare}
                                handleLoginRequired={() => setShowLoginDialog(true)}
                                onClose={onClose}
                                userId={user?.id}
                            />
                        </div>
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
        </>
    );
};

export default PostDetailModal;
