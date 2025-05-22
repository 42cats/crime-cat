import React from "react";
import { Heart, Share2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCommentList } from "../post-comments";
import { UserPostDto } from "@/api/sns/post";
import { ProfileDetailDto } from "@/api/profile/detail";
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
}) => {
    return (
        <div className="bg-card border border-border rounded-md overflow-hidden">
            {/* 작성자 정보 */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex-1">
                    <PostAuthorInfo
                        authorNickname={post.authorNickname}
                        authorId={post.authorId}
                        authorAvatarUrl={post.authorAvatarUrl}
                        createdAt={post.createdAt}
                        locationName={post.locationName}
                        onAuthorClick={onProfileClick}
                        size="md"
                    />
                    <PostPrivacyBadge
                        isPrivate={post.private}
                        isFollowersOnly={post.followersOnly}
                        size="sm"
                        className="mt-2"
                    />
                </div>
                
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-5 w-5" />
                </Button>
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
                                className={`h-6 w-6 ${liked ? 'fill-red-500 text-red-500' : ''}`} 
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
                    <p className="text-sm font-medium mb-2">좋아요 {likeCount}개</p>
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