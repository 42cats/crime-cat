import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Heart, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface PostDetailModalProps {
    post: UserPostDto;
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

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
            setLikeCount((prev) => (nowLiked ? prev + 1 : Math.max(0, prev - 1)));
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
            return new Intl.DateTimeFormat('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (error) {
            return '날짜 정보 없음';
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
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={post.authorAvatarUrl || "/assets/default-avatar.png"}
                                        alt={post.authorNickname}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <h3 className="font-medium">
                                            {post.authorNickname}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* 이미지 슬라이더 (이미지가 있는 경우만) */}
                            {post.imageUrls && post.imageUrls.length > 0 && (
                                <div className="relative">
                                    <div className="aspect-square">
                                        <img
                                            src={post.imageUrls[currentImageIndex]}
                                            alt={`포스트 이미지 ${currentImageIndex + 1}`}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    
                                    {/* 이미지가 2개 이상인 경우 네비게이션 버튼 표시 */}
                                    {post.imageUrls.length > 1 && (
                                        <>
                                            <button
                                                onClick={handlePrevImage}
                                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full"
                                            >
                                                &lt;
                                            </button>
                                            <button
                                                onClick={handleNextImage}
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full"
                                            >
                                                &gt;
                                            </button>
                                            
                                            {/* 이미지 인디케이터 */}
                                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                                {post.imageUrls.map((_, index) => (
                                                    <div
                                                        key={index}
                                                        className={`w-2 h-2 rounded-full ${
                                                            index === currentImageIndex
                                                                ? 'bg-white'
                                                                : 'bg-white/50'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* 포스트 내용 */}
                            <div className="p-4">
                                <p className="whitespace-pre-line mb-4">{post.content}</p>
                                
                                {/* 상호작용 버튼 */}
                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={handleLike}
                                            disabled={isLikeLoading}
                                            className="flex items-center space-x-1"
                                        >
                                            <Heart
                                                size={20}
                                                className={liked ? "text-red-500 fill-red-500" : "text-gray-500"}
                                            />
                                            <span>{likeCount}</span>
                                        </button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleShare}
                                    >
                                        <Share2 size={18} className="mr-1" />
                                        공유
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* 데스크탑 레이아웃 (큰 화면) */}
                        <div className="hidden md:flex h-full">
                            <div className="w-3/5 h-full bg-black flex items-center justify-center">
                                {post.imageUrls && post.imageUrls.length > 0 ? (
                                    <div className="relative h-full w-full flex items-center justify-center">
                                        <img
                                            src={post.imageUrls[currentImageIndex]}
                                            alt={`포스트 이미지 ${currentImageIndex + 1}`}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                        
                                        {/* 이미지가 2개 이상인 경우 네비게이션 버튼 표시 */}
                                        {post.imageUrls.length > 1 && (
                                            <>
                                                <button
                                                    onClick={handlePrevImage}
                                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full"
                                                >
                                                    &lt;
                                                </button>
                                                <button
                                                    onClick={handleNextImage}
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full"
                                                >
                                                    &gt;
                                                </button>
                                                
                                                {/* 이미지 인디케이터 */}
                                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                                    {post.imageUrls.map((_, index) => (
                                                        <div
                                                            key={index}
                                                            className={`w-2 h-2 rounded-full ${
                                                                index === currentImageIndex
                                                                    ? 'bg-white'
                                                                    : 'bg-white/50'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-white">
                                        <p>이미지가 없는 포스트입니다.</p>
                                    </div>
                                )}
                            </div>

                            <div className="w-2/5 h-full flex flex-col border-l">
                                {/* 헤더 */}
                                <div className="p-4 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={post.authorAvatarUrl || "/assets/default-avatar.png"}
                                            alt={post.authorNickname}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div>
                                            <h3 className="font-medium">
                                                {post.authorNickname}
                                            </h3>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* 포스트 내용 */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    <p className="whitespace-pre-line">{post.content}</p>
                                </div>

                                {/* 하단 버튼 */}
                                <div className="p-4 border-t">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={handleLike}
                                                disabled={isLikeLoading}
                                                className="flex items-center space-x-1"
                                            >
                                                <Heart
                                                    size={20}
                                                    className={liked ? "text-red-500 fill-red-500" : "text-gray-500"}
                                                />
                                                <span>{likeCount}</span>
                                            </button>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleShare}
                                        >
                                            <Share2 size={18} className="mr-1" />
                                            공유
                                        </Button>
                                    </div>
                                </div>
                            </div>
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
