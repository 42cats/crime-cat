import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPostDto, userPostService } from "@/api/posts";
import {
    Heart,
    MessageCircle,
    Bookmark,
    Share2,
    MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LazyImage from "../common/LazyImage";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import ImageCarousel from "./ImageCarousel";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

// Dialog 관련 import는 현재 사용하지 않으므로 제거

interface PostCardProps {
    post: UserPostDto;
    onLikeChange?: (postId: string, liked: boolean) => void;
    onPostClick?: (post: UserPostDto) => void;
}

const PostCard: React.FC<PostCardProps> = ({
    post,
    onLikeChange,
    onPostClick,
}) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [liked, setLiked] = useState(post.liked);
    const [likeCount, setLikeCount] = useState(post.likeCount);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    // 좋아요 토글 처리
    const handleLikeToggle = async (e: React.MouseEvent) => {
        e.stopPropagation(); // 이벤트 전파 방지
        if (!isAuthenticated) {
            setShowLoginDialog(true);
            return;
        }

        try {
            // 낙관적 UI 업데이트
            const newLiked = !liked;
            setLiked(newLiked);
            setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

            // API 호출
            const result = await userPostService.togglePostLike(post.postId);

            // 결과가 예상과 다르면 되돌리기
            if (result !== newLiked) {
                setLiked(result);
                setLikeCount((prev) => (result ? prev + 1 : prev - 1));
            }

            // 부모 컴포넌트에 변경 알림
            if (onLikeChange) {
                onLikeChange(post.postId, result);
            }
        } catch (error) {
            // 에러 시 원래 상태로 복원
            console.error("좋아요 토글 실패:", error);
            setLiked(post.liked);
            setLikeCount(post.likeCount);
            toast.error("좋아요 처리 중 오류가 발생했습니다.");
        }
    };

    // 내용에서 해시태그 찾아 강조 표시
    const renderContent = () => {
        if (!post.content) return null;

        const parts = [];
        let lastIndex = 0;
        const hashTagRegex = /#[\w\p{L}]+/gu;
        let match;

        while ((match = hashTagRegex.exec(post.content)) !== null) {
            const matchStart = match.index;
            const matchEnd = matchStart + match[0].length;

            // 해시태그 이전 텍스트
            if (matchStart > lastIndex) {
                parts.push({
                    type: "text",
                    content: post.content.substring(lastIndex, matchStart),
                });
            }

            // 해시태그
            parts.push({
                type: "hashtag",
                content: match[0],
                tag: match[0].substring(1), // # 제외
            });

            lastIndex = matchEnd;
        }

        // 마지막 텍스트
        if (lastIndex < post.content.length) {
            parts.push({
                type: "text",
                content: post.content.substring(lastIndex),
            });
        }

        return (
            <div className="whitespace-pre-line">
                {parts.map((part, index) => {
                    if (part.type === "hashtag") {
                        return (
                            <Link
                                key={index}
                                to={`/sns/hashtag/${encodeURIComponent(
                                    part.tag
                                )}`}
                                className="text-blue-500 hover:underline"
                            >
                                {part.content}{" "}
                            </Link>
                        );
                    }
                    return <span key={index}>{part.content}</span>;
                })}
            </div>
        );
    };

    const createdDate = post.createdAt ? new Date(post.createdAt) : new Date();
    const timeAgo = formatDistanceToNow(createdDate, {
        addSuffix: true,
        locale: ko,
    });

    return (
        <div
            className="bg-card border border-border rounded-md overflow-hidden mb-6 cursor-pointer"
            onClick={() => onPostClick?.(post)}
        >
            {/* 포스트 헤더 */}
            <div className="p-4 flex items-center justify-between">
                <Link
                    to={`/profile/${post.authorId}`}
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Avatar className="w-8 h-8">
                        <AvatarImage
                            src={post.authorAvatarUrl ?? "/content/image/default_profile_image.png"}
                            alt={post.authorNickname}
                        />
                        <AvatarFallback>
                            {post.authorNickname.substring(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium">
                            {post.authorNickname}
                        </p>
                        {post.locationName && (
                            <p className="text-xs text-muted-foreground">
                                {post.locationName}
                            </p>
                        )}
                    </div>
                </Link>

                {/* <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOptionsOpen(!isOptionsOpen);
                    }}
                >
                    <MoreHorizontal className="h-5 w-5" />
                </Button> */}
            </div>

            {/* 포스트 이미지 */}
            {post.imageUrls && post.imageUrls.length > 0 && (
                <div onClick={(e) => e.stopPropagation()}>
                    <ImageCarousel images={post.imageUrls} />
                </div>
            )}

            {/* 포스트 액션 버튼 */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={handleLikeToggle}
                    >
                        <Heart
                            className={`h-6 w-6 ${
                                liked ? "fill-red-500 text-red-500" : ""
                            }`}
                        />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPostClick?.(post);
                        }}
                    >
                        <MessageCircle className="h-6 w-6" />
                    </Button>
                    {/* <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Share2 className="h-6 w-6" />
                    </Button> */}
                </div>
                {/* 
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) {
                            setShowLoginDialog(true);
                            return;
                        }
                        // TODO: 저장 기능 구현
                        toast.success("저장 기능이 곧 구현됩니다.");
                    }}
                >
                    <Bookmark className="h-6 w-6" />
                </Button> */}
            </div>

            {/* 포스트 정보 */}
            <div className="px-4 pb-2">
                {likeCount > 0 && (
                    <p className="text-sm font-medium mb-1">
                        좋아요 {likeCount}개
                    </p>
                )}

                <div className="text-sm">
                    <span className="font-medium mr-2">
                        {post.authorNickname}
                    </span>
                    {renderContent()}
                </div>

                {/* 댓글 바로가기 */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPostClick?.(post);
                    }}
                    className="block text-xs text-muted-foreground mt-2 hover:underline cursor-pointer"
                >
                    댓글 더 보기
                </button>

                {/* 작성 시간 */}
                <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
            </div>

            {/* 로그인 필요 다이얼로그 */}
            <AlertDialog
                open={showLoginDialog}
                onOpenChange={setShowLoginDialog}
            >
                <AlertDialogContent
                    aria-labelledby="login-dialog-title"
                    aria-describedby="login-dialog-description"
                >
                    <AlertDialogHeader>
                        <AlertDialogTitle id="login-dialog-title">
                            로그인이 필요합니다
                        </AlertDialogTitle>
                        <AlertDialogDescription id="login-dialog-description">
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
        </div>
    );
};

export default PostCard;
