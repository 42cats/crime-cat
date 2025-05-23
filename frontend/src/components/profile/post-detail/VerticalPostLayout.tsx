import React from "react";
import { Heart, Share2, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostCommentList } from "../post-comments";
import { UserPostDto } from '@/api/posts';
import { ProfileDetailDto } from '@/api/profile';
import PostInfoContent from "./PostInfoContent";
import PostAuthorInfo from "@/components/sns/common/PostAuthorInfo";
import PostPrivacyBadge from "@/components/sns/common/PostPrivacyBadge";
import ImageCarousel from "@/components/sns/post/ImageCarousel";

interface VerticalPostLayoutProps {
    post: UserPostDto;
    profile: ProfileDetailDto | null;
    liked: boolean;
    isLikeLoading: boolean;
    likeCount: number;
    handleLike: () => void;
    handleShare: () => void;
    handleLoginRequired: () => void;
    userId?: string;
    onProfileClick?: (userId: string) => void;
    onEdit?: () => void;
    onDelete?: () => void;
    isAuthor?: boolean;
}

const VerticalPostLayout: React.FC<VerticalPostLayoutProps> = ({
    post,
    profile,
    liked,
    isLikeLoading,
    likeCount,
    handleLike,
    handleShare,
    handleLoginRequired,
    userId,
    onProfileClick,
    onEdit,
    onDelete,
    isAuthor = false,
}) => {
    return (
        <div className="bg-card border border-border rounded-md overflow-hidden">
            {/* 작성자 정보 */}
            <div className="p-4 border-b border-border">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        {/* 프로필 이미지 */}
                        <div className="flex-shrink-0">
                            {post.authorAvatarUrl ? (
                                <img
                                    src={post.authorAvatarUrl}
                                    alt={post.authorNickname}
                                    className="w-10 h-10 rounded-full cursor-pointer"
                                    onClick={() => {
                                        console.log('프로필 이미지 클릭됨', post.authorId);
                                        onProfileClick?.(post.authorId);
                                    }}
                                />
                            ) : (
                                <div
                                    className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer"
                                    onClick={() => {
                                        console.log('기본 프로필 이미지 클릭됨', post.authorId);
                                        onProfileClick?.(post.authorId);
                                    }}
                                >
                                    <span className="text-primary font-medium">
                                        {post.authorNickname
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* 작성자 정보 및 더보기 버튼 */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span
                                        className="font-semibold text-sm cursor-pointer hover:underline"
                                        onClick={() => {
                                            console.log('프로필 이름 클릭됨', post.authorId);
                                            onProfileClick?.(post.authorId);
                                        }}
                                    >
                                        {post.authorNickname}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        •
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {post.createdAt &&
                                            new Date(
                                                post.createdAt
                                            ).toLocaleDateString("ko-KR", {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                    </span>
                                </div>

                                {/* 작성자 권한이 있을 때만 드롭다운 메뉴 표시 */}
                                {isAuthor && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 ml-2"
                                            >
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => {
                                                console.log('수정 드롭다운 메뉴 클릭됨');
                                                onEdit && onEdit();
                                            }}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                수정
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    console.log('삭제 드롭다운 메뉴 클릭됨');
                                                    onDelete && onDelete();
                                                }}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                삭제
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            {/* 위치 정보 */}
                            {post.locationName && (
                                <div className="text-xs text-muted-foreground mt-1">
                                    📍 {post.locationName}
                                </div>
                            )}

                            {/* 프라이버시 배지 */}
                            <div className="mt-2">
                                <PostPrivacyBadge
                                    isPrivate={post.private}
                                    isFollowersOnly={post.followersOnly}
                                    size="sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 이미지 영역 */}
            {post.imageUrls && post.imageUrls.length > 0 && (
                <div className="bg-black">
                    <ImageCarousel images={post.imageUrls} />
                </div>
            )}

            {/* 액션 버튼 */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={handleLike}
                            disabled={isLikeLoading}
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
                            onClick={handleShare}
                        >
                            <Share2 className="h-6 w-6" />
                        </Button>
                    </div>
                </div>

                {likeCount > 0 && (
                    <p className="text-sm font-medium mb-2">
                        좋아요 {likeCount}개
                    </p>
                )}

                {/* 내용 */}
                <div className="text-sm">
                    <PostInfoContent post={post} showStats={false} />
                </div>
            </div>

            {/* 댓글 영역 */}
            <div className="overflow-hidden">
                <PostCommentList
                    postId={post.postId}
                    postAuthorId={post.authorId}
                    currentUserId={userId}
                    onLoginRequired={handleLoginRequired}
                    onProfileClick={onProfileClick}
                />
            </div>
        </div>
    );
};

export default VerticalPostLayout;
